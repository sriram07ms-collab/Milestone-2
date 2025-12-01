# Quick Start Guide

## First Time Setup

1. **Navigate to the frontend directory:**
   ```powershell
   cd C:\Users\SM095616\app-review-dashboard
   ```

2. **Install dependencies (if not already done):**
   ```powershell
   npm install
   ```

3. **Sync data from main project:**
   ```powershell
   .\sync-data.ps1
   ```
   
   Or manually:
   ```powershell
   Copy-Item -Path "..\Milestone-2\data\processed" -Destination "public\data\processed" -Recurse -Force
   ```

4. **Start the development server:**
   ```powershell
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## After Running the Pipeline

Whenever you run the main Python pipeline and generate new data:

1. **Sync the updated data:**
   ```powershell
   .\sync-data.ps1
   ```

2. **Restart the dev server** (or it will auto-reload)

## Available Pages

- **Dashboard** (`/`) - Overview with cards, charts, and latest pulse
- **Weekly Pulses** (`/pulses`) - List of all weekly pulse notes
- **Pulse Detail** (`/pulses/[week]`) - Detailed view of a specific pulse
- **Theme Explorer** (`/themes`) - Browse all themes with trends
- **Action Ideas** (`/actions`) - Prioritized action items board

## Troubleshooting

### No data showing?

1. Check if data files exist:
   ```powershell
   Test-Path "public\data\processed\theme_aggregation.json"
   Test-Path "public\data\processed\weekly_pulse"
   ```

2. Verify the data path in `lib/data-loader.ts` matches your setup

3. Check the console for errors

### Build errors?

1. Make sure all dependencies are installed:
   ```powershell
   npm install
   ```

2. Check TypeScript errors:
   ```powershell
   npm run build
   ```

## Production Build

```powershell
npm run build
npm start
```

The production build will be in the `.next` directory.

