# Vercel Deployment Guide

**Project:** Google My Business Lead Generation System
**Date:** March 10, 2025
**Repository:** https://github.com/toponmohonto32-eng/leadmachinen.git

---

## 📋 Prerequisites

Before deploying to Vercel, ensure you have:

- ✅ GitHub repository with code pushed (completed)
- ✅ Vercel account (free tier is sufficient)
- ✅ AI provider API keys (at least one provider)
- ✅ Database solution (see recommendations below)

---

## 🚀 Quick Deployment Steps

### Step 1: Connect Vercel to GitHub

1. **Sign in to Vercel**
   - Go to https://vercel.com
   - Sign in with your GitHub account

2. **Import Repository**
   - Click "Add New" → "Project"
   - Search for: `toponmohonto32-eng/leadmachinen`
   - Click "Import"

### Step 2: Configure Project

1. **Framework Preset**
   - Framework: Next.js
   - Root Directory: `./` (leave as is)
   - Build Command: `bun run build`
   - Output Directory: `.next`
   - Install Command: `bun install`

2. **Environment Variables**
   Add the following environment variables in the Vercel dashboard:

   ```
   DATABASE_URL=file:./dev.db
   AI_ZAI_API_KEY=your-zai-api-key
   AI_TOGETHER_API_KEY=your-together-api-key
   AI_HUGGINGFACE_API_KEY=your-huggingface-api-key
   AI_OLLAMA_API_KEY=your-ollama-api-key
   AI_LOCALAI_API_KEY=your-localai-api-key
   AI_DEFAULT_PROVIDER=zai
   NODE_ENV=production
   ```

   **Important:** Replace the placeholder values with your actual API keys.

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)
   - Your app will be live at: `https://your-project-name.vercel.app`

---

## 🔧 Detailed Configuration

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | Database connection string | `file:./dev.db` (dev) or PostgreSQL URL (prod) |
| `AI_ZAI_API_KEY` | Recommended | Z AI provider key | `sk-xxxxx...` |
| `AI_TOGETHER_API_KEY` | Optional | Together AI backup key | `xxxxx...` |
| `AI_HUGGINGFACE_API_KEY` | Optional | Hugging Face backup key | `hf_xxxxx...` |
| `AI_OLLAMA_API_KEY` | Optional | Ollama key (local) | `xxxxx...` |
| `AI_LOCALAI_API_KEY` | Optional | LocalAI key (local) | `xxxxx...` |
| `AI_DEFAULT_PROVIDER` | Yes | Default AI provider | `zai` |
| `NODE_ENV` | Yes | Environment mode | `production` |

### Database Configuration

#### For Development (SQLite)
```
DATABASE_URL="file:./dev.db"
```

#### For Production (Recommended: PostgreSQL)

**Option 1: Vercel Postgres (Recommended)**
1. In Vercel dashboard, go to your project
2. Click "Storage" → "Create Database"
3. Select "Postgres"
4. Copy the connection string
5. Update `DATABASE_URL` environment variable

**Option 2: External PostgreSQL**
```
DATABASE_URL="postgresql://user:password@host:port/database"
```

**Option 3: Supabase**
```
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

**Option 4: Neon**
```
DATABASE_URL="postgresql://[user]:[password]@[neon-host]/[database]?sslmode=require"
```

#### Migration Steps (When Switching Databases)

If switching from SQLite to PostgreSQL for production:

1. Update Prisma schema:
```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

2. Update environment variable in Vercel to PostgreSQL URL

3. Vercel will automatically run:
   - `prisma generate`
   - `prisma db push`

---

## 📦 Deployment Configuration

The project includes a `vercel.json` file with the following configuration:

