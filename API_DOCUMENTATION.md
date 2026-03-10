# API Documentation - Google My Business Lead Generation System

Complete API reference for all endpoints.

---

## Base URL

```
http://localhost:3000/api
```

---

## Authentication

Currently, no authentication is required. For production, implement API keys or JWT tokens.

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Endpoints

### 📊 Leads API

#### GET /api/leads
Get all leads with filtering, sorting, and pagination.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `limit` | number | Number of results (default: 50) | `100` |
| `offset` | number | Pagination offset (default: 0) | `0` |
| `hasWebsite` | string | Filter by website presence | `"true"` or `"false"` |
| `city` | string | Filter by city (case-insensitive) | `"New York"` |
| `postalCode` | string | Filter by postal code | `"10001"` |
| `county` | string | Filter by county | `"Los Angeles"` |
| `niche` | string | Filter by niche/category | `"Restaurant"` |
| `category` | string | Filter by category | `"Food & Dining"` |
| `minRating` | number | Minimum rating | `4.0` |
| `searchId` | string | Filter by search job ID | `clx...` |
| `priority` | string | Filter by priority | `"urgent"`, `"high"`, `"medium"`, `"low"` |
| `status` | string | Filter by qualification | `"hot"`, `"warm"`, `"cold"` |
| `isDuplicate` | string | Filter duplicates | `"true"` or `"false"` |
| `minQualityScore` | number | Minimum quality score | `70` |
| `search` | string | Full-text search | `"pizza"` |
| `sortBy` | string | Sort field | `"qualityScore"`, `"createdAt"`, `"rating"` |
| `sortOrder` | string | Sort direction | `"asc"` or `"desc"` |

**Example Request:**
```bash
GET /api/leads?status=hot&priority=high&minQualityScore=70&limit=20
```

**Example Response:**
```json
{
  "success": true,
  "leads": [
    {
      "id": "clx...",
      "name": "Joe's Pizza",
      "website": "https://joespizza.com",
      "email": "info@joespizza.com",
      "phone": "+1-555-0123",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "postalCode": "10001",
      "niche": "Restaurant",
      "hasWebsite": true,
      "rating": 4.5,
      "reviewCount": 125,
      "qualityScore": 85,
      "status": "hot",
      "priority": "high",
      "tags": "[\"Has Email\",\"Has Phone\",\"High Rating\"]",
      "isEnriched": true,
      "reviews": [...],
      "contacts": [...]
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

---

#### POST /api/leads
Create a new lead (manual entry).

**Request Body:**
```json
{
  "name": "Business Name",
  "website": "https://example.com",
  "email": "contact@example.com",
  "phone": "+1-555-0123",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "county": "New York County",
  "niche": "Restaurant",
  "category": "Food & Dining",
  "hasWebsite": true,
  "rating": 4.5,
  "reviewCount": 100,
  "socialFacebook": "https://facebook.com/business",
  "socialTwitter": "https://twitter.com/business",
  "socialLinkedIn": "https://linkedin.com/company/business",
  "description": "A great restaurant",
  "notes": "Follow up next week",
  "priority": "high"
}
```

**Example Response:**
```json
{
  "success": true,
  "lead": { ... }
}
```

---

#### GET /api/leads/[id]
Get a single lead by ID.

**Example Request:**
```bash
GET /api/leads/clx123abc456
```

**Example Response:**
```json
{
  "success": true,
  "lead": {
    "id": "clx123abc456",
    "name": "Joe's Pizza",
    ...
  }
}
```

---

#### PUT /api/leads/[id]
Update a lead.

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "new@example.com",
  "notes": "Updated notes"
}
```

---

#### DELETE /api/leads/[id]
Delete a lead.

**Example Request:**
```bash
DELETE /api/leads/clx123abc456
```

**Example Response:**
```json
{
  "success": true,
  "message": "Lead deleted successfully"
}
```

---

### 🎯 Lead Scoring API

#### POST /api/leads/[id]/score
Score a single lead using AI.

**Example Request:**
```bash
POST /api/leads/clx123abc456/score
```

**Example Response:**
```json
{
  "success": true,
  "lead": {
    "id": "clx123abc456",
    "qualityScore": 78,
    "status": "hot",
    "priority": "high",
    "tags": "[\"Has Email\",\"High Rating\"]",
    "isEnriched": true
  },
  "score": {
    "score": 78,
    "factors": {
      "contactInfo": { "score": 25, "details": "Email and phone available" },
      "onlinePresence": { "score": 20, "details": "Has website" },
      "reviewQuality": { "score": 22, "details": "4.5 stars, 100+ reviews" },
      "businessMaturity": { "score": 8, "details": "Has description" },
      "engagementPotential": { "score": 3, "details": "Good reviews" }
    },
    "qualification": "hot",
    "priority": "high",
    "tags": ["Has Email", "High Rating", "Has Phone"]
  },
  "emailValidation": {
    "isValid": true,
    "isDeliverable": true,
    "confidence": 0.9,
    "details": "Valid format (business email)"
  }
}
```

---

