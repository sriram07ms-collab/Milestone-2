# Deployment Checklist - GitHub Pages Integration

## ✅ Pre-Deployment Checklist

### Repository Setup
- [x] Frontend integrated into `frontend/` directory
- [x] GitHub Actions workflow updated
- [x] Next.js configured for static export
- [x] Data files copied to `frontend/public/data/processed/`
- [x] Manifest generation script created
- [x] Build tested and working

### GitHub Configuration
- [ ] Repository pushed to GitHub
- [ ] GitHub Pages enabled (Settings → Pages)
- [ ] Source set to `gh-pages` branch
- [ ] All secrets configured:
  - [ ] `GEMINI_API_KEY`
  - [ ] `EMAIL_RECIPIENT`
  - [ ] `GMAIL_USER`
  - [ ] `GMAIL_CREDENTIALS_JSON`
  - [ ] `GMAIL_TOKEN_JSON`

## 🚀 Deployment Steps

### Step 1: Push to GitHub
```bash
cd C:\Users\SM095616\Milestone-2
git add .
git commit -m "Integrate frontend and backend for GitHub Pages deployment"
git push origin main
```

### Step 2: Enable GitHub Pages
1. Go to: `https://github.com/<username>/<repo>/settings/pages`
2. Under **Source**:
   - Branch: `gh-pages`
   - Folder: `/ (root)`
3. Click **Save**

### Step 3: Verify Workflow
1. Go to **Actions** tab
2. Check workflow runs successfully
3. Wait for deployment (2-5 minutes)

### Step 4: Access Dashboard
- URL: `https://<username>.github.io/<repo-name>/`
- Test all pages:
  - [ ] Dashboard loads
  - [ ] Pulses list works
  - [ ] Pulse detail pages work
  - [ ] Themes page loads
  - [ ] Actions page loads

## 🔄 Weekly Automation

The workflow runs automatically every Monday at 9 AM IST:
1. ✅ Pipeline runs (unchanged)
2. ✅ Email sent (unchanged)
3. ✅ Data copied to frontend
4. ✅ Frontend rebuilt
5. ✅ Deployed to GitHub Pages

## 📊 Verification

After first deployment, verify:
- [ ] Dashboard shows data
- [ ] Charts render correctly
- [ ] Navigation works
- [ ] All pages accessible
- [ ] Email still sends (check next Monday)

## 🐛 Troubleshooting

### Dashboard shows "No data"
- Check `frontend/public/data/processed/` exists in repo
- Verify manifest.json is generated
- Check browser console for errors

### 404 on pulse detail pages
- Verify `generateStaticParams` generates all weeks
- Check workflow logs for build errors
- Ensure manifest.json has all files

### Email not sending
- Email functionality unchanged
- Check Gmail secrets
- Review workflow logs

## 📝 Files to Commit

Make sure these are committed:
- ✅ `frontend/` directory (entire frontend)
- ✅ `.github/workflows/weekly-run.yml` (updated workflow)
- ✅ `scripts/generate-manifest.py` (manifest generator)
- ✅ `frontend/public/data/processed/` (data files)
- ✅ `.gitignore` (updated for monorepo)

## 🎯 Success Criteria

- [x] Frontend builds successfully
- [x] All pages work locally
- [ ] GitHub Pages accessible
- [ ] Data displays correctly
- [ ] Email generation unchanged
- [ ] Weekly automation works

---

**Ready to deploy!** Follow the steps above to go live.

