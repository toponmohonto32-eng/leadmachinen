# Troubleshooting Guide

## Issue: "Can not generate leads"

### Problem
The lead generation (search) feature doesn't work because the **Outscraper API key** is not configured.

### Solution

You need to add the `OUTSCRAPER_API_KEY` environment variable:

#### For Local Development:

1. Create or edit `.env` file in your project root:
```bash
# Add this line with your actual API key
OUTSCRAPER_API_KEY=your-outscraper-api-key-here
```

2. Get your API key from: https://outscraper.com/
   - Sign up for an account
   - Get your API key from the dashboard
   - Add credits to your account (paid service)

3. Restart the dev server:
```bash
# Stop the current server (Ctrl+C)
bun run dev
```

#### For Vercel Deployment:

1. Go to your Vercel project settings
2. Click "Environment Variables"
3. Add:
   - Name: `OUTSCRAPER_API_KEY`
   - Value: `your-actual-api-key`
4. Redeploy the application

---

## Dev Server Not Starting (Turbopack Error)

### Problem
Next.js dev server shows: "Failed to restore task data (corrupted database or bug)"

### Solution

Clean the cache:
```bash
rm -rf .next
bun run dev
```

---

## Build Issues

### Problem
Build fails with errors

### Solution

1. Check dependencies:
```bash
bun install
```

2. Run build:
```bash
bun run build
```

3. Check build log for errors

---

## AI Features Not Working

### Problem
Lead scoring, enrichment, or other AI features don't work

### Solution

Add AI provider API keys to your `.env` file:

```bash
# At minimum, you need one of these:
AI_ZAI_API_KEY=your-zai-key-here

# Optional fallback providers:
AI_TOGETHER_API_KEY=your-together-key-here
AI_HUGGINGFACE_API_KEY=your-huggingface-key-here
```

Restart the server after adding keys.

---

## Database Issues

### Problem
Database connection errors

### Solution

1. Check database file exists:
```bash
ls -la db/
```

2. If not, initialize database:
```bash
bun run db:push
```

3. Check DATABASE_URL in `.env`:
```bash
# For SQLite (default)
DATABASE_URL="file:./dev.db"

# Or for PostgreSQL (production)
DATABASE_URL="postgresql://user:password@host:port/database"
```

---

## Common Error Messages

### "Outscraper API key not provided. Service will be in mock mode"
**Solution:** Add `OUTSCRAPER_API_KEY` to environment variables

### "AI API key missing"
**Solution:** Add at least one AI provider API key (`AI_ZAI_API_KEY`, etc.)

### "No leads found"
**Solution:** Start a search with valid query/parameters and wait for completion

### "Search failed"
**Solution:**
- Check Outscraper API key is valid
- Check you have credits in your Outscraper account
- Check network connection

---

## Testing the System

### Test 1: Check System Status
```bash
curl http://localhost:3000/api/system/status
```

### Test 2: Start a Search
```bash
curl -X POST http://localhost:3000/api/scraping/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "restaurants",
    "city": "New York",
    "limit": 5
  }'
```

### Test 3: Get Leads
```bash
curl http://localhost:3000/api/leads?limit=10
```

---

## Getting Help

If you're still having issues:

1. Check the logs:
```bash
# Dev server logs
tail -f dev.log

# Server logs
tail -f server.log
```

2. Review documentation:
- `API_DOCUMENTATION.md` - API usage
- `USER_MANUAL.md` - User guide
- `VERCEL_DEPLOYMENT_GUIDE.md` - Deployment help

3. Check environment variables are set:
```bash
# View current environment
env | grep -E "OUTSCRAPER|AI_|DATABASE_URL"
```

---

## Required API Keys Summary

| Feature | Required API Key | Provider |
|---------|------------------|----------|
| Lead Generation | `OUTSCRAPER_API_KEY` | https://outscraper.com/ (Paid) |
| AI Scoring/Enrichment | `AI_ZAI_API_KEY` | z-ai-web-dev-sdk |
| AI Fallback | `AI_TOGETHER_API_KEY` | https://together.ai/ |
| AI Fallback | `AI_HUGGINGFACE_API_KEY` | https://huggingface.co/ |

### Minimum Required for Full Functionality:
1. `OUTSCRAPER_API_KEY` - For lead generation/scraping
2. `AI_ZAI_API_KEY` - For AI-powered features

---

## Quick Fix Template

Create a `.env` file with these minimum settings:

```bash
# Database
DATABASE_URL="file:./dev.db"

# Lead Generation (REQUIRED for scraping)
OUTSCRAPER_API_KEY=your-actual-outscraper-key-here

# AI Features (REQUIRED for scoring/enrichment)
AI_ZAI_API_KEY=your-actual-zai-key-here
AI_DEFAULT_PROVIDER=zai

# Environment
NODE_ENV=development
```

Replace the placeholder values with your actual API keys.

---

**Last Updated:** March 10, 2025
