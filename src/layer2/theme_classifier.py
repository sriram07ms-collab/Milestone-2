"""LLM-based review classification into fixed themes."""

from __future__ import annotations

import json
import logging
import os
import time
from dataclasses import dataclass
from typing import Dict, List, Mapping
import re

from google import generativeai as genai

from ..layer1.validator import ReviewModel
from .theme_config import DEFAULT_THEME_ID, FIXED_THEMES, ThemeDefinition, get_theme_by_id, get_all_theme_ids
from .theme_discovery import DiscoveredTheme

LOGGER = logging.getLogger(__name__)

# Expanded heuristic patterns to reduce "unclassified" assignments.
# These are deliberately broad so that in absence of LLM output we still
# map reviews into one of the fixed business themes.
HEURISTIC_PATTERNS: Dict[str, List[re.Pattern]] = {
    "customer_support": [
        re.compile(pattern, re.IGNORECASE)
        for pattern in [
            r"customer support",
            r"support team",
            r"call back",
            r"callback",
            r"contacted support",
            r"ticket",
            r"agent",
            r"on[-\s]?board",
            r"onboarding",
            r"\bkyc\b",
            r"know your customer",
            r"verification",
            r"kyc update",
            r"re[-\s]?kyc",
            r"e-?kyc",
            # Broader service / help phrases
            r"\bhelp\b",
            r"assistance",
            r"customer care",
            r"service team",
            r"support staff",
            r"no response",
            r"did not respond",
            r"no reply",
            r"never replied",
            r"complaint",
            r"raised a ticket",
            r"escalat(ed|ion)",
        ]
    ],
    "payments": [
        re.compile(pattern, re.IGNORECASE)
        for pattern in [
            r"payment",
            r"payout",
            r"withdraw",
            r"withdrawal",
            r"deposit",
            r"upi",
            r"autopay",
            r"transfer",
            r"bank",
            r"statement",
            r"passbook",
            r"settlement",
            r"refund",
            r"redeem",
            # Money / trading / transaction language
            r"money",
            r"amount",
            r"cash",
            r"transaction",
            r"txn",
            r"order",
            r"trade",
            r"buy",
            r"sell",
            r"position",
            r"portfolio",
            r"balance",
            r"credit",
            r"debit",
        ]
    ],
    "fees": [
        re.compile(pattern, re.IGNORECASE)
        for pattern in [
            r"fee",
            r"fees",
            r"charges?",
            r"commission",
            r"deduct",
            r"deduction",
            r"charged",
            r"tax",
            r"gst",
            r"hidden charge",
            r"extra charge",
            r"penalty",
            r"fine",
            r"brokerage",
        ]
    ],
    "glitches": [
        re.compile(pattern, re.IGNORECASE)
        for pattern in [
            r"bug",
            r"error",
            r"glitch",
            r"crash",
            r"issue",
            r"fail(ed)?",
            r"failed",
            r"failure",
            r"not working",
            r"does(?:n't| not) work",
            r"stuck on",
            r"freeze[sd]?",
            r"frozen",
            r"wrong data",
            r"incorrect",
            r"mismatch",
            r"problem",
            r"unable to",
            r"cannot",
            r"can't",
        ]
    ],
    "slow": [
        re.compile(pattern, re.IGNORECASE)
        for pattern in [
            r"slow",
            r"lag",
            r"buffer",
            r"loading",
            r"load time",
            r"taking too long",
            r"takes too long",
            r"hang",
            r"hanging",
            r"delay",
            r"delayed",
            r"latency",
            r"unresponsive",
            r"not responding",
            r"stuck on loading",
        ]
    ],
}

