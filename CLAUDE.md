# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**CSV Conversation Visualizer** - A professional-grade web application for visualizing AI conversation data from CSV files with media support and upload history powered by Cloudflare R2.

**Production URL**: https://csv-visualizer-one.vercel.app
**GitHub**: https://github.com/2949984428/csv-conversation-visualizer.git
**Tech Stack**: Pure HTML/CSS/JavaScript frontend + Vercel Serverless Functions + Cloudflare R2 storage
**Version**: v1.0.0

---

## Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                          │
│  - public/index.html (2,900+ lines single-page app)         │
│  - Claude-style UI design system                            │
│  - IndexedDB for local data (unlimited capacity)            │
│  - localStorage for metadata (<1KB per record)              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ fetch('/api/*')
                   ↓
┌─────────────────────────────────────────────────────────────┐
│              Vercel Serverless Functions                     │
│  - api/get-upload-url.js (presigned URL generation)         │
│  - api/upload-to-r2.js (legacy, deprecated)                 │
│  - Max payload: 4.5MB (bypassed via presigned URLs)         │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ AWS S3 SDK
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                  Cloudflare R2 Storage                       │
│  - Bucket: csv-visualizer-uploads                           │
│  - S3-compatible API endpoint                               │
│  - Public CDN: https://pub-xxx.r2.dev                       │
│  - CORS enabled for client-side direct upload              │
└─────────────────────────────────────────────────────────────┘
```

### Critical Design Decisions

1. **No Build Step**: Pure static HTML for simplicity and portability
2. **Client-Side Direct Upload**: Bypasses Vercel's 4.5MB payload limit using presigned URLs
3. **Three-Layer Storage**: IndexedDB (primary) + localStorage (index) + R2 (cloud backup)
4. **Embedded Data Model**: All CSV data embedded in HTML `<script>` tags to avoid CORS issues on `file://`

---

## Development Commands

### Local Development

```bash
# Start development server (recommended)
npm run dev              # Auto-restart on file changes (port 3000)

# Start production mode
npm start               # No auto-restart

# Test CSV parser
npm test                # Runs test/test-csv-parser.js

# Kill stuck port
lsof -ti:3000 | xargs kill -9
```

### Vercel Deployment

```bash
# Deploy to production
npx vercel --prod --yes

# Deploy to preview
npx vercel

# View logs
vercel logs csv-visualizer-one.vercel.app

# Environment variables
vercel env add R2_PUBLIC_URL production
vercel env rm R2_PUBLIC_URL production --yes
vercel env pull .env.local     # Pull from Vercel to local
```

### Git Workflow

```bash
# Standard commit with Claude attribution
git add .
git commit -m "feat: Add feature description

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main

# Create version tag
git tag -a v1.x.x -m "Version 1.x.x - description"
git push origin v1.x.x
```

**Important**: The project has GitHub integration with Vercel but auto-deployment may not be enabled. Always manually deploy with `npx vercel --prod` after pushing.

---

## Key Files and Modules

### Frontend (Single-Page Application)

**`public/index.html`** (2,900+ lines)
- **Lines 1-1200**: CSS (Claude design system)
- **Lines 1200-1300**: HTML structure (sidebar + main content)
- **Lines 1300-2900**: JavaScript application logic

**Critical Functions**:

```javascript
// CSV Upload & Parsing
function handleFile(file)              // Entry point for file upload
function parseCSV(text)                // Custom CSV parser (handles quoted fields)
function loadConversationData(data)    // Load parsed data into UI

// Storage (Three-Layer Architecture)
async function initIndexedDB()         // Initialize IndexedDB
async function saveToIndexedDB(id, data)    // Save full CSV data
async function getFromIndexedDB(id)     // Retrieve full CSV data
function addToHistory(file, data)      // Add to upload history (localStorage)

// R2 Upload (Client-Side Direct Upload)
async function uploadToR2(file)        // Get presigned URL + upload directly to R2
  → fetch('/api/get-upload-url')       // Step 1: Get presigned URL
  → fetch(uploadUrl, { method: 'PUT' }) // Step 2: Upload to R2

// UI Navigation
function switchView(viewName, event)   // Switch between views (upload/history/analysis)
function loadHistoryFile(id)           // Load file from upload history
function renderHistoryGrid()           // Render upload history cards
```

**IndexedDB Schema**:
```javascript
Database: 'CSVVisualizerDB', version: 1
ObjectStore: 'csvData', keyPath: 'id'
Records: { id: timestamp, data: parsedCSV }
```

