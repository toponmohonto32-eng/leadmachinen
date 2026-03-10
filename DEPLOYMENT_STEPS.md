# Deployment Guide - GitHub & Vercel

This guide will help you deploy your Google My Business Lead Generation System to GitHub and Vercel.

---

## 📋 Prerequisites

- GitHub account
- Vercel account
- Git installed locally (or use the terminal provided)

---

## Step 1: Create GitHub Repository

### Option A: Using GitHub Web UI
1. Go to https://github.com/new
2. Repository name: `gmb-lead-generator` (or your preferred name)
3. Make it **Public** (recommended) or Private
4. **DO NOT** initialize with README, .gitignore, or license
5. Click "Create repository"

### Option B: Using GitHub CLI (if installed)
```bash
gh repo create gmb-lead-generator --public --source=. --remote=origin
```

---

## Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
# Add the remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/gmb-lead-generator.git

# Rename main branch (if not already named main)
git branch -M main

# Push to GitHub
git push -u origin main
```

**Example:**
```bash
git remote add origin https://github.com/johndoe/gmb-lead-generator.git
git branch -M main
git push -u origin main
```

---

## Step 3: Verify GitHub Push

1. Go to your GitHub repository
2. You should see all your code files
3. Check that the commit history shows all your work

---

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. **Import Project** section:
   - Click "Import Git Repository"
   - Select your `gmb-lead-generator` repository from GitHub
   - Click "Import"

3. **Configure Project**:
   - **Project Name**: `gmb-lead-generator` (or your preferred name)
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `.next` (auto-detected)

4. **Environment Variables** (if needed):
   ```
   DATABASE_URL=file:./db/custom.db
   ZAI_API_KEY=9e3628e5a5b14316b0ae105d58882571.pnKBN1sp8vkTXuEt
   ```

   For additional AI providers (optional):
   ```
   TOGETHER_API_KEY=your_together_api_key
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   OLLAMA_ENABLED=true
   OLLAMA_BASE_URL=http://localhost:11434
   LOCALAI_ENABLED=true
   LOCALAI_BASE_URL=http://localhost:8080
   ```

5. Click **"Deploy"**

6. Wait for deployment to complete (2-5 minutes)

7. Once deployed, you'll get a URL like: `https://gmb-lead-generator.vercel.app`

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Follow the prompts to configure and deploy

---

## Step 5: Configure Environment Variables in Vercel

After initial deployment, add environment variables:

1. Go to your project in Vercel Dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add the following variables:

### Required Variables:
| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `DATABASE_URL` | `file:./db/custom.db` | Production, Preview, Development |
| `ZAI_API_KEY` | `9e3628e5a5b14316b0ae105d58882571.pnKBN1sp8vkTXuEt` | Production, Preview, Development |

### Optional Variables (for more AI providers):
| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `TOGETHER_API_KEY` | Your Together AI key | All |
| `HUGGINGFACE_API_KEY` | Your Hugging Face key | All |
| `OLLAMA_ENABLED` | `true` | All |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Development |
| `LOCALAI_ENABLED` | `true` | All |
| `LOCALAI_BASE_URL` | `http://localhost:8080` | Development |

---

## Step 6: Redeploy After Adding Environment Variables

1. In Vercel Dashboard, go to **"Deployments"**
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**

---

## Step 7: Verify Deployment

1. Click your deployment URL
2. You should see the Google My Business Lead Generator
3. Try a test search to verify functionality

---

## 🚨 Important Notes

### Database Persistence

Since this uses SQLite with a local database file:
- **Vercel deployments are ephemeral** - the database will reset on each deployment
- For production, consider:
  1. Using an external database (PostgreSQL with Neon, Supabase, etc.)
  2. Or using Vercel's Postgres

### Using External Database (Recommended for Production)

To use PostgreSQL instead of SQLite:

1. Create a free PostgreSQL database (e.g., Neon, Supabase)
2. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

3. Update `DATABASE_URL` environment variable:
```
DATABASE_URL=postgresql://username:password@hostname:5432/database
```

4. Run migrations:
```bash
bun run prisma migrate dev
```

### API Rate Limits

- Z AI SDK has rate limits
- Consider implementing caching for production
- Monitor usage in Vercel Analytics

---

## 🔧 Troubleshooting

### Issue: Build Fails

**Solution:**
```bash
# Run build locally to check for errors
npm run build

# Check for TypeScript errors
npm run lint

# Check dependencies
npm install
```

### Issue: Database Errors on Vercel

**Solution:**
- SQLite files aren't persisted on Vercel
- Use an external database (PostgreSQL)
- Or use Vercel Postgres

### Issue: Environment Variables Not Working

**Solution:**
- Double-check variable names (case-sensitive)
- Ensure variables are added to all environments (Production, Preview, Development)
- Redeploy after adding variables

### Issue: Puppeteer Scraper Not Working

**Solution:**
- Puppeteer requires additional setup on Vercel
- Consider using serverless-compatible alternatives
- Or use mock data fallback (already implemented)

---

## 📊 Monitoring Your Deployment

### Vercel Dashboard
- Go to your project in Vercel
- View **"Deployments"** for deployment history
- View **"Analytics"** for traffic and performance
- View **"Logs"** for error tracking

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 🔄 Continuous Deployment

Once connected to Vercel:
- Every push to `main` branch triggers automatic deployment
- Preview deployments are created for pull requests
- Rollback to previous deployments if needed

---

## 📝 Quick Reference Commands

```bash
# Push to GitHub
git push

# Deploy to Vercel (CLI)
vercel --prod

# View deployment logs
vercel logs

# Remove a deployment
vercel rm <deployment-url>
```

---

## ✅ Deployment Checklist

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables configured
- [ ] Initial deployment successful
- [ ] Application tested on live URL
- [ ] Database persistence configured (if needed)
- [ ] Monitoring set up
- [ ] Team members invited (if needed)

---

## 🎉 Success!

Your Google My Business Lead Generation System is now deployed!

- **GitHub**: https://github.com/YOUR_USERNAME/gmb-lead-generator
- **Vercel**: https://gmb-lead-generator.vercel.app

Share the URL with your team and start generating leads! 🚀
