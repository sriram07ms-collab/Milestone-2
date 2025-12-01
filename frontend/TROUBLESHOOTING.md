# Troubleshooting: Frontend Not Styling

## Issue: Plain Text / No CSS Applied

If you're seeing plain HTML without styling, follow these steps:

### Step 1: Restart the Dev Server

1. Stop the current dev server (Ctrl+C in the terminal)
2. Clear Next.js cache:
   ```powershell
   Remove-Item -Recurse -Force .next
   ```
3. Restart the dev server:
   ```powershell
   npm run dev
   ```

### Step 2: Verify CSS Import

Check that `app/globals.css` is imported in `app/layout.tsx`:
```typescript
import './globals.css';
```

### Step 3: Check Browser Console

1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab - verify `globals.css` is loading (status 200)

### Step 4: Hard Refresh Browser

- Windows: `Ctrl + F5` or `Ctrl + Shift + R`
- This clears browser cache

### Step 5: Verify Tailwind is Processing

Add a test class to verify Tailwind works:
```tsx
<div className="bg-red-500 text-white p-4">
  If this is red with white text, Tailwind is working
</div>
```

### Step 6: Check PostCSS Configuration

Verify `postcss.config.mjs` exists and contains:
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

### Step 7: Reinstall Dependencies (if needed)

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Step 8: Verify Tailwind v4 Setup

The project uses Tailwind CSS v4 which requires:
- `@import "tailwindcss";` in globals.css (not @tailwind directives)
- `@tailwindcss/postcss` plugin in postcss.config.mjs

## Common Issues

### Issue: Custom colors not working
**Solution**: Replaced `groww-primary` with standard Tailwind colors (`green-500`, `green-600`, etc.)

### Issue: CSS not loading
**Solution**: 
1. Ensure `globals.css` is imported in `layout.tsx`
2. Restart dev server
3. Clear browser cache

### Issue: Build warnings about @import
**Solution**: Font import must come before `@import "tailwindcss"` in globals.css

## Quick Fix Command

Run this to reset everything:
```powershell
cd C:\Users\SM095616\app-review-dashboard
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev
```

Then hard refresh browser (Ctrl+F5).

