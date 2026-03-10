# Deployment Guide - GitHub & Vercel

## 📋 Prerequisites

- GitHub account
- Vercel account
- Node.js 18+ installed locally
- Git installed locally

---

## 🚀 Step 1: Push to GitHub

### 1.1 Create a New GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **+** button in the top-right corner
3. Select **New repository**
4. Fill in the repository details:
   - **Repository name**: `gmb-lead-generator` (or your preferred name)
   - **Description**: Google My Business Lead Generation Agent with AI-powered scoring
   - **Visibility**: Choose **Private** (recommended) or **Public**
   - **Don't initialize** with README, .gitignore, or license (we already have these)
5. Click **Create repository**

### 1.2 Add GitHub Remote and Push

```bash
# Navigate to your project directory
cd /home/z/my-project

# Add the GitHub repository as a remote (replace with your details)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Verify the remote was added
git remote -v

# Push to GitHub (main branch)
git push -u origin master

# Or if your branch is called 'main':
# git branch -M main
# git push -u origin main
```

**If you get authentication errors:**

Option A: Use Personal Access Token
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with `repo` scope
3. Use the token as your password when pushing

Option B: Use SSH
```bash
# Remove HTTPS remote
git remote remove origin

# Add SSH remote
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git

# Push
git push -u origin master
```

### 1.3 Verify Push

1. Go to your GitHub repository
2. You should see all your code files
3. Verify the commit history shows your recent commits

---

## 🌐 Step 2: Deploy to Vercel

### 2.1 Connect GitHub to Vercel

