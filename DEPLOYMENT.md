# Deployment Guide - GitHub Pages Integration

This guide explains how the backend pipeline and frontend dashboard are integrated and deployed to GitHub Pages.

## Architecture

```
GitHub Actions (Weekly Schedule)
  ↓
1. Run Python Pipeline
   - Scrape reviews
   - Classify themes
   - Generate weekly pulses
   - Send email (unchanged)
  ↓
2. Copy Data to Frontend
   - Copy data/processed/* to frontend/public/data/processed/
   - Generate manifest.json for pulse files
  ↓
3. Build Frontend
   - Install dependencies
   - Build static Next.js site
  ↓
4. Deploy to GitHub Pages
   - Deploy frontend/out to gh-pages branch
```

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to your repository Settings
2. Navigate to **Pages** section
3. Under **Source**, select:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
4. Click **Save**

### 2. Verify Secrets

Ensure these secrets are set in GitHub (Settings → Secrets and variables → Actions):

- `GEMINI_API_KEY` - Your Gemini API key
- `EMAIL_RECIPIENT` - Email address for weekly pulses
- `GMAIL_USER` - Gmail account for sending emails
- `GMAIL_CREDENTIALS_JSON` - Gmail OAuth credentials (JSON string)
- `GMAIL_TOKEN_JSON` - Gmail OAuth token (JSON string)

### 3. First Deployment

The workflow will automatically:
1. Run on schedule (every Monday at 9 AM IST)
2. Or trigger manually via "Run workflow" button

After first run, your dashboard will be available at:
- `https://<your-username>.github.io/<repo-name>/`

### 4. Custom Domain (Optional)

If you have a custom domain:

1. Add `CNAME` file in `frontend/public/`:
   ```
   your-domain.com
   ```

2. Update workflow to include CNAME:
   ```yaml
   cname: your-domain.com
   ```

3. Configure DNS:
   - Add CNAME record pointing to `<username>.github.io`

## How It Works

### Weekly Pipeline (Unchanged)

The email generation continues to work exactly as before:
- Runs every Monday at 9 AM IST
- Generates weekly pulse
- Sends email to configured recipient
- **No changes to email functionality**

### Frontend Deployment (New)

After pipeline completes:
1. Data files are copied to `frontend/public/data/processed/`
2. Manifest file is generated for client-side discovery
3. Frontend is built as static site
4. Deployed to GitHub Pages

### Data Flow

```
Pipeline generates:
  data/processed/
    ├── weekly_pulse/
    │   ├── pulse_2025-11-24.json
    │   └── ...
    └── theme_aggregation.json

Copied to:
  frontend/public/data/processed/
    ├── weekly_pulse/
    │   ├── manifest.json (auto-generated)
    │   ├── pulse_2025-11-24.json
    │   └── ...
    └── theme_aggregation.json

Frontend reads from:
  /data/processed/ (served as static files)
```

## Manual Testing

### Test Pipeline Locally

```bash
# Run pipeline
python main.py --cron-tag local-test --email-single-latest

# Copy data to frontend
mkdir -p frontend/public/data/processed
cp -r data/processed/* frontend/public/data/processed/

# Generate manifest
cd frontend/public/data/processed/weekly_pulse
echo '{"files":[' > manifest.json
ls -1 pulse_*.json | sed 's/^/"/;s/$/",/' | sed '$ s/,$//' >> manifest.json
echo ']}' >> manifest.json

# Build frontend
cd frontend
npm install
npm run build

# Preview locally
npx serve frontend/out
```

### Test Frontend Locally

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

## Troubleshooting

### Frontend shows "No data found"

1. Check if data files exist in `frontend/public/data/processed/`
2. Verify manifest.json is generated correctly
3. Check browser console for fetch errors
4. Ensure files are committed to repository

### GitHub Pages shows 404

1. Verify `gh-pages` branch exists
2. Check Pages settings point to `gh-pages` branch
3. Wait a few minutes for deployment to complete
4. Check Actions tab for deployment errors

### Email not sending

- Email functionality is unchanged
- Check Gmail secrets are set correctly
- Verify `EMAIL_DRY_RUN: "false"` in workflow
- Check Actions logs for email errors

## File Structure

```
Milestone-2/
├── .github/
│   └── workflows/
│       └── weekly-run.yml      # Integrated workflow
├── frontend/                    # Next.js frontend
│   ├── app/                     # Pages
│   ├── components/              # React components
│   ├── lib/                     # Utilities
│   ├── public/
│   │   └── data/               # Data files (committed)
│   └── package.json
├── src/                         # Python backend
├── data/                        # Pipeline output
│   └── processed/              # Generated data
└── main.py                      # Pipeline entry point
```

## Updating Frontend

Frontend updates are automatically deployed when:
1. Code is pushed to main branch
2. Weekly pipeline runs (data updates)

To manually trigger:
1. Go to Actions tab
2. Select "Weekly App Review Pipeline & Frontend Deploy"
3. Click "Run workflow"

## Notes

- Email generation is **completely unchanged** and runs as before
- Frontend is deployed separately and doesn't affect email
- Data is copied fresh on each pipeline run
- All data files are committed to repository for GitHub Pages

