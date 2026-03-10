# User Manual - Google My Business Lead Generation System

Complete guide for using the Google My Business Lead Generation System.

---

## 📚 Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Generating Leads](#generating-leads)
4. [Understanding Lead Scores](#understanding-lead-scores)
5. [Managing Leads](#managing-leads)
6. [Advanced Features](#advanced-features)
7. [Exporting Data](#exporting-data)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### System Requirements

- **Browser**: Chrome, Firefox, Safari, or Edge (latest version)
- **Internet**: Required for API calls and scraping
- **No Installation Needed**: The system runs entirely in the browser

### First Time Setup

1. **Open the Application**
   - Navigate to your application URL
   - The dashboard will load automatically

2. **Explore the Interface**
   - Take a moment to familiarize yourself with the layout
   - Review the dashboard statistics
   - Click through the different tabs

3. **Generate Your First Leads**
   - Go to "New Search" tab
   - Enter a query (e.g., "restaurants")
   - Enter a city (e.g., "New York")
   - Click "Start Search"
   - Wait for results to appear

---

## Dashboard Overview

### Header
- **Title**: "Google My Business Lead Generator"
- **Description**: Brief system overview
- **Refresh Button**: Reload the dashboard

### Statistics Cards

#### 1. Total Leads
- Shows the total number of leads in the database
- Updates automatically when new leads are added

#### 2. Average Quality Score
- Shows the mean quality score across all scored leads
- Color-coded progress bar (0-100)
- Higher is better

#### 3. Hot Leads 🔥
- Number of leads with 70+ quality score
- These are your highest priority leads
- Ready for immediate outreach

#### 4. Warm Leads ⚡
- Number of leads with 50-69 quality score
- Promising leads worth pursuing
- Good candidates for follow-up

#### 5. Cold Leads ❄️
- Number of leads with <50 quality score
- Lower priority leads
- May need more information

#### 6. Enriched
- Number and percentage of scored leads
- Shows data quality progress
- Aim for 100% enrichment

### Navigation Tabs

1. **New Search** - Generate new leads
2. **All Leads** - View and manage all leads
3. **No Website Hub** - High-priority targets
4. **Search History** - View past searches

---

## Generating Leads

### Step-by-Step Guide

#### 1. Go to "New Search" Tab

#### 2. Fill in Search Criteria

**Required Fields:**
- At least one of: Query, Postal Code, or City

**Optional Fields:**

| Field | Description | Example |
|-------|-------------|---------|
| **Search Query** | Type of business to search | "restaurants", "plumbers", "dentists" |
| **Business Niche** | Specific business category | "Italian Restaurant", "Emergency Plumber" |
| **Postal Code** | ZIP/Postal code to search | "10001", "SW1A 1AA" |
| **City** | City to search in | "New York", "London" |
| **County** | County/region to search | "Los Angeles County" |
| **Results Limit** | Number of results (1-100) | 20 |

#### 3. Start the Search

Click the **"Start Search"** button.

#### 4. Wait for Results

- The search will run in the background
- You'll see a "Searching..." indicator
- Results appear in the "Search History" tab when complete
- Switch to "All Leads" tab to view results

### Search Tips

**Tip 1: Be Specific**
- ❌ "food" (too broad)
- ✅ "Italian restaurants" (better)

**Tip 2: Combine Filters**
- Query: "plumbers"
- City: "New York"
- Niche: "Emergency plumbing"

**Tip 3: Use Postal Codes for Precision**
- Better than city names for targeted searches
- Especially useful in large cities

**Tip 4: Start Small**
- Set Results Limit to 10-20 for testing
- Increase to 50-100 for production use

---

## Understanding Lead Scores

### Quality Score (0-100)

The AI evaluates each lead based on 5 factors:

#### 1. Contact Information (25 points)
- **Email available**: +12 points
- **Phone available**: +13 points

#### 2. Online Presence (25 points)
- **Has website**: +15 points
- **Has social media**: +10 points
- **No website**: -5 points

#### 3. Review Quality (25 points)
- Based on rating (5-star = max points)
- Based on review count (50+ reviews = bonus)
- 4.5+ rating gets "High Rating" tag

#### 4. Business Maturity (15 points)
- **Has description**: +8 points
- **Has category/niche**: +7 points

#### 5. Engagement Potential (10 points)
- **20+ reviews + 4+ rating**: +10 points
- Gets "Engaged" tag

### Qualification Levels

#### 🔥 Hot (70+ score)
- **Characteristics**:
  - Complete contact information
  - Strong online presence
  - Good reviews
  - High engagement

- **Action**: Prioritize for immediate outreach

#### ⚡ Warm (50-69 score)
- **Characteristics**:
  - Some contact information
  - Decent online presence
  - Moderate reviews
  - Potential value

- **Action**: Good candidates for follow-up

#### ❄️ Cold (<50 score)
- **Characteristics**:
  - Limited contact info
  - Weak online presence
  - Few or no reviews
  - Low engagement

- **Action**: Lower priority, may need more research

### Priority Levels

#### 🚨 Urgent (85+)
- Immediate attention required
- Best opportunities

#### 🔺 High (70-84)
- High priority
- Act within 24-48 hours

#### ⬜ Medium (50-69)
- Standard priority
- Follow up within 1 week

#### ⬇️ Low (<50)
- Lower priority
- Follow up as time permits

### Tags

AI automatically generates helpful tags:

| Tag | Meaning |
|-----|---------|
| "Has Email" | Email address available |
| "Has Phone" | Phone number available |
| "Social Media" | Has social media profiles |
| "High Rating" | 4.5+ stars |
| "Many Reviews" | 50+ reviews |
| "No Website" | No website found |
| "Engaged" | Good review activity |

---

## Managing Leads

### Viewing Leads

#### All Leads Tab
- **Default View**: All leads, sorted by quality score (descending)
- **Filters**:
  - Website (All/Has/No Website)
  - Qualification (All/Hot/Warm/Cold)
  - Priority (All/Urgent/High/Medium/Low)
  - Min Quality Score
  - City
  - Postal Code
  - Niche

#### No Website Hub Tab
- Shows leads **without websites** but **with reviews**
- High-priority targets for web development services
- Filter and sort like "All Leads"

#### Search History Tab
- View all past searches
- See search status (completed/running/failed)
- View results count

### Scoring Leads

#### Individual Scoring
1. Find a lead without a quality score
2. Click the **🎯 Target icon** in the Actions column
3. Wait for AI to score the lead
4. View the score, qualification, and priority

#### Bulk Scoring (Recommended)
1. In "All Leads" tab, click **"Bulk Enrich (AI Score)"**
2. Confirm when prompted
3. Wait for up to 50 unenriched leads to be scored
4. View results in the table

**Benefits of Bulk Scoring:**
- Saves time
- Consistent scoring
- Better for large datasets

### Finding Contacts

1. Click the **👥 Users icon** next to any lead
2. AI searches for top management contacts:
   - Owner
   - CEO
   - Managing Director
   - General Manager
3. View found contacts with:
   - Names
   - Roles
   - Email addresses
   - LinkedIn profiles
   - Confidence scores

### Adding Notes

**Via API:**
```bash
PUT /api/leads/[id]/notes
Body: { "notes": "Called on Jan 15, interested in web design" }
```

**Best Practices:**
- Note date of contact
- Record interest level
- Note next follow-up date
- Track any special requirements

### Deleting Leads

1. Click the **✕** button next to any lead
2. Confirm deletion
3. Lead is permanently removed

**Warning:** This action cannot be undone!

### Managing Duplicates

The system automatically detects duplicates based on:
- Same phone number (95% confidence)
- Same email address (95% confidence)
- Same website (90% confidence)
- Similar name in same location (80% confidence)

**Duplicate Indicators:**
- Red "Duplicate" badge
- Links to original lead
- Confidence score and reason

**Actions:**
- Review duplicate detection results
- Verify if truly a duplicate
- Delete duplicate if confirmed
- Keep both if they're different businesses

---

## Advanced Features

### Lead Comparison

Compare multiple leads side by side:

**Usage:**
```bash
POST /api/leads/compare
Body: { "leadIds": ["clx123", "clx456", "clx789"] }
```

**Returns:**
- Side-by-side comparison of all selected leads
- Analysis statistics (highest/lowest scores, averages)
- AI-generated recommendations

**Use Cases:**
- Compare leads in same niche
- Decide which leads to prioritize
- Identify patterns in high-quality leads

### Advanced Filtering

Combine multiple filters for precise results:

**Example 1: Hot Leads in New York**
- Status: Hot
- City: New York

**Example 2: Urgent Leads Without Websites**
- Priority: Urgent
- Website: No Website

**Example 3: High-Quality Restaurants**
- Min Quality Score: 70
- Niche: Restaurant

### Email Validation

The system validates emails automatically during scoring:

**Validation Checks:**
- ✅ Format validation
- ✅ Disposable email detection
- ✅ Business vs personal classification
- ✅ Deliverability confidence score

**Indicators:**
- ✅ = Valid format, likely deliverable
- ❌ = Invalid format or disposable email

**Disposable Email Domains Detected:**
- tempmail.com, guerrillamail.com
- mailinator.com, 10minutemail.com
- yopmail.com, throwawaymail.com
- getairmail.com, sharklasers.com

---

## Exporting Data

### Export Options

**Available Formats:**
- **CSV** - Default, works with Excel
- **JSON** - For developers/integrations
- **Excel** - CSV with BOM for proper encoding

### Exporting with Filters

You can apply filters before exporting:

**Example: Export Hot Leads**
```bash
GET /api/leads/export?format=csv&status=hot&minQualityScore=70
```

**Example: Export Urgent Leads in NYC**
```bash
GET /api/leads/export?format=csv&priority=urgent&city=New+York
```

**Example: Export All Leads Without Websites**
```bash
GET /api/leads/export?format=csv&hasWebsite=false
```

### Exported Data Includes

- Business information (name, website, email, phone, address)
- Quality metrics (score, status, priority, tags)
- Social media links
- Contact information (names, emails, roles)
- Review data (count, average rating)
- Timestamps

### Using Exported Data

**In Excel:**
1. Open the CSV file
2. Sort by quality score
3. Filter by qualification
4. Create pivot tables for analysis

**For CRM Integration:**
1. Export as JSON
2. Parse and import into your CRM
3. Map fields as needed

**For Email Marketing:**
1. Export leads with emails
2. Filter by qualification
3. Import into email marketing tool

---

## Best Practices

### 1. Prioritize Hot Leads
- Always focus on hot leads (70+ score) first
- These have the highest conversion potential
- Contact within 24 hours

### 2. Use Bulk Enrichment
- Score all leads before filtering
- Save time with bulk operations
- Get consistent scoring

### 3. Leverage the "No Website Hub"
- These are prime web development targets
- Already have reviews (verified businesses)
- No website = immediate need

### 4. Check Email Validation
- Prioritize leads with valid emails
- Avoid disposable emails
- Business emails preferred over personal

### 5. Track Your Outreach
- Use notes to record interactions
- Note follow-up dates
- Track interest levels

### 6. Monitor Enrichment Rate
- Aim for 100% enrichment
- Use bulk enrich to get there quickly
- Better data = better decisions

### 7. Regular Exports
- Export leads regularly for backup
- Create different exports for different campaigns
- Keep historical data for analysis

### 8. Use Lead Comparison
- Compare similar leads
- Learn from high-quality patterns
- Improve your targeting

---

## Troubleshooting

### Common Issues

#### Issue: Search Not Starting

**Symptoms:**
- Click "Start Search" but nothing happens
- No error message

**Solutions:**
1. Check internet connection
2. Verify at least one search field is filled
3. Refresh the page and try again
4. Check browser console for errors

#### Issue: No Leads Appearing

**Symptoms:**
- Search completes but no leads show up
- "No leads found" message

**Solutions:**
1. Try a different search query
2. Expand search criteria (remove filters)
3. Check "Search History" tab for status
4. Try a different city/region

#### Issue: Bulk Enrich Fails

**Symptoms:**
- Click "Bulk Enrich" but fails
- Error message appears

**Solutions:**
1. Ensure you have leads to enrich
2. Check internet connection
3. Try individual scoring first
4. Check dev server logs

#### Issue: Quality Scores Not Updating

**Symptoms:**
- Lead scored but score doesn't change
- Old score persists

**Solutions:**
1. Refresh the page
2. Clear browser cache
3. Check if scoring completed successfully
4. Try scoring again

#### Issue: Export File Won't Open

**Symptoms:**
- CSV file won't open in Excel
- Garbled characters

**Solutions:**
1. Use the "excel" format parameter
2. Open in Google Sheets first
3. Import using Excel's "From Text/CSV" feature
4. Try JSON format instead

#### Issue: Duplicate Detection Wrong

**Symptoms:**
- Non-duplicate marked as duplicate
- Duplicate not detected

**Solutions:**
1. Review the confidence score
2. Check the reason for marking
3. Verify manually if needed
4. Contact developer if persistent

### Getting Help

**Documentation:**
- API Documentation: `API_DOCUMENTATION.md`
- Quick Start Guide: `QUICK_START_GUIDE.md`
- Deployment Guide: `DEPLOYMENT_STEPS.md`

**Logs:**
- Check `/home/z/my-project/dev.log` for errors
- Look for error messages in browser console

**Support:**
- Review all documentation files
- Check the code comments
- Review the GitHub issues (if applicable)

---

## Keyboard Shortcuts

Coming soon! Planned shortcuts:
- `Ctrl/Cmd + K` - Quick search
- `Ctrl/Cmd + E` - Export current view
- `Ctrl/Cmd + R` - Refresh dashboard
- `Ctrl/Cmd + N` - New search

---

## Tips & Tricks

### Tip 1: Use Progressive Filtering
- Start with broad filters (e.g., city)
- Then narrow down (e.g., niche)
- Finally apply quality filters

### Tip 2: Save Common Searches
- Note your successful search combinations
- Reuse them for similar campaigns
- Track which searches yield best results

### Tip 3: Monitor Quality Over Time
- Track average quality score
- Aim for improvement
- Adjust search criteria based on results

### Tip 4: Use the "No Website Hub"
- Best for web development services
- High conversion potential
- Clear value proposition

### Tip 5: Leverage Social Media
- Check social links for additional info
- Research business before outreach
- Personalize your approach

### Tip 6: Batch Your Work
- Do all searches in one session
- Then bulk enrich all leads
- Finally, review and prioritize

### Tip 7: Keep Notes Organized
- Use consistent note format
- Include dates and action items
- Reference past interactions

### Tip 8: Export Regularly
- Create weekly exports
- Maintain historical records
- Track campaign performance

---

## Conclusion

The Google My Business Lead Generation System is a powerful tool for finding, scoring, and managing business leads. Follow this manual to get the most out of the system.

**Key Takeaways:**
1. Start with "New Search" to generate leads
2. Use "Bulk Enrich" to score all leads
3. Focus on "Hot" leads (70+ score)
4. Leverage "No Website Hub" for web services
5. Export regularly for backup and analysis

**For More Information:**
- See `API_DOCUMENTATION.md` for technical details
- See `DEPLOYMENT_STEPS.md` for deployment
- See `QUICK_START_GUIDE.md` for quick setup

Happy lead hunting! 🚀
