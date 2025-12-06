# Vercel Deployment Troubleshooting Guide

## Issue: Showing React+Vite Placeholder Instead of ArquiNorma Frontend

### Step 1: Verify Vercel Project Settings

1. Go to your Vercel project dashboard
2. Click on **Settings** → **General**
3. Verify these settings:
   - **Framework Preset:** Should be **Vite** (or auto-detected)
   - **Root Directory:** Should be `./` (or leave empty)
   - **Build Command:** Should be `npm run build`
   - **Output Directory:** Should be `dist`
   - **Install Command:** Should be `npm install`

### Step 2: Check Build Logs

1. Go to **Deployments** tab in Vercel
2. Click on the latest deployment
3. Check the **Build Logs** for any errors
4. Look for:
   - Build failures
   - Missing dependencies
   - Environment variable errors
   - Build timeout issues

### Step 3: Verify Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Ensure these are set (for **Production**, **Preview**, and **Development**):
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_STRIPE_PUBLIC_KEY
   VITE_BACKEND_URL (optional)
   ```

3. **Important:** After adding/changing environment variables, you need to **redeploy**!

### Step 4: Force Redeploy

1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Wait for the build to complete

### Step 5: Check Build Output

The build should create these files in the `dist` folder:
- `dist/index.html`
- `dist/assets/index-*.js`
- `dist/assets/index-*.css`
- `dist/assets/vendor-*.js`
- `dist/assets/supabase-*.js`
- `dist/assets/stripe-*.js`

If these files are missing, the build is failing.

### Step 6: Common Issues and Fixes

#### Issue: Build Fails with "Module not found"
**Fix:** 
- Check that all dependencies are in `package.json`
- Run `npm install` locally to verify
- Check that `node_modules` is in `.gitignore` (it should be)

#### Issue: Build Succeeds but Shows Placeholder
**Fix:**
- Check that `vercel.json` has the correct rewrite rules
- Verify that `index.html` exists in the `dist` folder
- Check browser console for JavaScript errors

#### Issue: Environment Variables Not Working
**Fix:**
- Remember: Vite requires `VITE_` prefix for environment variables
- After adding env vars, **redeploy** the project
- Check that variables are set for the correct environments (Production/Preview/Development)

#### Issue: Routing Not Working (404 on refresh)
**Fix:**
- Ensure `vercel.json` has the rewrite rule: `"source": "/(.*)", "destination": "/index.html"`
- This is already configured, but verify it's correct

### Step 7: Test Locally First

Before deploying, test the production build locally:

```bash
cd frontend
npm run build
npm run preview
```

Visit `http://localhost:4173` and verify the app works correctly.

### Step 8: Clear Vercel Cache

If issues persist:

1. Go to **Settings** → **General**
2. Scroll to **Build & Development Settings**
3. Click **Clear Build Cache**
4. Redeploy

### Step 9: Check Browser Console

1. Open your deployed site
2. Open browser DevTools (F12)
3. Check **Console** tab for errors
4. Check **Network** tab to see if files are loading

Common errors:
- `Failed to load resource` → Build output issue
- `Module not found` → Missing dependency
- `Environment variable not defined` → Missing env var

### Step 10: Verify Git Repository

1. Check that `vercel.json` is committed to Git
2. Check that all source files are committed
3. Verify the latest commit is pushed to GitHub

## Quick Fix Checklist

- [ ] Vercel project settings are correct (Framework: Vite)
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Environment variables are set and correct
- [ ] Latest code is pushed to GitHub
- [ ] Redeployed after any changes
- [ ] Build logs show no errors
- [ ] `dist/index.html` exists in build output
- [ ] Browser console shows no errors

## Still Not Working?

1. **Check Vercel Build Logs** - Look for specific error messages
2. **Test Local Build** - Run `npm run build` and `npm run preview` locally
3. **Compare with Working Build** - Check if previous deployments worked
4. **Contact Support** - Vercel has excellent support, reach out if needed

## Expected Behavior

After successful deployment:
- Landing page should load at the root URL
- Navigation should work
- All routes should be accessible
- No React+Vite placeholder should appear
- Console should show no errors

---

**Last Updated:** After fixing vercel.json configuration

