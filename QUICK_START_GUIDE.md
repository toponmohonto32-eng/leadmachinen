# Quick Start Guide - New Lead Scoring & AI Features

## 🚀 Getting Started with AI-Powered Lead Scoring

### Step 1: Start the Application
The application is already running. Access it via the **Preview Panel** on the right side.

### Step 2: Generate Leads
1. Go to **"New Search"** tab
2. Enter search criteria:
   - Query (e.g., "restaurants", "plumbers", "dentists")
   - City (e.g., "New York")
   - Postal Code (optional)
   - Results Limit (default: 20)
3. Click **"Start Search"**
4. Wait for the search to complete (monitor in Search History)

### Step 3: Score Leads (AI-Powered)

#### Option A: Bulk Enrich (Recommended)
1. Go to **"All Leads"** tab
2. Click **"Bulk Enrich (AI Score)"** button
3. Confirm when prompted
4. Wait for up to 50 leads to be scored
5. View results in the table with quality scores, qualifications, and priorities

#### Option B: Score Individual Leads
1. In the leads table, find a lead without a quality score
2. Click the **🎯 Target icon** in the Actions column
3. Wait for AI to score the lead
4. View the quality score, qualification (hot/warm/cold), and priority

### Step 4: Understand the Scores

#### Quality Score (0-100)
- **70+ (Red)**: 🔥 Hot leads - High quality, ready for outreach
- **50-69 (Orange)**: ⚡ Warm leads - Promising, worth pursuing
- **<50 (Blue)**: ❄️ Cold leads - Lower priority

#### Priority Levels
- **🚨 Urgent (85+)**: Immediate attention required
- **🔺 High (70-84)**: High priority outreach
- **⬜ Medium (50-69)**: Standard priority
- **⬇️ Low (<50)**: Lower priority

#### Quality Factors (Behind the Scenes)
AI evaluates 5 key factors:
1. **Contact Information** (25 pts): Email, phone available
2. **Online Presence** (25 pts): Website, social media
3. **Review Quality** (25 pts): Rating + review count
4. **Business Maturity** (15 pts): Description, category
5. **Engagement Potential** (10 pts): Overall impression

### Step 5: Filter & Prioritize

Use the new filters to focus on the best leads:

**Qualification Filter:**
- Select "🔥 Hot" to see only top-quality leads
- Select "⚡ Warm" for promising leads
- Select "❄️ Cold" to review lower-priority leads

**Priority Filter:**
- Select "🚨 Urgent" for immediate action items
- Select "🔺 High" for high-priority outreach
- Select "⬜ Medium" for standard leads
- Select "⬇️ Low" for lower priority

**Minimum Quality Score:**
- Enter a number (e.g., "70") to see only leads above that score
- Great for focusing on the most promising opportunities

### Step 6: Find Contact Information

1. Click the **👥 Users icon** next to any lead
2. AI will search for top management contacts:
   - Owner
   - CEO
   - Managing Director
   - General Manager
3. View found contacts with:
   - Names
   - Roles
   - Email addresses (when available)
   - LinkedIn profiles (when available)

### Step 7: Check for Duplicates

The system automatically checks for duplicates, but you can manually check:

```bash
# Example API call
POST /api/leads/[id]/check-duplicate
```

Or use the AI providers service in your code:
```typescript
import { multiProviderAI } from '@/lib/ai-providers';

const duplicateCheck = await multiProviderAI.detectDuplicates(
  newLead,
  existingLeads
);

if (duplicateCheck.isDuplicate) {
  console.log(`Duplicate found: ${duplicateCheck.reason}`);
}
```

### Step 8: Export Leads

1. Apply your desired filters
2. Click **"Export CSV"** button
3. Download the CSV file with all lead data including:
   - Quality scores
   - Qualifications
   - Priorities
   - Contact information
   - Reviews
   - Enrichment data

## 💡 Pro Tips

### 1. Focus on Hot Leads First
After bulk enrichment, filter by "🔥 Hot" to see your best opportunities first.

### 2. Check Email Validation
Look for the ✅ or ❌ icons next to email addresses:
- ✅ = Valid email format, likely deliverable
- ❌ = Invalid format or disposable email

### 3. Leverage Tags
AI automatically generates tags for each lead:
- "Has Email"
- "Has Phone"
- "Social Media"
- "High Rating"
- "Many Reviews"
- "No Website"
- "Engaged"

Use these to quickly identify key characteristics.

### 4. Monitor Enrichment Stats
The dashboard shows:
- Total leads
- Average quality score (with progress bar)
- Number of hot/warm/cold leads
- Enrichment percentage