CLASSIFICATION_PROMPT_TEMPLATE = """You are tagging reviews into themes.

Available predefined themes:
{themes_list}

IMPORTANT: You can either:
1. Use one of the predefined themes above (use the exact theme_id: {theme_ids})
2. Suggest a NEW theme if the review doesn't fit any predefined theme

If suggesting a new theme, provide:
- chosen_theme: a short, lowercase theme_id with underscores (e.g., "account_issues", "trading_features", "security_concerns")
- suggested_theme_name: a clear 2-4 word name (e.g., "Account Issues", "Trading Features", "Security Concerns")
- suggested_theme_description: a brief 1-2 sentence description of what this theme covers

For each review, output:
- review_id: the exact review_id from the input
- chosen_theme: either a predefined theme_id OR a new suggested theme_id
- short_reason: 1 sentence explaining why this theme was chosen (no PII, no personal information)
- suggested_theme_name: (only if chosen_theme is new) the theme name
- suggested_theme_description: (only if chosen_theme is new) the theme description

Return valid JSON array with one object per review. Format:
[
  {{"review_id": "...", "chosen_theme": "...", "short_reason": "...", "suggested_theme_name": "...", "suggested_theme_description": "..."}},
  {{"review_id": "...", "chosen_theme": "...", "short_reason": "..."}}
]

Reviews:
{reviews_batch}

Return only the JSON array, no additional text."""


UNCLASSIFIED_REVIEW_PROMPT_TEMPLATE = """You are re-classifying reviews that were previously marked as \"unclassified\".

Available themes:
{themes_list}

IMPORTANT RULES:
- You MUST assign every review to the closest theme_id from this list: {theme_ids_no_unclassified}
- Do NOT use \"unclassified\" as chosen_theme.
- If the review is ambiguous, choose the theme that is most related to the main issue.

Use these hints:
- account access, login, verification, contacting the company, tickets → customer_support
- deposits, withdrawals, orders, trades, balances, money movement → payments
- fees, charges, commissions, deductions, penalties, taxes → fees
- bugs, crashes, wrong values, features not working → glitches
- slowness, loading issues, lag, freezing, hanging → slow

For each review, output:
- review_id: the exact review_id from the input
- chosen_theme: one of the allowed theme_ids above (NEVER \"unclassified\")
- short_reason: 1 sentence explaining why this theme was chosen (no PII, no personal information)

Return valid JSON array with one object per review. Format:
[
  {{\"review_id\": \"...\", \"chosen_theme\": \"...\", \"short_reason\": \"...\"}},
  {{\"review_id\": \"...\", \"chosen_theme\": \"...\", \"short_reason\": \"...\"}}
]

Reviews:
{reviews_batch}

Return only the JSON array, no additional text."""


@dataclass(slots=True)
class ReviewClassification:
    """Classification result for a single review."""

    review_id: str
    theme_id: str
    theme_name: str
    reason: str


@dataclass(slots=True)
class ThemeClassifierConfig:
    """Configuration for theme classifier."""

    model_name: str = "models/gemini-2.5-flash"  # Latest stable flash model for fast classification
    batch_size: int = 8  # Process 8 reviews per LLM call
    temperature: float = 0.1  # Low temperature for consistent classification
    max_retries: int = 3  # Increased for better quota error recovery (4 total attempts)
    use_discovery: bool = False  # Disabled by default; rely on fixed themes
    discovery_sample_size: int = 50  # Reviews to sample for discovery
    min_discovery_confidence: float = 0.6  # Minimum mapping confidence
    max_discovered_themes: int = 4  # Maximum discovered themes to use


