# Quick Push Instructions

## Step 1: Create GitHub Repository

1. Go to: **https://github.com/new**
2. Repository name: `arquinorma-frontend`
3. Make it **Private**
4. **DO NOT** check any boxes (no README, .gitignore, or license)
5. Click **"Create repository"**

## Step 2: Get Personal Access Token

1. Go to: **https://github.com/settings/tokens**
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name: `ArquiNorma Deployment`
4. Expiration: `90 days` (or `No expiration`)
5. **Scopes:** Check **`repo`** (Full control of private repositories)
6. Click **"Generate token"**
7. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

## Step 3: Push Using This Command

Open PowerShell in the `frontend` folder and run:

```powershell
cd "D:\02_Feina i negocis\05_Negocis\01_Propis\09_Arquinorma\frontend"

# Replace YOUR_TOKEN_HERE with your actual token
$token = "YOUR_TOKEN_HERE"
git remote set-url origin "https://$token@github.com/oriolj-stack/arquinorma-frontend.git"
git push -u origin main

# After successful push, remove token from URL for security
git remote set-url origin "https://github.com/oriolj-stack/arquinorma-frontend.git"
```

## Alternative: Use GitHub Desktop

If you prefer a GUI:

1. Download: **https://desktop.github.com/**
2. Install and sign in
3. Click **"File"** → **"Add Local Repository"**
4. Browse to: `D:\02_Feina i negocis\05_Negocis\01_Propis\09_Arquinorma\frontend`
5. Click **"Publish repository"**
6. Name: `arquinorma-frontend`
7. Make it **Private**
8. Click **"Publish repository"**

---

**After pushing, proceed to Vercel deployment!**

