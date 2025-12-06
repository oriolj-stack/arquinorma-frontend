# ArquiNorma Frontend - Deployment Guide

This guide will help you deploy the ArquiNorma frontend to Vercel via GitHub.

## Prerequisites

### 1. Install Git for Windows

If Git is not installed on your system:

1. **Download Git for Windows:**
   - Go to: https://git-scm.com/download/win
   - Download the latest version (64-bit installer recommended)

2. **Install Git:**
   - Run the installer
   - **Important Settings:**
     - ✅ Check "Git from the command line and also from 3rd-party software"
     - ✅ Check "Use Visual Studio Code as Git's default editor" (if you use VS Code)
     - ✅ Select "Use bundled OpenSSH"
     - ✅ Select "Use the OpenSSL library"
     - ✅ Select "Checkout Windows-style, commit Unix-style line endings"
     - ✅ Select "Use MinTTY (the default terminal of MSYS2)"
     - ✅ Select "Enable file system caching"
   - Click "Install" and wait for completion

3. **Verify Installation:**
   - Open a **NEW** PowerShell or Command Prompt window
   - Run: `git --version`
   - You should see something like: `git version 2.x.x`

4. **Configure Git (First Time Setup):**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

### 2. Create GitHub Account (If Needed)

1. Go to: https://github.com/signup
2. Create a free account
3. Verify your email address

## Deployment Steps

### Step 1: Create GitHub Repository

1. Go to: https://github.com/new
2. **Repository name:** `arquinorma-frontend`
3. **Description:** "ArquiNorma Frontend - Assistent IA per a normativa urbanística"
4. **Visibility:** Choose **Private** (recommended for beta)
5. **DO NOT** check:
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license
6. Click **"Create repository"**

### Step 2: Initialize Git and Push to GitHub

Open PowerShell in the `frontend` folder and run these commands **one by one**:

```powershell
# Navigate to frontend folder
cd "D:\02_Feina i negocis\05_Negocis\01_Propis\09_ArquiNorma\frontend"

# Initialize git repository
git init

# Check status
git status

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: ArquiNorma frontend for beta deployment"

# Add GitHub remote (REPLACE YOUR_USERNAME with your actual GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/arquinorma-frontend.git

# Rename branch to main
git branch -M main

# Push to GitHub (you'll be prompted for GitHub credentials)
git push -u origin main
```

**Note:** When pushing, GitHub may ask for authentication:
- **Option 1:** Use GitHub Personal Access Token (recommended)
  - Go to: https://github.com/settings/tokens
  - Generate new token (classic)
  - Select scopes: `repo` (full control)
  - Copy the token and use it as password when prompted

- **Option 2:** Use GitHub Desktop (easier for beginners)
  - Download: https://desktop.github.com/
  - Install and sign in
  - Use the GUI to push instead of command line

### Step 3: Deploy to Vercel

1. **Sign in to Vercel:**
   - Go to: https://vercel.com
   - Click "Sign Up" or "Log In"
   - Choose "Continue with GitHub"
   - Authorize Vercel to access your GitHub account

2. **Create New Project:**
   - Click "Add New..." → "Project"
   - Find and select `arquinorma-frontend` repository
   - Click "Import"

3. **Configure Project Settings:**
   - **Framework Preset:** Vite (should auto-detect)
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm run build` (should auto-fill)
   - **Output Directory:** `dist` (should auto-fill)
   - **Install Command:** `npm install` (should auto-fill)

4. **Add Environment Variables (CRITICAL!):**
   
   Before clicking "Deploy", click **"Environment Variables"** and add:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Production, Preview, Development |
   | `VITE_SUPABASE_ANON_KEY` | `your-anon-key-here` | Production, Preview, Development |
   | `VITE_STRIPE_PUBLIC_KEY` | `pk_test_...` or `pk_live_...` | Production, Preview, Development |
   | `VITE_BACKEND_URL` | (leave empty for now) | Production, Preview, Development |

   **Where to find these values:**
   - **Supabase:** Dashboard → Settings → API
   - **Stripe:** Dashboard → Developers → API Keys → Publishable key

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)
   - Your site will be live at: `https://arquinorma-frontend.vercel.app`

### Step 4: Configure Custom Domain (Optional)

1. In Vercel project dashboard, go to **Settings** → **Domains**
2. Add your domain: `app.arquinorma.cat` or `beta.arquinorma.cat`
3. Follow Vercel's DNS instructions:
   - Add a CNAME record pointing to: `cname.vercel-dns.com`
   - Or add A records as instructed by Vercel

## Post-Deployment Checklist

- [ ] Verify landing page loads correctly
- [ ] Test waiting list form submission
- [ ] Check that legal pages (Privacy, Terms, Legal Notice) are accessible
- [ ] Verify Supabase connection works
- [ ] Test authentication flow (sign up/login)
- [ ] Check that Stripe checkout modal appears (if applicable)

## Troubleshooting

### Git Not Found Error

If you see `git: command not found`:

1. **Restart your terminal/PowerShell** after installing Git
2. **Check PATH:**
   ```powershell
   $env:Path -split ';' | Select-String git
   ```
3. **Manually add Git to PATH** (if needed):
   - Git is usually installed at: `C:\Program Files\Git\cmd`
   - Add this to your system PATH environment variable

### Build Fails on Vercel

**Common Issues:**

1. **Missing Environment Variables:**
   - Go to Vercel → Project Settings → Environment Variables
   - Ensure all required variables are set

2. **Build Errors:**
   - Check Vercel build logs
   - Ensure `package.json` has correct build script
   - Verify all dependencies are listed in `package.json`

3. **Module Not Found:**
   - Run `npm install` locally to verify dependencies
   - Check that `node_modules` is in `.gitignore`

### Authentication Issues

If GitHub push fails:

1. **Use Personal Access Token:**
   - GitHub no longer accepts passwords for Git operations
   - Create a token at: https://github.com/settings/tokens
   - Use token as password when prompted

2. **Use GitHub Desktop:**
   - Easier alternative for Git operations
   - Download: https://desktop.github.com/

## Next Steps

After successful deployment:

1. **Deploy Backend:**
   - Backend needs to be deployed separately (Railway, Render, Fly.io)
   - Update `VITE_BACKEND_URL` in Vercel after backend is live

2. **Update Stripe Webhooks:**
   - Point webhook endpoints to your deployed backend URL
   - Update in Stripe Dashboard → Webhooks

3. **Monitor:**
   - Check Vercel analytics
   - Monitor error logs
   - Test all features in production

## Support

If you encounter issues:
1. Check Vercel build logs
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Ensure backend is deployed and accessible (if using backend features)

---

**Last Updated:** December 2024