```json
{
  "buildCommand": "bun run build",
  "devCommand": "bun run dev",
  "installCommand": "bun install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["iad1"],
  "functions": {
    "app/api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

### Configuration Notes:
- **Memory:** 1024MB for API routes (good for AI operations)
- **Max Duration:** 60 seconds (for AI API calls)
- **Region:** `iad1` (US East - change if needed)
- **Build:** Uses Bun for faster builds

---

## 🔄 Deploying Updates

### Automatic Deployments
Vercel automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

Vercel will detect the push and automatically:
1. Pull latest code
2. Run `bun install`
3. Run `bun run build`
4. Deploy to production

### Manual Deployments
1. Go to your project in Vercel dashboard
2. Click "Deployments"
3. Click "Redeploy"

---

## 🌐 Custom Domain

### Add Custom Domain

1. **In Vercel Dashboard:**
   - Go to your project
   - Click "Settings" → "Domains"
   - Click "Add"
   - Enter your domain (e.g., `leads.yourcompany.com`)

2. **Update DNS:**
   Vercel will provide DNS records to add to your domain registrar:
   ```
   A     @    76.76.21.21
   CNAME www  cname.vercel-dns.com
   ```

3. **Wait for propagation:**
   - DNS changes take 5-10 minutes
   - Vercel will automatically provision SSL certificate

---

## 📊 Monitoring & Logs

### View Logs
1. Go to your project in Vercel
2. Click "Logs"
3. Filter by:
   - Function (API routes)
   - Status code
   - Time range

### View Analytics
1. Go to "Analytics" tab
2. See:
   - Page views
   - API requests
   - Performance metrics
   - Error rates

### Set Up Alerts
1. Go to "Settings" → "Notifications"
2. Configure alerts for:
   - Deployment failures
   - Error rates
   - Performance issues

---

## 🔒 Security Best Practices

### 1. Environment Variables
- ✅ Never commit `.env` files to Git
- ✅ Use Vercel's environment variables
- ✅ Rotate API keys regularly
- ✅ Use different keys for dev/prod

### 2. API Security
- ✅ Add authentication to API routes
- ✅ Implement rate limiting
- ✅ Use CORS appropriately
- ✅ Validate all inputs

### 3. Database Security
- ✅ Use connection pooling
- ✅ Enable SSL for database connections
- ✅ Use read-only users where possible
- ✅ Regular backups

---

## 🐛 Troubleshooting

### Build Errors

**Error: "Cannot find module"**
- Solution: Check `package.json` dependencies
- Solution: Clear build cache: `vercel build --force`

**Error: "Prisma Client not generated"**
- Solution: Add build script to generate Prisma client
- Solution: Ensure `prisma generate` runs in build

**Error: "Database connection failed"**
- Solution: Check `DATABASE_URL` environment variable
- Solution: Verify database is accessible
- Solution: Check network/firewall settings

### Runtime Errors

**Error: "AI API key missing"**
- Solution: Add `AI_ZAI_API_KEY` environment variable
- Solution: Verify API key is valid

**Error: "Function timeout"**
- Solution: Increase `maxDuration` in `vercel.json`
- Solution: Optimize AI operations
- Solution: Use streaming responses

**Error: "Out of memory"**
- Solution: Increase memory allocation
- Solution: Optimize database queries
- Solution: Implement caching

---

## 📈 Performance Optimization

### 1. Enable Edge Functions (for APIs that don't need Node.js)
```json
{
  "functions": {
    "app/api/leads/route.ts": {
      "runtime": "edge"
    }
  }
}
```

### 2. Enable Caching
```typescript
// Add to API routes
export const revalidate = 300; // Cache for 5 minutes
```

### 3. Use Incremental Static Regeneration (ISR)
```typescript
// In page components
export const revalidate = 3600; // Revalidate every hour
```

### 4. Optimize Images
```typescript
import Image from 'next/image';

<Image
  src="/lead-image.jpg"
  alt="Lead"
  width={500}
  height={300}
  loading="lazy"
/>
```

---

## 🔧 Advanced Configuration

### Custom Build Script

If you need to run database migrations during build, create `scripts/build.sh`:

```bash
#!/bin/bash
bun run db:push
bun run build
```

Update `vercel.json`:
```json
{
  "buildCommand": "./scripts/build.sh"
}
```

### Multiple Environments

#### Preview Deployments
Every pull request creates a preview deployment automatically.

#### Environment-Specific Variables
- **Production:** Set in project settings
- **Preview:** Set in "Environment Variables" → "Preview"
- **Development:** Set in "Environment Variables" → "Development"

---

## 📝 Deployment Checklist

### Before First Deployment:
- [ ] GitHub repository created and pushed
- [ ] All code committed to main branch
- [ ] Environment variables documented
- [ ] Database solution chosen
- [ ] AI API keys obtained
- [ ] `vercel.json` configured
- [ ] `.env.example` created

### During Deployment:
- [ ] Connect Vercel to GitHub
- [ ] Import repository
- [ ] Configure framework settings
- [ ] Add all environment variables
- [ ] Select region
- [ ] Deploy successfully

### After Deployment:
- [ ] Test all API endpoints
- [ ] Verify database connection
- [ ] Test AI features
- [ ] Check logs for errors
- [ ] Set up monitoring
- [ ] Configure custom domain (optional)
- [ ] Set up alerts
- [ ] Document deployment URL

---

## 🎉 Post-Deployment Steps

### 1. Test the Application
- [ ] Visit deployment URL
- [ ] Test API endpoints (see API_TEST_REPORT.md)
- [ ] Verify AI features work
- [ ] Check database operations

### 2. Set Up Monitoring
- [ ] Enable Vercel Analytics
- [ ] Configure error tracking
- [ ] Set up uptime monitoring

### 3. Configure Backup
- [ ] Set up database backups
- [ ] Backup environment variables
- [ ] Document recovery process

### 4. Team Onboarding
- [ ] Share deployment URL
- [ ] Provide API documentation
- [ ] Share environment variable guide
- [ ] Set up team access

---

## 📚 Additional Resources

### Documentation:
- **API Documentation:** `API_DOCUMENTATION.md`
- **User Manual:** `USER_MANUAL.md`
- **API Test Report:** `API_TEST_REPORT.md`
- **AI SDK Integration:** `AI_SDK_INTEGRATION_ANALYSIS.md`

### Vercel Resources:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/projects/custom-domains)

### Database Resources:
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Supabase](https://supabase.com/docs)
- [Neon](https://neon.tech/docs)
- [Prisma](https://www.prisma.io/docs)

---

## ✅ Summary

Your Google My Business Lead Generation System is **ready for Vercel deployment**:

1. ✅ Code is pushed to GitHub
2. ✅ All tests passed (see API_TEST_REPORT.md)
3. ✅ Configuration files ready
4. ✅ Documentation complete
5. ✅ Build system configured

**Next Action:** Follow the Quick Deployment Steps above to deploy to Vercel!

---

**Deployment Guide Version:** 1.0
**Last Updated:** March 10, 2025
**Status:** Ready for Deployment ✅