1. Go to [Vercel](https://vercel.com) and sign in (or sign up)
2. Click **"Add New..."** → **"Project"**
3. Click **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub account
5. Find and select your `gmb-lead-generator` repository
6. Click **"Import"**

### 2.2 Configure Vercel Project

Vercel will automatically detect Next.js and populate most settings. Here's what you need to configure:

#### Framework Preset
- **Framework Preset**: `Next.js`
- **Root Directory**: `./` (leave as is)
- **Build Command**: `bun run build` (or `npm run build`)
- **Output Directory**: `.next`

#### Environment Variables

Add these environment variables in Vercel:

```
DATABASE_URL=file:./db/custom.db
ZAI_API_KEY=9e3628e5a5b14316b0ae105d58882571.pnKBN1sp8vkTXuEt
```

Optional (for additional AI providers):
```
TOGETHER_API_KEY=your_together_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.3
LOCALAI_ENABLED=true
LOCALAI_BASE_URL=http://localhost:8080
LOCALAI_MODEL=llama3
```

### 2.3 Deploy

1. Review all settings
2. Click **"Deploy"**
3. Wait for the build to complete (2-3 minutes)
4. You'll see a success message with your deployment URL

### 2.4 Configure Custom Domain (Optional)

1. In your Vercel project, go to **"Settings"** → **"Domains"**
2. Add your custom domain (e.g., `leads.yourdomain.com`)
3. Update your DNS records as instructed by Vercel
4. Wait for SSL certificate to be issued

---

## 🔧 Step 3: Production Setup

### 3.1 Database Setup

Since we're using SQLite with Vercel, the database will be reset on each deployment. For production, you have two options:

#### Option A: Use Vercel Postgres (Recommended for Production)

1. Go to your Vercel project → **"Storage"**
2. Click **"Create Database"**
3. Select **Postgres**
4. Click **"Create"**

Then update your `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Update the `DATABASE_URL` environment variable in Vercel with the Postgres connection string.

Run migrations:
```bash
npx prisma migrate deploy
```

#### Option B: Keep SQLite (Note: Data will reset on deployments)

1. Keep the current SQLite setup
2. Use Vercel's filesystem (data persists within the same deployment)
3. Note: Data is lost when new deployments are created

### 3.2 API Routes Configuration

The application uses API routes. Ensure Vercel is configured to handle them:

1. Go to **"Settings"** → **"Functions"**
2. Configure memory and timeout as needed:
   - **Memory**: 1024 MB (for AI processing)
   - **Timeout**: 60 seconds

### 3.3 Set Up Webhooks (Optional)

If you want to trigger scraping jobs externally:

1. Use the existing API endpoints:
   - `POST /api/scraping/search` - Start a new search
   - `GET /api/scraping/status/[id]` - Check search status
   - `POST /api/leads/[id]/score` - Score a lead
   - `POST /api/leads/bulk/enrich` - Bulk enrich leads

2. Create a Vercel cron job or use external schedulers

---

## 📊 Step 4: Monitor & Scale

### 4.1 Vercel Analytics

1. Go to your Vercel project → **"Analytics"**
2. Enable Vercel Analytics
3. Monitor:
   - Page views
   - Unique visitors
   - Conversion rates
   - Core Web Vitals

### 4.2 Error Tracking

Consider adding error tracking:

**Sentry:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**LogRocket:**
```bash
npm install logrocket
```

### 4.3 Performance Optimization

1. Enable Image Optimization:
   ```bash
   npm install next/image
   ```

2. Enable Vercel Edge Functions for faster API responses:
   - Move API routes to `app/api/*/route.ts` (already done)

3. Use Vercel KV (Redis) for caching:
   ```bash
   npm install @vercel/kv
   ```

---

## 🔐 Step 5: Security Best Practices

### 5.1 Environment Variables

- Never commit `.env.local` to git
- Use Vercel's Environment Variables for sensitive data
- Rotate API keys regularly
- Use different keys for development and production

### 5.2 Rate Limiting

Add rate limiting to your API routes:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const ip = request.ip;
  // Add rate limiting logic here
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### 5.3 API Authentication

Add authentication to protect your API endpoints:

```typescript
// lib/auth.ts
export function verifyApiKey(request: Request) {
  const apiKey = request.headers.get('x-api-key');
  return apiKey === process.env.API_SECRET_KEY;
}
```

---

## 🚨 Step 6: Troubleshooting

### Build Fails

**Error: "Module not found"**
```bash
# Clean install dependencies
rm -rf node_modules package-lock.json
bun install
```

**Error: "TypeScript errors"**
```bash
# Run TypeScript check
bun run build
```

### Deployment Fails

**Error: "Database connection failed"**
- Verify `DATABASE_URL` is set in Vercel
- Check if database is accessible
- Ensure database schema matches Prisma schema

**Error: "Timeout"**
- Increase function timeout in Vercel settings
- Optimize slow API endpoints
- Add caching

### Runtime Errors

**Error: "AI provider not responding"**
- Check API keys are set correctly
- Verify API quotas aren't exceeded
- Check Vercel logs for detailed errors

**Error: "Scraping blocked"**
- Implement rate limiting
- Use proxies if needed
- Respect robots.txt

---

## 📈 Step 7: CI/CD Pipeline

### 7.1 GitHub Actions

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest
      - run: bun install
      - run: bun run lint
      - run: bun run build
```

### 7.2 Automatic Deployment

Vercel automatically deploys when you push to GitHub:
- **Preview deployments** for every pull request
- **Production deployment** when you merge to main branch

---

## 📝 Step 8: Post-Deployment Checklist

- [ ] Application loads successfully
- [ ] All pages render correctly
- [ ] API routes are accessible
- [ ] Database operations work (search, score, enrich)
- [ ] AI providers are configured and working
- [ ] Error tracking is set up
- [ ] Analytics are enabled
- [ ] Custom domain is configured (if applicable)
- [ ] Environment variables are set
- [ ] Security best practices are in place
- [ ] Documentation is updated
- [ ] Team has access credentials

---

## 🎯 Quick Commands Reference

```bash
# Push changes to GitHub
git add .
git commit -m "Your commit message"
git push origin master

# Pull changes from GitHub
git pull origin master

# Create a new branch
git checkout -b feature/new-feature

# Merge branch to master
git checkout master
git merge feature/new-feature
git push origin master

# Rebuild on Vercel (trigger via CLI)
vercel --prod

# View Vercel logs
vercel logs

# Deploy to preview
vercel
```

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## 🆘 Need Help?

- **Vercel Support**: https://vercel.com/support
- **GitHub Support**: https://support.github.com
- **Next.js Discord**: https://discord.gg/nextjs
- **Project Issues**: Create an issue in your GitHub repository

---

✅ **You're all set!** Your Google My Business Lead Generation Agent is now deployed to Vercel and accessible via your Vercel URL or custom domain.