**localStorage Schema**:
```javascript
Key: 'uploadHistory'
Value: JSON.stringify([
  {
    id: '1765425720801',
    fileName: 'export-2025-12-11.csv',
    fileSize: 22351826,
    uploadTime: '2025-12-11T04:02:00.801Z',
    threadCount: 1234,
    r2Url: 'https://pub-xxx.r2.dev/1765425720801-export-2025-12-11.csv' // null until upload completes
  }
])
```

### Backend API Routes

**`api/get-upload-url.js`** (102 lines) - **ACTIVE**
- Generates presigned URLs for client-side direct upload to R2
- No file size limit (payload < 1KB)
- Returns: `{ uploadUrl, publicUrl, key, expiresIn: 900 }`
- CORS headers included for cross-origin requests
- Uses `@aws-sdk/s3-request-presigner` for URL signing

**`api/upload-to-r2.js`** - **DEPRECATED**
- Original server-side upload approach
- Subject to Vercel's 4.5MB payload limit
- Replaced by client-side direct upload
- Kept for backward compatibility

### Environment Variables

**`.env.local`** (local development):
```bash
R2_ACCOUNT_ID=bc19681f5c65cc1581d746eca6f0c4e6
R2_ACCESS_KEY_ID=bf54fa277551050cc96ddde78ccd9f77
R2_SECRET_ACCESS_KEY=1c1ee1277974d6e071ef3299f234613b5fa68051586360935592af1dcf0df028
R2_BUCKET_NAME=csv-visualizer-uploads
R2_PUBLIC_URL=https://pub-c227d8df57814956a0da7c48adeb213b.r2.dev
```

**Vercel Production** (set via `vercel env add`):
- All 5 variables above must be set for production deployment
- ⚠️ If changing `R2_PUBLIC_URL`, update both local and Vercel environments
- ⚠️ Changes to environment variables require server restart (`npm run dev`)

### Configuration Files

**`vercel.json`**:
```json
{
  "buildCommand": "echo 'No build needed - static site'",
  "outputDirectory": "public",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**`package.json`** - Key dependencies:
- `@aws-sdk/client-s3`: R2 API client
- `@aws-sdk/s3-request-presigner`: Presigned URL generation
- `express`: Local development server
- `dotenv`: Environment variable loading

---

## Design System (Claude Style)

### Color Palette

```css
:root {
  --bg-app: #F5F4F1;           /* Warm gray background */
  --bg-panel: #FFFFFF;         /* Card backgrounds */
  --bg-sidebar: #EBEAE8;       /* Sidebar background */
  --text-primary: #2D2D2D;     /* Near-black text */
  --text-secondary: #666666;   /* Secondary text */
  --text-accent: #DA7756;      /* Warm orange (Anthropic brand) */
  --border-subtle: #E0E0E0;    /* Subtle borders */
  --shadow-card: 0 2px 8px rgba(0,0,0,0.04);
  --shadow-float: 0 8px 24px rgba(0,0,0,0.08);
}
```

### Typography

- **Headings**: `Merriweather` (serif, Georgia fallback)
- **Body/UI**: `Inter` (sans-serif, -apple-system fallback)
- **Code/Data**: `Monaco, Courier` (monospace)

### Key UI Patterns

**Navigation**:
- Left sidebar (260px fixed width)
- Sticky positioning with scroll
- Active state highlighting (orange accent)

**Cards**:
```css
.card {
  background: var(--bg-panel);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 24px;
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: var(--shadow-float);
  transform: translateY(-2px);
}
```

**Upload History Grid**:
- CSS Grid: `repeat(auto-fill, minmax(300px, 1fr))`
- Gap: 20px
- Responsive: 3 columns (desktop) → 2 columns (tablet) → 1 column (mobile)

---

## Data Flow Architecture

### Upload Flow (New Files)

```
1. User selects CSV file
   └→ handleFile(file)

2. Parse CSV with custom parser
   └→ parseCSV(text)
      - Handles quoted fields with newlines
      - Converts to { thread_id: [...messages] } structure

3. Save to IndexedDB (full data)
   └→ saveToIndexedDB(timestamp, parsedData)

4. Save metadata to localStorage
   └→ addToHistory(file, data)
      - Only saves: id, fileName, fileSize, uploadTime, threadCount
      - Limit: 50 records (auto-cleanup oldest)

5. Upload to R2 (async, non-blocking)
   └→ uploadToR2(file)
      a. Get presigned URL from API
         POST /api/get-upload-url { fileName, fileSize, contentType }
         ← { uploadUrl, publicUrl, key }

      b. Upload directly to R2 (client-side)
         PUT uploadUrl (body: file)
         ← 200 OK

      c. Update localStorage with r2Url
         uploadHistory[i].r2Url = publicUrl

6. Display in UI
   └→ renderHistoryGrid()
```

### Load History Flow

```
1. User clicks history card
   └→ loadHistoryFile(id)

