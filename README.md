## App Review Insights Analyzer

App Review Insights Analyzer turns the last 4 weeks of public Play Store reviews into a weekly one-page pulse. The system ingests reviews without logins, deduplicates and sanitizes them, groups the feedback into up to five product themes, surfaces the strongest insights and representative user quotes, and proposes concrete actions. Each weekly pulse is then converted into a draft email so stakeholders can consume the note directly in their inbox—while respecting public-data-only constraints and aggressively stripping any PII. This milestone showcases applied LLM orchestration, summarization, theme grouping, and workflow automation working end-to-end on live data.

### Project Architecture

1. **Layer 1 – Ingestion & Cleaning**  
   - HTTP scraper hits the Play Store `batchexecute` endpoint using staged window slices to gather 4 weeks of reviews across star ratings.  
   - Enforces per-rating targets, deduplicates IDs, removes short/empty texts, normalizes whitespace, and strips obvious PII before any LLM call.  
   - Outputs weekly JSON buckets for downstream processing.

2. **Layer 2 – Theme Classification**  
   - Gemini-based classifier maps each review into 5 fixed business themes (`customer_support`, `payments`, `fees`, `glitches`, `slow`) with an `unclassified` fallback.  
   - Uses expanded keyword heuristics (onboarding, KYC, payments, statements, withdrawals, login issues, performance, etc.) so short/ambiguous reviews still land in a meaningful theme when possible.  
   - Runs a **two-pass** strategy: first pass does normal classification; a second pass re-classifies previously `unclassified` reviews with a stricter prompt that forbids `unclassified` and forces the closest theme.  
   - Optionally allows the LLM to propose **new theme IDs** (for analysis only), which are tracked and written to `data/processed/llm_suggested_themes.json`.  
   - Aggregates counts, example quotes, and representative actions per theme.

3. **Layer 3 – Weekly Pulse Generation**  
   - Loads each weekly bucket (requires ≥3 reviews), builds map/reduce prompts, and composes a one-page Markdown note with title, overview, key themes, quotes, and action ideas.  
   - Hardened JSON parsing handles Gemini finish reasons and malformed payloads.

4. **Layer 4 – Email Drafting & Delivery**  
   - Sanitizes the weekly note (emoji removal, sensitive-language masking).  
   - Drafts the email body via Gemini with retries and fallback templates, runs regex + LLM-based PII scrubbing, and sends via Gmail API or SMTP.  
   - Logs every send (or dry run) in `data/processed/email_logs.csv`.

5. **Frontend Dashboard** (New)
   - Modern Next.js dashboard for visualizing weekly pulses, themes, and action items
   - Deployed to GitHub Pages automatically after each pipeline run
   - See `DEPLOYMENT.md` for setup instructions

---

### 1. Prerequisites

- Python 3.10+
- Node.js 20+ (for frontend)
- Google Gemini API key (free tier works)
- Internet access to Google Play + Gemini endpoints

---

### 2. Setup

#### Backend Setup

```bash
python -m venv .venv
.venv\Scripts\activate        # PowerShell / cmd
pip install -r requirements.txt
python -m playwright install chromium
copy config\.env.example .env
```

Fill `.env` with:
- `GEMINI_API_KEY`
- Optional overrides (see `.env.example`)

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev  # For local development
```

---

### 3. Running locally

#### Backend Pipeline

```bash
python main.py
```

#### Frontend Dashboard

```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

---

### 4. Deployment to GitHub Pages

The project is configured for automatic deployment to GitHub Pages. See `DEPLOYMENT.md` for detailed instructions.

**Quick Setup:**
1. Enable GitHub Pages in repository settings
2. Set source to `gh-pages` branch
3. Push code to GitHub
4. Workflow runs automatically every Monday at 9 AM IST
5. Dashboard available at: `https://<username>.github.io/<repo-name>/`

**Note:** Email generation continues to work exactly as before - no changes to email functionality.

---

### 5. Project Structure

```
Milestone-2/
├── .github/
│   └── workflows/
│       └── weekly-run.yml      # Integrated pipeline + frontend deploy
├── frontend/                   # Next.js dashboard
│   ├── app/                    # Pages
│   ├── components/             # React components
│   ├── lib/                    # Utilities
│   └── public/data/            # Data files (for GitHub Pages)
├── src/                        # Python backend layers
├── scripts/                    # Utility scripts
├── data/                       # Pipeline output
└── main.py                     # Pipeline entry point
```

---

### 6. Outputs

- Raw batch: `data/raw/groww_reviews_<start>_<end>.json`
- Weekly buckets: `data/raw/weekly/week_<YYYY-MM-DD>.json`
- Theme aggregation: `data/processed/theme_aggregation.json`
- Review classifications: `data/processed/review_classifications.json`
- Weekly pulse notes: `data/processed/weekly_pulse/pulse_<YYYY-MM-DD>.json`
- Markdown render: `data/processed/weekly_pulse/pulse_<YYYY-MM-DD>.md`
- **Frontend Dashboard**: Deployed to GitHub Pages

---

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)
