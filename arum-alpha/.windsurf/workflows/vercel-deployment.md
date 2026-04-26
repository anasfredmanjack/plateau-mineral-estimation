---
description: How to deploy the mineral estimation app to Vercel
---

# Vercel Deployment Steps

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free tier available)
2. **GitHub Repository**: Push your code to GitHub
3. **Groq API Key**: Get from [console.groq.com](https://console.groq.com)

## Step 1: Prepare Your Project

### Update Environment Variables
Create a production `.env` file:

```bash
# .env.production
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

// turbo
### Configure next.config.js for Static Export (Optional)
If deploying as static site:

```javascript
// next.config.js
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
}
module.exports = nextConfig
```

## Step 2: Push to GitHub

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

## Step 3: Deploy via Vercel Dashboard

1. **Log in** to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. **Import Git Repository**: Select your GitHub repo
4. **Configure Project**:
   - Framework Preset: Next.js
   - Root Directory: `arum-alpha` (if your app is in a subdirectory)
   - Build Command: `npm run build`
   - Output Directory: `.next` (or `dist` for static export)

## Step 4: Add Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `GROQ_API_KEY` | `gsk_your_key` | Production |
| `GROQ_API_KEY` | `gsk_your_key` | Preview |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.vercel.app` | Production |

// turbo
## Step 5: Deploy

Click **"Deploy"** button in Vercel dashboard.

Wait for build to complete (~2-3 minutes).

## Step 6: Verify Deployment

1. **Check Build Logs** for any errors
2. **Visit deployed URL**
3. **Test the app**: 
   - Search for a location
   - Click on map
   - Check predictions load

## Alternative: CLI Deployment

### Install Vercel CLI
```bash
npm i -g vercel
```

// turbo
### Deploy from Terminal
```bash
cd arum-alpha
vercel --prod
```

Follow prompts to:
- Link to existing project or create new
- Set environment variables
- Confirm deployment

## Troubleshooting

### Build Errors
- **"Cannot find module"**: Check all imports, ensure `npm install` ran
- **TypeScript errors**: Run `npm run build` locally first
- **API errors**: Verify `GROQ_API_KEY` is set in Vercel env vars

### Runtime Errors
- **Map not loading**: Check Leaflet CSS is imported
- **API 500 errors**: Check Functions logs in Vercel dashboard
- **CORS issues**: Ensure API routes handle CORS properly

### Common Fixes
```bash
# Clear cache and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

## Production Checklist

- [ ] `GROQ_API_KEY` set in production environment
- [ ] All images use `unoptimized: true` or proper loader
- [ ] API routes use `export const dynamic = 'force-dynamic'`
- [ ] No hardcoded `localhost` URLs
- [ ] Build succeeds locally: `npm run build`

## Custom Domain (Optional)

1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain
3. Update DNS records as instructed

## Continuous Deployment

Vercel auto-deploys on every git push to main branch.
Preview deployments created for Pull Requests.

---

**Note**: Keep your `GROQ_API_KEY` secret - never commit it to git!