2. Retrieve from IndexedDB
   └→ getFromIndexedDB(id)

3. Load into conversation viewer
   └→ loadConversationData(data)
      - Populates thread selector
      - Renders first conversation
      - Updates statistics
```

### R2 CORS Configuration (Critical)

**Location**: Cloudflare Dashboard → R2 → csv-visualizer-uploads → Settings → CORS Policy

**Required Configuration**:
```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://csv-visualizer-one.vercel.app"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
```

**⚠️ Without CORS**: Client-side uploads will fail with `No 'Access-Control-Allow-Origin' header` error

**Verification**:
```bash
curl -X OPTIONS \
  -H "Origin: https://csv-visualizer-one.vercel.app" \
  -H "Access-Control-Request-Method: PUT" \
  -i "https://csv-visualizer-uploads.bc19681f5c65cc1581d746eca6f0c4e6.r2.cloudflarestorage.com/"

# Expected: Access-Control-Allow-Origin: https://csv-visualizer-one.vercel.app
```

---

## CSV Parsing Logic

### Custom Parser (Handles Edge Cases)

**Problem**: Standard CSV libraries fail on this dataset due to:
- Unescaped newlines within quoted fields
- Nested JSON strings with escaped quotes
- Mixed encoding (Chinese + English)

**Solution**: Custom regex-based parser

```javascript
function parseCSV(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const row = {};
    const values = parseCSVLine(lines[i]); // Handles quoted fields

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    rows.push(row);
  }

  return rows;
}
```

**Thread Aggregation**:
```javascript
const conversations = {};
rows.forEach(row => {
  const threadId = row.thread_id || row.session_id;
  if (!conversations[threadId]) {
    conversations[threadId] = [];
  }
  conversations[threadId].push({
    timestamp: row.timestamp,
    text: row.text || row.input,
    images: parseImageList(row.image_list) // JSON.parse
  });
});
```

---

## Common Issues and Solutions

### Issue 1: CORS Error on R2 Upload

**Symptom**:
```
Access to fetch at 'https://csv-visualizer-uploads...r2.cloudflarestorage.com/...'
from origin 'https://csv-visualizer-one.vercel.app'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
```

**Root Cause**: R2 bucket CORS not configured

**Fix**: See "R2 CORS Configuration" section above

**Docs**: `CORS_TROUBLESHOOTING.md`, `CORS_QUICK_SETUP.md`

---

### Issue 2: 413 Content Too Large

**Symptom**:
```
POST /api/upload-to-r2 413 (Content Too Large)
```

**Root Cause**: Vercel Serverless Functions have 4.5MB payload limit

**Fix**: Use client-side direct upload (already implemented)
- Modern flow: Client → `/api/get-upload-url` → Direct upload to R2
- Old flow (deprecated): Client → `/api/upload-to-r2` → R2

**Docs**: `R2_413_FIX_OPTIONS.md`, `CLIENT_UPLOAD_COMPLETE.md`

---

### Issue 3: QuotaExceededError (localStorage)

**Symptom**:
```
QuotaExceededError: Failed to execute 'setItem' on 'Storage':
Setting the value of 'uploadHistory' exceeded the quota
```

**Root Cause**: localStorage has 5-10MB limit, full CSV data too large

**Fix**: Three-layer storage architecture (already implemented)
- IndexedDB: Full CSV data (unlimited)
- localStorage: Metadata only (<1KB per record)
- R2: Cloud backup (optional)

**Docs**: `STORAGE_FIX.md`

---

### Issue 4: Environment Variables Not Loading

**Symptom**: API returns 500 error, logs show `undefined` for `process.env.R2_*`

**Fixes**:
1. Check `.env.local` exists and has correct format
2. Restart server: `pkill -f "node server.js" && npm run dev`
3. For Vercel: `vercel env pull .env.local` to sync from production

---

### Issue 5: Port 3000 Already in Use

**Fix**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

---

## Testing Strategy

### Manual Testing Checklist

**Upload Flow**:
- [ ] Upload small CSV file (<1MB) → Should succeed
- [ ] Upload large CSV file (>10MB) → Should succeed with IndexedDB
- [ ] Upload very large file (>50MB) → Check R2 upload completes
- [ ] Verify upload history shows new file
- [ ] Verify r2Url appears after upload completes

**History Flow**:
- [ ] Load file from history → Should restore from IndexedDB
- [ ] Delete history record → Should remove from localStorage + IndexedDB
- [ ] Reload page → History persists

**CORS Verification**:
- [ ] Open DevTools Network tab
- [ ] Upload file
- [ ] Check OPTIONS preflight request → Should return 204 with CORS headers
- [ ] Check PUT request to R2 → Should return 200

### Automated Tests

```bash
npm test   # Runs test/test-csv-parser.js
```

**Coverage**:
- CSV parsing with quoted fields
- JSON field extraction
- Thread aggregation
- Performance: 10,000 records < 1 second

---

## Deployment Checklist

### Pre-Deployment

- [ ] Test locally: `npm run dev` → Upload file → Verify works
- [ ] Check environment variables in `.env.local`
- [ ] Verify R2 CORS configured
- [ ] Run tests: `npm test`
- [ ] Commit changes with proper message format

### Deploy to Vercel

```bash
# 1. Commit and push
git add .
git commit -m "feat: Description

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin main