### 👥 Lead Enrichment API

#### POST /api/leads/[id]/enrich
Enrich a lead by finding top management contacts.

**Example Request:**
```bash
POST /api/leads/clx123abc456/enrich
```

**Example Response:**
```json
{
  "success": true,
  "lead": { ... },
  "message": "Lead enriched successfully",
  "contactsFound": 3
}
```

---

#### POST /api/leads/bulk/enrich
Bulk enrich multiple leads (up to 50).

**Request Body:**
```json
{
  "enrichAll": true
}
```

OR

```json
{
  "leadIds": ["clx123", "clx456", "clx789"]
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Enriched 45 leads, 0 failed, 5 skipped",
  "results": {
    "enriched": [ ... ],
    "failed": [ ... ],
    "skipped": 5
  }
}
```

---

#### GET /api/leads/bulk/enrich
Get enrichment statistics.

**Example Response:**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "enriched": 120,
    "notEnriched": 30,
    "enrichmentRate": "80.0",
    "averageQualityScore": "72.5",
    "qualification": {
      "hot": 45,
      "warm": 55,
      "cold": 20
    },
    "priority": {
      "urgent": 15,
      "high": 30,
      "medium": 50,
      "low": 25
    }
  }
}
```

---

### 🔄 Duplicate Detection API

#### POST /api/leads/[id]/check-duplicate
Check if a lead is a duplicate of existing leads.

**Example Request:**
```bash
POST /api/leads/clx123abc456/check-duplicate
```

**Example Response:**
```json
{
  "success": true,
  "leadId": "clx123abc456",
  "duplicateCheck": {
    "isDuplicate": true,
    "duplicateOf": "clx789def012",
    "confidence": 0.95,
    "reason": "Same phone number"
  },
  "originalLead": {
    "id": "clx789def012",
    "name": "Joe's Pizza",
    ...
  }
}
```

---

### 📝 Notes API

#### GET /api/leads/[id]/notes
Get lead notes.

**Example Request:**
```bash
GET /api/leads/clx123abc456/notes
```

**Example Response:**
```json
{
  "success": true,
  "notes": "Called on 2024-01-15, interested in website design. Follow up next week."
}
```

---

#### PUT /api/leads/[id]/notes
Update lead notes.

**Request Body:**
```json
{
  "notes": "Updated notes about this lead"
}
```

**Example Response:**
```json
{
  "success": true,
  "lead": {
    "id": "clx123abc456",
    "notes": "Updated notes about this lead",
    ...
  }
}
```

---

### ⚖️ Comparison API

#### POST /api/leads/compare
Compare multiple leads side by side (2-5 leads).

**Request Body:**
```json
{
  "leadIds": ["clx123", "clx456", "clx789"]
}
```

**Example Response:**
```json
{
  "success": true,
  "comparison": {
    "leads": [
      {
        "id": "clx123",
        "name": "Joe's Pizza",
        "qualityScore": 85,
        "status": "hot",
        "priority": "high",
        ...
      }
    ],
    "analysis": {
      "highestScore": 85,
      "lowestScore": 62,
      "averageScore": 74.3,
      "hotLeads": 2,
      "warmLeads": 1,
      "coldLeads": 0,
      "withWebsite": 3,
      "withoutWebsite": 0,
      "withEmail": 2,
      "withPhone": 3,
      "withReviews": 3
    },
    "recommendations": [
      "🎯 Priority: \"Joe's Pizza\" has the highest quality score (85) - outreach first",
      "🔥 2 hot lead(s) ready for immediate outreach",
      "📧 2 lead(s) have emails - can start email outreach"
    ]
  }
}
```

---

### 📤 Export API

#### GET /api/leads/export
Export leads to CSV, JSON, or Excel format.

**Query Parameters:**

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `format` | string | Export format | `"csv"`, `"json"`, `"excel"` |
| `hasWebsite` | string | Filter by website | `"true"` or `"false"` |
| `city` | string | Filter by city | `"New York"` |
| `postalCode` | string | Filter by postal code | `"10001"` |
| `status` | string | Filter by status | `"hot"`, `"warm"`, `"cold"` |
| `priority` | string | Filter by priority | `"urgent"`, `"high"` |
| `minQualityScore` | number | Minimum quality score | `70` |

**Example Request:**
```bash
GET /api/leads/export?format=csv&status=hot&minQualityScore=70
```

**Response:** Downloads file with name `leads-export-{timestamp}.csv`

---

### 🔍 Scraping API

#### POST /api/scraping/search
Start a new Google Maps search.

**Request Body:**
```json
{
  "query": "restaurants",
  "city": "New York",
  "postalCode": "10001",
  "niche": "Restaurant",
  "limit": 20,
  "extractReviews": true,
  "extractEmails": true,
  "extractSocialLinks": true
}
```

**Example Response:**
```json
{
  "success": true,
  "searchId": "clx123abc456",
  "message": "Search started successfully"
}
```

---

#### GET /api/scraping/search
Get all search jobs.

**Example Response:**
```json
{
  "success": true,
  "searches": [
    {
      "id": "clx123abc456",
      "query": "restaurants",
      "city": "New York",
      "status": "completed",
      "resultsCount": 25,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

#### GET /api/scraping/status/[id]
Get search job status.

**Example Request:**
```bash
GET /api/scraping/status/clx123abc456
```

**Example Response:**
```json
{
  "success": true,
  "search": {
    "id": "clx123abc456",
    "query": "restaurants",
    "status": "completed",
    "resultsCount": 25,
    "leads": [ ... ]
  }
}
```

---

### ⚙️ System API

#### GET /api/system/status
Get system status and AI provider usage.

**Example Response:**
```json
{
  "success": true,
  "system": {
    "aiProviders": [
      {
        "name": "Z AI",
        "type": "cloud",
        "enabled": true,
        "priority": 1
      },
      {
        "name": "Together AI",
        "type": "cloud",
        "enabled": false,
        "priority": 2
      }
    ],
    "aiUsageStats": {
      "Z AI": { "requests": 150, "tokens": 45000, "cost": 0.045 }
    },
    "scrapingSources": [
      {
        "name": "Puppeteer",
        "type": "custom",
        "enabled": false
      }
    ],
    "totals": {
      "totalRequests": 150,
      "totalTokens": 45000,
      "totalCost": 0.045
    }
  }
}
```

---

## Data Models

### Lead Model
```typescript
{
  id: string;                    // Unique ID
  name: string;                  // Business name
  website: string | null;       // Website URL
  email: string | null;          // Email address
  phone: string | null;          // Phone number
  address: string | null;       // Street address
  city: string | null;           // City
  state: string | null;          // State
  postalCode: string | null;     // ZIP/postal code
  county: string | null;         // County
  niche: string | null;          // Business niche
  category: string | null;       // Business category
  hasWebsite: boolean;           // Has website?
  rating: number | null;         // Google rating (0-5)
  reviewCount: number;           // Number of reviews
  qualityScore: number | null;   // AI quality score (0-100)
  status: string | null;         // Qualification (hot/warm/cold)
  priority: string | null;       // Priority (urgent/high/medium/low)
  tags: string | null;           // JSON array of tags
  isEnriched: boolean;           // AI enriched?
  isDuplicate: boolean;          // Is duplicate?
  notes: string | null;          // User notes
  socialFacebook: string | null; // Facebook URL
  socialTwitter: string | null;  // Twitter URL
  socialLinkedIn: string | null; // LinkedIn URL
  socialInstagram: string | null; // Instagram URL
  createdAt: Date;               // Created timestamp
  updatedAt: Date;               // Last updated
  reviews: Review[];             // Associated reviews
  contacts: Contact[];           // Associated contacts
}
```

### Review Model
```typescript
{
  id: string;                    // Unique ID
  leadId: string;                // Parent lead ID
  reviewerName: string | null;   // Reviewer name
  reviewerEmail: string | null;  // Reviewer email
  rating: number;                // Rating (1-5)
  text: string | null;           // Review text
  date: Date | null;             // Review date
  createdAt: Date;               // Created timestamp
}
```

### Contact Model
```typescript
{
  id: string;                    // Unique ID
  leadId: string;                // Parent lead ID
  name: string;                  // Contact name
  role: string | null;           // Job title/role
  email: string | null;          // Email address
  phone: string | null;          // Phone number
  linkedIn: string | null;       // LinkedIn URL
  confidence: number | null;     // AI confidence (0-1)
  source: string | null;         // Data source
  createdAt: Date;               // Created timestamp
  updatedAt: Date;               // Last updated
}
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid parameters) |
| 404 | Not Found (resource doesn't exist) |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently, no rate limiting is implemented. For production, consider:
- Implement rate limiting per IP
- Use Redis for distributed rate limiting
- Set appropriate limits per endpoint

---

## Examples

### Example 1: Get Hot Leads
```bash
curl "http://localhost:3000/api/leads?status=hot&priority=high&sortBy=qualityScore&sortOrder=desc"
```

### Example 2: Score a Lead
```bash
curl -X POST "http://localhost:3000/api/leads/clx123/score"
```

### Example 3: Bulk Enrich
```bash
curl -X POST "http://localhost:3000/api/leads/bulk/enrich" \
  -H "Content-Type: application/json" \
  -d '{"enrichAll": true}'
```

### Example 4: Export Hot Leads
```bash
curl "http://localhost:3000/api/leads/export?format=csv&status=hot&minQualityScore=70" \
  --output leads.csv
```

### Example 5: Compare Leads
```bash
curl -X POST "http://localhost:3000/api/leads/compare" \
  -H "Content-Type: application/json" \
  -d '{"leadIds": ["clx123", "clx456", "clx789"]}'
```

---

## Testing

Use the built-in dev server at `http://localhost:3000` to test all endpoints.

For automated testing, consider using:
- Jest for unit tests
- Supertest for API testing
- Postman for manual testing

---

## Support

For issues or questions:
- Check the documentation in the project
- Review the code comments
- Check the logs in `/home/z/my-project/dev.log`
