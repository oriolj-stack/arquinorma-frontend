# Vercel Environment Variables Setup

## Required Environment Variables for arquinorma.cat

Go to **Vercel Dashboard** → **arquinorma-frontend** → **Settings** → **Environment Variables**

Add these variables for **Production** environment:

### 1. Supabase Configuration
```
VITE_SUPABASE_URL = https://lccqawffpdceqftpggpv.supabase.co
VITE_SUPABASE_ANON_KEY = [Your Supabase anon key]
```

### 2. Stripe Configuration
```
VITE_STRIPE_PUBLIC_KEY = [Your Stripe publishable key]
```

### 3. Backend API URL (CRITICAL!)
```
VITE_BACKEND_URL = [Your Cloudflare Tunnel URL]
```

**Examples:**
- Quick Tunnel: `https://morgan-monitors-container-jennifer.trycloudflare.com`
- Named Tunnel: `https://api.arquinorma.cat`

---

## How to Get the Tunnel URL

### Option A: Quick Tunnel (Temporary)
Run this command on your machine:
```powershell
cloudflared tunnel --url http://localhost:8000
```
Copy the generated URL (e.g., `https://xxxxx.trycloudflare.com`)

### Option B: Named Tunnel (Persistent)
If you set up a named tunnel with a custom domain, use:
```
https://api.arquinorma.cat
```

---

## Important Notes

1. **Redeploy after changing environment variables**
   - Go to Deployments → click "..." on latest → Redeploy

2. **Quick Tunnel URLs change on restart**
   - Every time you restart the tunnel, you get a new URL
   - You'll need to update the Vercel env var each time

3. **For stable production setup**
   - Set up a named Cloudflare Tunnel with `api.arquinorma.cat`
   - Or deploy the backend to a cloud server

---

## Verification

After setting environment variables and redeploying:

1. Open browser DevTools (F12)
2. Go to Console
3. Type: `import.meta.env.VITE_BACKEND_URL`
4. It should show your tunnel URL

Or visit: `https://arquinorma.cat/test-api.html`