# 2. Deploy to production
npx vercel --prod --yes

# 3. Verify environment variables (if needed)
vercel env ls

# 4. Test production
# Visit https://csv-visualizer-one.vercel.app
# Upload test file
# Check DevTools console for errors
```

### Post-Deployment

- [ ] Test production URL: https://csv-visualizer-one.vercel.app
- [ ] Upload small test file → Verify works
- [ ] Upload large file (>5MB) → Verify R2 upload works
- [ ] Check R2 bucket in Cloudflare dashboard → File should appear
- [ ] Test on mobile device (responsive design)

---

## File Size Limits

| Component | Limit | Notes |
|-----------|-------|-------|
| Vercel Serverless (request body) | 4.5MB | Bypassed via presigned URLs |
| Vercel Serverless (response body) | 4.5MB | Not affected (returns small JSON) |
| Cloudflare R2 (single upload) | 5GB | Per-object limit |
| Cloudflare R2 (total storage) | 10GB | Free tier |
| localStorage | 5-10MB | Only metadata stored |
| IndexedDB | Unlimited | Browser-dependent (usually >100MB) |

---

## Browser Compatibility

**Supported**:
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

**Required Features**:
- IndexedDB API
- Fetch API
- ES6 (async/await, arrow functions)
- CSS Grid
- CSS Custom Properties

---

## Performance Optimization

### Current Performance

- **CSV Parsing**: 100MB file < 5 seconds
- **IndexedDB Write**: 10MB data < 500ms
- **R2 Upload**: Network-dependent (20MB ≈ 10-30 seconds on 5Mbps)
- **History Load**: <100ms (from IndexedDB)

### Optimization Techniques

1. **Lazy Loading**: Only load visible history cards
2. **Chunked Upload**: Future enhancement for files >100MB
3. **Service Worker**: Future enhancement for offline support
4. **Compression**: Future enhancement (gzip before R2 upload)

---

## Security Considerations

### Implemented

- ✅ CORS properly configured (origin whitelist)
- ✅ File type validation (CSV only)
- ✅ Presigned URLs with 15-minute expiry
- ✅ No sensitive data in client-side code
- ✅ Environment variables secured in Vercel

### Future Enhancements

- [ ] User authentication (OAuth)
- [ ] Rate limiting on API routes
- [ ] File size limits on frontend
- [ ] Malware scanning for uploads

---

## Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | User-facing documentation |
| `STORAGE_FIX.md` | Three-layer storage architecture |
| `CORS_TROUBLESHOOTING.md` | CORS configuration guide |
| `CORS_QUICK_SETUP.md` | Quick CORS setup (3 minutes) |
| `CLIENT_UPLOAD_COMPLETE.md` | Client-side upload implementation |
| `R2_413_FIX_OPTIONS.md` | Solution comparison for 413 error |
| `R2_SETUP_GUIDE.md` | Complete R2 setup guide |
| `DEPLOYMENT_SUCCESS.md` | Deployment success checklist |

---

## Related Projects

This project is part of the `/Users/mac/Desktop/ai-pm/` workspace:

- **csv-visualizer** (this project): CSV conversation visualizer
- **Pen-APP**: Local-first AI creative studio
- **AI Studio**: Online AI workspace (Next.js)
- **线上数据 html**: Data analysis and HTML reports

---

## Important Notes

- ⚠️ **No Auto-Deploy**: GitHub integration exists but auto-deploy may not be enabled. Always use `npx vercel --prod` after pushing.
- ⚠️ **CORS is Critical**: Without proper CORS configuration, R2 uploads will fail. See `CORS_TROUBLESHOOTING.md`.
- ⚠️ **Environment Variables**: Changes to `.env.local` require server restart. Vercel variables require redeployment.
- ✅ **Backward Compatible**: Old upload history (before IndexedDB) still works but without cloud backup.
- ✅ **No Build Step**: Pure static HTML - easy to deploy anywhere (Vercel, Netlify, GitHub Pages).

---

**Last Updated**: 2025-12-11
**Version**: 1.0.0
**Status**: Production-ready with R2 cloud storage