Track these over time to measure data quality improvements.

### 5. Use "No Website Hub" for Easy Wins
The **"No Website Hub"** tab shows businesses without websites but with reviews. These are prime targets for web development services.

### 6. Batch Operations Save Time
Instead of scoring leads one by one, always use **"Bulk Enrich"** to process up to 50 leads at once.

## 🔧 Advanced Usage

### Custom API Calls

**Score a Lead:**
```typescript
const response = await fetch(`/api/leads/${leadId}/score`, {
  method: 'POST',
});
const { score, qualification, priority, tags } = await response.json();
```

**Bulk Enrich:**
```typescript
const response = await fetch('/api/leads/bulk/enrich', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ enrichAll: true }),
});
```

**Get Enrichment Stats:**
```typescript
const response = await fetch('/api/leads/bulk/enrich');
const { stats } = await response.json();
console.log(stats);
// { total, enriched, notEnriched, enrichmentRate, ... }
```

**Filter Leads:**
```typescript
const params = new URLSearchParams({
  status: 'hot',
  priority: 'urgent',
  minQualityScore: '70',
  city: 'New York',
});
const response = await fetch(`/api/leads?${params}`);
```

### Using AI Providers Directly

```typescript
import { multiProviderAI } from '@/lib/ai-providers';

// Score a lead
const scoreResult = await multiProviderAI.calculateLeadQualityScore(leadData);
// { score: 78, qualification: 'hot', priority: 'high', tags: [...] }

// Validate email
const emailValidation = await multiProviderAI.validateEmail('test@company.com');
// { isValid: true, isDeliverable: true, confidence: 0.9, details: '...' }

// Check duplicates
const duplicateCheck = await multiProviderAI.detectDuplicates(lead, existingLeads);
// { isDuplicate: false, duplicateOf: null, confidence: 0, reason: '...' }
```

## 📊 Understanding the Dashboard

### Stats Cards (Top Row)
1. **Total Leads**: Overall lead count
2. **Avg Quality Score**: Mean score with progress bar
3. **Hot Leads**: High-quality leads (70+ score)
4. **Warm Leads**: Promising leads (50-69 score)
5. **Cold Leads**: Lower priority leads (<50 score)
6. **Enriched**: Percentage of scored leads

### Table Columns
1. **Business Name**: Lead name + badges (Enriched/Duplicate)
2. **Score**: Quality score (0-100) with progress bar
3. **Qualification**: Hot/Warm/Cold badge with icon
4. **Priority**: Urgent/High/Medium/Low badge
5. **Location**: City and postal code
6. **Contact**: Email (with validation) and phone
7. **Rating**: Stars + review count
8. **Website**: Yes/No badge
9. **Actions**: Score, Find Contacts, Delete buttons

## 🎯 Best Practices

1. **Always Bulk Enrich First**: Score all leads before filtering
2. **Start with Hot Leads**: Focus on 70+ score leads first
3. **Check Email Validation**: Prioritize leads with valid emails
4. **Use Priority Filters**: Tackle urgent leads immediately
5. **Monitor Duplicate Warnings**: Avoid outreach to duplicates
6. **Track Enrichment Rate**: Aim for 100% enriched leads
7. **Export Regularly**: Keep CSV backups of scored leads

## 🆘 Troubleshooting

**Q: Bulk Enrich is taking a long time**
A: AI scoring takes time. Wait for completion - up to 50 leads are processed.

**Q: Some leads show "Not scored"**
A: These haven't been enriched yet. Click the 🎯 button to score individually.

**Q: Email shows ❌ icon**
A: The email format is invalid or it's a disposable email. Use with caution.

**Q: Duplicate badge appears**
A: This lead matches an existing lead. Review the original before outreach.

**Q: Quality score seems low**
A: Review the quality factors (contact info, online presence, reviews). The score reflects lead completeness.

## 📚 Additional Resources

- **IMPROVEMENTS_SUMMARY.md**: Detailed documentation of all enhancements
- **OPEN_SOURCE_GUIDE.md**: Guide to setting up additional AI providers
- **src/lib/ai-providers.ts**: AI service implementation (for developers)
- **src/app/api/**: API endpoint documentation (for developers)

## ✨ Next Steps

1. ✅ Generate some leads
2. ✅ Use "Bulk Enrich" to score them
3. ✅ Filter by "Hot" to see best leads
4. ✅ Click "Find Contacts" on promising leads
5. ✅ Export your top leads for outreach

Congratulations! You're now using AI-powered lead scoring to identify and prioritize the best business opportunities! 🎉