class GeminiThemeClassifier:
    """Classifies reviews into fixed themes using Gemini LLM."""

    def __init__(
        self,
        api_key: str | None = None,
        config: ThemeClassifierConfig | None = None,
        discovered_themes: List[DiscoveredTheme] | None = None,
    ) -> None:
        self.config = config or ThemeClassifierConfig()
        api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY is not set.")
        genai.configure(api_key=api_key)
        # Use model from env or config, with fallback to stable models
        configured_name = os.getenv("GEMINI_MODEL_NAME", self.config.model_name)
        candidates = [
            configured_name,
            self.config.model_name,
            "models/gemini-2.5-flash",  # Latest stable flash - best for classification
            "models/gemini-2.0-flash",  # Stable flash fallback
            "models/gemini-2.5-pro",    # Pro version if flash unavailable
        ]
        for candidate in candidates:
            try:
                self.model = genai.GenerativeModel(candidate)
                LOGGER.info("Using Gemini model: %s", candidate)
                break
            except Exception as exc:
                LOGGER.debug("Model %s failed: %s", candidate, exc)
                continue
        else:
            raise RuntimeError(f"Could not initialize any Gemini model. Tried candidates: {candidates}")
        
        # Handle discovered themes
        self.discovered_themes = discovered_themes or []
        self.use_discovered = (
            self.config.use_discovery
            and self.discovered_themes
            and len(self.discovered_themes) > 0
        )
        
        # Track LLM-suggested themes (dynamically created during classification)
        self.llm_suggested_themes: Dict[str, ThemeDefinition] = {}
        
        if self.use_discovered:
            # Limit to max_discovered_themes
            self.discovered_themes = self.discovered_themes[:self.config.max_discovered_themes]
            LOGGER.info(
                "Using %s discovered themes for classification",
                len(self.discovered_themes)
            )
            self.themes_list = self._build_discovered_themes_list()
            self.theme_ids_str = ", ".join(t.theme_id for t in self.discovered_themes)
        else:
            LOGGER.info("Using predefined themes for classification")
            self.themes_list = self._build_themes_list()
            self.theme_ids_str = ", ".join(get_all_theme_ids())

    def _build_themes_list(self) -> str:
        """Build formatted themes list for prompt (predefined themes)."""
        lines = []
        for idx, (theme_id, theme) in enumerate(FIXED_THEMES.items(), start=1):
            lines.append(f"{idx}. {theme.name} ({theme_id}) – {theme.description}")
        return "\n".join(lines)

    def _build_discovered_themes_list(self) -> str:
        """Build formatted themes list for prompt (discovered themes)."""
        lines = []
        for idx, theme in enumerate(self.discovered_themes, start=1):
            keywords_str = ", ".join(theme.keywords[:3]) if theme.keywords else "N/A"
            lines.append(
                f"{idx}. {theme.theme_name} ({theme.theme_id}) – {theme.description} "
                f"[Keywords: {keywords_str}]"
            )
        return "\n".join(lines)

    def classify_reviews(
        self,
        reviews: List[ReviewModel],
    ) -> List[ReviewClassification]:
        """Classify a list of reviews into fixed themes with a two-pass strategy.

        Pass 1:
            - Normal batching + classification using the main prompt.
        Pass 2:
            - Identify reviews classified as DEFAULT_THEME_ID (\"unclassified\").
            - Re-classify those reviews with a stricter prompt that forbids
              using \"unclassified\" and forces the closest theme.
        """
        if not reviews:
            return []

        # ---------- First pass: standard classification ----------
        classifications: List[ReviewClassification] = []
        batches = [
            reviews[i : i + self.config.batch_size]
            for i in range(0, len(reviews), self.config.batch_size)
        ]

        for batch_idx, batch in enumerate(batches, start=1):
            LOGGER.debug("Classifying batch %s/%s (%s reviews)", batch_idx, len(batches), len(batch))
            batch_classifications = self._classify_batch(batch)
            classifications.extend(batch_classifications)
            # Small delay between batches to avoid rate limiting (skip delay after last batch)
            if batch_idx < len(batches):
                time.sleep(1)

        # Build lookup for first-pass results
        first_pass_by_id: Dict[str, ReviewClassification] = {
            c.review_id: c for c in classifications
        }

        # ---------- Second pass: focus only on "unclassified" ----------
        unclassified_reviews: List[ReviewModel] = []
        for review in reviews:
            cls = first_pass_by_id.get(review.review_id)
            if cls is None or cls.theme_id == DEFAULT_THEME_ID:
                unclassified_reviews.append(review)

        if not unclassified_reviews:
            return classifications

        LOGGER.info(
            "Second-pass classification: %s reviews previously unclassified",
            len(unclassified_reviews),
        )

        second_pass_results = self._classify_unclassified_reviews(unclassified_reviews)

        # Merge: only override if the second pass produced a non-default theme
        for cls in second_pass_results:
            if cls.theme_id == DEFAULT_THEME_ID:
                continue
            first_pass_by_id[cls.review_id] = cls

        # Preserve original order as much as possible
        merged: List[ReviewClassification] = []
        seen: set[str] = set()
        for review in reviews:
            cls = first_pass_by_id.get(review.review_id)
            if cls and cls.review_id not in seen:
                merged.append(cls)
                seen.add(cls.review_id)

        return merged

    def _classify_unclassified_reviews(
        self,
        reviews: List[ReviewModel],
    ) -> List[ReviewClassification]:
        """Second-pass classification for previously unclassified reviews."""
        if not reviews:
            return []

        results: List[ReviewClassification] = []
        batches = [
            reviews[i : i + self.config.batch_size]
            for i in range(0, len(reviews), self.config.batch_size)
        ]

        for batch_idx, batch in enumerate(batches, start=1):
            LOGGER.debug(
                "Second-pass: classifying batch %s/%s (%s reviews)",
                batch_idx,
                len(batches),
                len(batch),
            )
            batch_results = self._classify_unclassified_batch(batch)
            results.extend(batch_results)
            # Small delay between batches to avoid rate limiting (skip delay after last batch)
            if batch_idx < len(batches):
                time.sleep(1)

        return results

    def _classify_batch(self, reviews: List[ReviewModel]) -> List[ReviewClassification]:
        """Classify a single batch of reviews."""
        reviews_text = self._format_reviews_for_prompt(reviews)
        max_themes = (
            min(len(self.discovered_themes), self.config.max_discovered_themes)
            if self.use_discovered
            else len(FIXED_THEMES)
        )
        prompt = CLASSIFICATION_PROMPT_TEMPLATE.format(
            max_themes=max_themes,
            themes_list=self.themes_list,
            theme_ids=self.theme_ids_str,
            reviews_batch=reviews_text,
        )

        for attempt in range(self.config.max_retries + 1):
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.GenerationConfig(
                        temperature=self.config.temperature,
                        response_mime_type="application/json",
                    ),
                )
                parsed = self._parse_response(response.text or "")
                if not parsed:
                    raise ValueError("Empty classification payload")
                return self._build_classifications(parsed, reviews)
            except Exception as exc:
                error_message = str(exc).lower()
                is_quota_error = "429" in str(exc) or "quota" in error_message or "rate limit" in error_message
                
                if attempt < self.config.max_retries:
                    if is_quota_error:
                        # Exponential backoff for quota errors: 30s, 60s, 120s, etc.
                        delay = 30 * (2 ** attempt)
                        LOGGER.warning(
                            "Classification attempt %s failed with quota error: %s. Retrying after %ss...",
                            attempt + 1, exc, delay
                        )
                        time.sleep(delay)
                    else:
                        # Shorter delay for other errors: 2s, 4s, 8s
                        delay = 2 * (2 ** attempt)
                        LOGGER.warning(
                            "Classification attempt %s failed: %s. Retrying after %ss...",
                            attempt + 1, exc, delay
                        )
                        time.sleep(delay)
                else:
                    LOGGER.error("Classification failed after %s attempts: %s", self.config.max_retries + 1, exc)
                    return self._fallback_classifications(reviews)

    def _classify_unclassified_batch(
        self,
        reviews: List[ReviewModel],
    ) -> List[ReviewClassification]:
        """Classify a batch of previously unclassified reviews using a stricter prompt."""
        reviews_text = self._format_reviews_for_prompt(reviews)

        # Build a theme_ids string that excludes the default "unclassified"
        all_ids = [tid.strip() for tid in get_all_theme_ids()]
        allowed_ids = [tid for tid in all_ids if tid != DEFAULT_THEME_ID]
        theme_ids_no_unclassified = ", ".join(allowed_ids)

        prompt = UNCLASSIFIED_REVIEW_PROMPT_TEMPLATE.format(
            themes_list=self.themes_list,
            theme_ids_no_unclassified=theme_ids_no_unclassified,
            reviews_batch=reviews_text,
        )

        for attempt in range(self.config.max_retries + 1):
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.GenerationConfig(
                        temperature=self.config.temperature,
                        response_mime_type="application/json",
                    ),
                )
                parsed = self._parse_response(response.text or "")
                if not parsed:
                    raise ValueError("Empty classification payload (second pass)")
                return self._build_classifications(parsed, reviews)
            except Exception as exc:
                error_message = str(exc).lower()
                is_quota_error = "429" in str(exc) or "quota" in error_message or "rate limit" in error_message
                
                if attempt < self.config.max_retries:
                    if is_quota_error:
                        # Exponential backoff for quota errors: 30s, 60s, 120s, etc.
                        delay = 30 * (2 ** attempt)
                        LOGGER.warning(
                            "Second-pass classification attempt %s failed with quota error: %s. Retrying after %ss...",
                            attempt + 1, exc, delay
                        )
                        time.sleep(delay)
                    else:
                        # Shorter delay for other errors: 2s, 4s, 8s
                        delay = 2 * (2 ** attempt)
                        LOGGER.warning(
                            "Second-pass classification attempt %s failed: %s. Retrying after %ss...",
                            attempt + 1, exc, delay
                        )
                        time.sleep(delay)
                else:
                    LOGGER.error(
                        "Second-pass classification failed after %s attempts: %s",
                        self.config.max_retries + 1,
                        exc,
                    )
                    # If second pass fails, fall back to original default/heuristic
                    return self._fallback_classifications(reviews)

    def _format_reviews_for_prompt(self, reviews: List[ReviewModel]) -> str:
        """Format reviews as text for prompt."""
        lines = []
        for review in reviews:
            # Truncate text to avoid token limits
            text_preview = review.text[:400] + ("..." if len(review.text) > 400 else "")
            lines.append(f"review_id: {review.review_id}\ntitle: {review.title}\ntext: {text_preview}")
        return "\n\n---\n\n".join(lines)

    def _parse_response(self, payload: str) -> List[Dict]:
        """Parse LLM JSON response."""
        cleaned = payload.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.startswith("json"):
                cleaned = cleaned[4:].strip()
            cleaned = cleaned.split("\n", 1)[-1] if "\n" in cleaned else cleaned

        try:
            data = json.loads(cleaned)
            if isinstance(data, list):
                return data
            if isinstance(data, dict) and "reviews" in data:
                return data["reviews"]
            return [data]  # Single object wrapped
        except json.JSONDecodeError as exc:
            LOGGER.warning("Failed to parse JSON response: %s. Raw: %s", exc, cleaned[:200])
            return []

    def _build_classifications(
        self,
        parsed: List[Dict],
        original_reviews: List[ReviewModel],
    ) -> List[ReviewClassification]:
        """Build ReviewClassification objects from parsed LLM response."""
        review_lookup = {r.review_id: r for r in original_reviews}
        classifications: List[ReviewClassification] = []

        for item in parsed:
            review_id = item.get("review_id", "")
            if not review_id or review_id not in review_lookup:
                LOGGER.warning("Skipping classification with invalid review_id: %s", review_id)
                continue

            theme_id_raw = item.get("chosen_theme", "").lower().strip()
            
            # Check if this is an LLM-suggested theme
            suggested_name = item.get("suggested_theme_name", "").strip()
            suggested_desc = item.get("suggested_theme_description", "").strip()
            
            if suggested_name and suggested_desc:
                # This is a new LLM-suggested theme
                if theme_id_raw not in self.llm_suggested_themes:
                    self.llm_suggested_themes[theme_id_raw] = ThemeDefinition(
                        id=theme_id_raw,
                        name=suggested_name,
                        description=suggested_desc
                    )
                    LOGGER.info(
                        "LLM suggested new theme: %s (%s) - %s",
                        suggested_name, theme_id_raw, suggested_desc[:80]
                    )
                theme = self.llm_suggested_themes[theme_id_raw]
                theme_id = theme_id_raw
            else:
                # Use existing validation logic for predefined/discovered themes
                theme_id = self._validate_theme_id(theme_id_raw)
                
                # Get theme definition (discovered or predefined)
                if self.use_discovered:
                    discovered = next(
                        (t for t in self.discovered_themes if t.theme_id.lower() == theme_id),
                        None
                    )
                    if discovered:
                        # Use discovered theme if not mapped, otherwise use predefined
                        if discovered.mapped_to_predefined:
                            theme = get_theme_by_id(discovered.mapped_to_predefined)
                        else:
                            # Create a temporary theme definition from discovered theme
                            theme = ThemeDefinition(
                                id=discovered.theme_id,
                                name=discovered.theme_name,
                                description=discovered.description
                            )
                    else:
                        theme = get_theme_by_id(theme_id)
                else:
                    theme = get_theme_by_id(theme_id)
            
            reason = item.get("short_reason", "No reason provided")

            classifications.append(
                ReviewClassification(
                    review_id=review_id,
                    theme_id=theme_id,
                    theme_name=theme.name,
                    reason=reason,
                )
            )

        # Handle reviews that weren't classified
        classified_ids = {c.review_id for c in classifications}
        for review in original_reviews:
            if review.review_id not in classified_ids:
                theme_id = self._heuristic_theme(review) or DEFAULT_THEME_ID
                theme = get_theme_by_id(theme_id)
                reason = (
                    "Heuristic assignment (LLM output invalid)"
                    if theme_id != DEFAULT_THEME_ID
                    else "Default assignment (classification failed)"
                )
                if theme_id == DEFAULT_THEME_ID:
                    LOGGER.warning("Review %s not classified; using default theme", review.review_id)
                else:
                    LOGGER.info(
                        "Review %s assigned via heuristic to %s",
                        review.review_id,
                        theme.name,
                    )
                classifications.append(
                    ReviewClassification(
                        review_id=review.review_id,
                        theme_id=theme_id,
                        theme_name=theme.name,
                        reason=reason,
                    )
                )

        return classifications

    def _validate_theme_id(self, theme_id: str) -> str:
        """Validate and normalize theme ID, with fallback to default."""
        theme_id = theme_id.lower().strip()
        
        # Check LLM-suggested themes first
        if theme_id in self.llm_suggested_themes:
            return theme_id
        
        if self.use_discovered:
            # Check if it's a discovered theme
            discovered = next(
                (t for t in self.discovered_themes if t.theme_id.lower() == theme_id),
                None
            )
            if discovered:
                # If mapped to predefined, return predefined theme_id
                if discovered.mapped_to_predefined:
                    LOGGER.debug(
                        "Mapped discovered theme '%s' to predefined '%s'",
                        theme_id, discovered.mapped_to_predefined
                    )
                    return discovered.mapped_to_predefined
                # Use discovered theme_id even if unmapped (it's a valid discovered theme)
                LOGGER.debug(
                    "Using discovered theme '%s' (unmapped, confidence: %.2f)",
                    theme_id, discovered.confidence
                )
                return theme_id
            
            # Try fuzzy matching with discovered themes
            for discovered_theme in self.discovered_themes:
                if theme_id in discovered_theme.theme_id or discovered_theme.theme_id in theme_id:
                    if discovered_theme.mapped_to_predefined:
                        return discovered_theme.mapped_to_predefined
                    # Return discovered theme_id even if unmapped
                    return discovered_theme.theme_id
        
        # Fallback to predefined themes
        if theme_id in FIXED_THEMES:
            return theme_id

        # Try fuzzy matching with predefined themes
        for valid_id in FIXED_THEMES.keys():
            if valid_id in theme_id or theme_id in valid_id:
                LOGGER.debug("Fuzzy matched theme_id '%s' to '%s'", theme_id, valid_id)
                return valid_id

        # If not found in predefined/discovered, check if it's a valid-looking new theme
        # (contains only alphanumeric, underscores, and hyphens, not empty, reasonable length)
        if theme_id and len(theme_id) <= 50:
            # Check if it's a valid identifier (alphanumeric with underscores/hyphens)
            cleaned = theme_id.replace("_", "").replace("-", "")
            if cleaned.isalnum() and len(theme_id) >= 3:
                LOGGER.info("Accepting LLM-suggested theme_id: %s (will be created if not exists)", theme_id)
                return theme_id

        LOGGER.warning("Invalid theme_id '%s'; using default '%s'", theme_id, DEFAULT_THEME_ID)
        return DEFAULT_THEME_ID

    def _fallback_classifications(self, reviews: List[ReviewModel]) -> List[ReviewClassification]:
        """Generate fallback classifications when LLM fails."""
        fallback: List[ReviewClassification] = []
        for review in reviews:
            theme_id = self._heuristic_theme(review) or DEFAULT_THEME_ID
            theme = get_theme_by_id(theme_id)
            reason = (
                "Heuristic assignment (LLM classification failed)"
                if theme_id != DEFAULT_THEME_ID
                else "Fallback assignment (LLM classification failed)"
            )
            fallback.append(
                ReviewClassification(
                    review_id=review.review_id,
                    theme_id=theme_id,
                    theme_name=theme.name,
                    reason=reason,
                )
            )
        return fallback

    def _heuristic_theme(self, review: ReviewModel) -> str | None:
        text = f"{review.title} {review.text}".lower()
        for theme_id, compiled_patterns in HEURISTIC_PATTERNS.items():
            if any(pattern.search(text) for pattern in compiled_patterns):
                return theme_id
        return None

    def get_llm_suggested_themes(self) -> Dict[str, ThemeDefinition]:
        """Get all LLM-suggested themes from this classification run."""
        return self.llm_suggested_themes.copy()

