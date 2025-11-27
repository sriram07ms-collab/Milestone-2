"""Fixed theme configuration for Layer 2 classification."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict


@dataclass(slots=True)
class ThemeDefinition:
    """Definition of a fixed theme for review classification."""

    id: str
    name: str
    description: str


# Fixed set of themes for review classification
FIXED_THEMES: Dict[str, ThemeDefinition] = {
    "customer_support": ThemeDefinition(
        id="customer_support",
        name="Customer Support",
        description="Support responsiveness, callbacks, issue resolution timelines, and customer service quality.",
    ),
    "payments": ThemeDefinition(
        id="payments",
        name="Payments",
        description="Deposits, withdrawals, UPI/Autopay failures, settlement delays, and transaction reliability.",
    ),
    "fees": ThemeDefinition(
        id="fees",
        name="Fees & Charges",
        description="Brokerage, hidden charges, deductions, taxation concerns, and financial transparency.",
    ),
    "glitches": ThemeDefinition(
        id="glitches",
        name="Glitches & Bugs",
        description="Crashes, broken features, order placement errors, incorrect balances, and functional defects.",
    ),
    "slow": ThemeDefinition(
        id="slow",
        name="Slow Performance",
        description="Lag, loading delays, buffering, login slowness, and general performance complaints.",
    ),
    "unclassified": ThemeDefinition(
        id="unclassified",
        name="Unclassified",
        description="Used when the classifier or heuristics cannot confidently map the review to a defined theme.",
    ),
}

# Default theme for invalid/empty classifications
DEFAULT_THEME_ID = "unclassified"


def get_theme_by_id(theme_id: str) -> ThemeDefinition:
    """Get theme definition by ID, with fallback to default."""
    return FIXED_THEMES.get(theme_id.lower(), FIXED_THEMES[DEFAULT_THEME_ID])


def get_all_theme_ids() -> list[str]:
    """Return list of all valid theme IDs."""
    return list(FIXED_THEMES.keys())


def format_themes_for_prompt() -> str:
    """Format themes for LLM classification prompt."""
    lines = []
    for idx, (theme_id, theme) in enumerate(FIXED_THEMES.items(), start=1):
        lines.append(f"{idx}. {theme.name} ({theme_id}) – {theme.description}")
    return "\n".join(lines)


def get_theme_by_id_or_discovered(
    theme_id: str,
    discovered_themes: list | None = None,
) -> ThemeDefinition:
    """
    Get theme definition, checking discovered themes first, then predefined.
    
    Args:
        theme_id: Theme ID to look up
        discovered_themes: Optional list of DiscoveredTheme objects
        
    Returns:
        ThemeDefinition (from discovered theme or predefined theme)
    """
    if discovered_themes:
        from .theme_discovery import DiscoveredTheme
        
        discovered = next(
            (t for t in discovered_themes if isinstance(t, DiscoveredTheme) and t.theme_id.lower() == theme_id.lower()),
            None
        )
        if discovered:
            # If mapped to predefined, return predefined
            if discovered.mapped_to_predefined:
                return FIXED_THEMES[discovered.mapped_to_predefined]
            # Otherwise, create a dynamic theme definition from discovered theme
            return ThemeDefinition(
                id=discovered.theme_id,
                name=discovered.theme_name,
                description=discovered.description
            )
    
    # Fallback to predefined
    return get_theme_by_id(theme_id)


