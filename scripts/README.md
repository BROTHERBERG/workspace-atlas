# Data Import Scripts

Scripts for importing real coworking space data into Workscape Atlas.

## Quick Start

```bash
# 1. Install CSV dependencies
npm install csv-parse csv-stringify

# 2. Generate sample data
npm run scrape:sample

# 3. Import into database
npm run import:workspaces data/workspaces-sample.csv
```

## Scripts Overview

### `scrape-coworking-spaces.ts`

Generates sample coworking space data. Currently includes 5 real locations (WeWork, Regus).

**Usage:**
```bash
npx tsx scripts/scrape-coworking-spaces.ts
# Creates: data/workspaces-sample.csv
```

**To add more spaces:**
1. Manually edit `data/workspaces-sample.csv`
2. Add rows following the template format
3. Or implement API scraping (Google Places, etc.)

### `import-workspaces.ts`

Imports workspaces from CSV file into PostgreSQL database.

**Usage:**
```bash
npx tsx scripts/import-workspaces.ts data/workspaces-sample.csv
```

**Features:**
- Automatically generates unique slugs
- Skips duplicates (by source + sourceId)
- Validates required fields
- Reports import statistics

## CSV Format

See `data/workspaces-template.csv` for the full template.

**Required Fields:**
- `name` - Workspace name
- `city` - City name
- `country` - Country name

**Recommended Fields:**
- `address` - Full street address
- `latitude` / `longitude` - GPS coordinates
- `website` - Official website URL
- `phone` - Contact phone number
- `description` - Short description

**Pricing Fields:**
- `hotDeskPrice` - Hot desk monthly price
- `dedicatedDeskPrice` - Dedicated desk monthly price
- `privateOfficePrice` - Private office monthly price
- `pricingCurrency` - Currency code (USD, GBP, EUR)

**Amenities:**
Comma-separated list: `WiFi,Coffee,Meeting Rooms,24/7 Access`

**Images:**
Comma-separated URLs: `https://example.com/img1.jpg,https://example.com/img2.jpg`

## Data Sources

### Manual Entry
Best for curated, high-quality listings.

### Google Places API
```bash
# Set in .env:
GOOGLE_PLACES_API_KEY=your_key_here

# Then modify scrape-coworking-spaces.ts to use the API
```

### Web Scraping
Popular coworking directories:
- WeWork: https://www.wework.com/locations
- Regus: https://www.regus.com/
- Coworker: https://www.coworker.com/
- Deskpass: https://www.deskpass.com/

**Note**: Always respect robots.txt and terms of service.

## Scaling to 50-100 Spaces

### Option 1: Manual Curation (Recommended for Demo)
1. Visit competitor sites (WeWork, Regus, Spaces)
2. Copy 10-15 spaces from each
3. Add to CSV manually
4. Time: ~2-3 hours for 50 spaces

### Option 2: Google Places API
```typescript
// Add to scrape-coworking-spaces.ts
const placesAPI = new GooglePlacesAPI(process.env.GOOGLE_PLACES_API_KEY)
const results = await placesAPI.searchCoworkingSpaces('New York', 50)
```

### Option 3: Hire Data Entry
- Upwork/Fiverr: $50-100 for 100 spaces
- Provide template and instructions
- Time: 1-2 days

## Bottle Rocket Integration

### Adding "Request Talent" CTA

After importing workspaces, you can add talent request functionality:

1. **Database Table** - Already exists: `TalentLead`
2. **API Route** - Create: `app/api/talent-leads/route.ts`
3. **Form Component** - Add to workspace detail pages
4. **Email Notification** - Send to Bottle Rocket on new leads

See parent README for full integration guide.

## Troubleshooting

**Import fails with "unique constraint":**
- A workspace with that slug already exists
- Check the `slug` field or let the script auto-generate

**Missing coordinates:**
- Use Google Maps to find lat/long
- Or use geocoding API

**Images not loading:**
- Use Unsplash URLs for placeholder images
- Or upload to Cloudinary and use those URLs

## Next Steps

After importing data:
1. Run development server: `npm run dev`
2. Visit: http://localhost:3005/directory
3. Verify workspaces appear
4. Test search and filters
5. Add "Request Talent" CTAs

## Data Quality

For best results with Bottle Rocket pitch:
- ✅ Real company names (WeWork, Regus, etc.)
- ✅ Accurate addresses and coordinates
- ✅ Working website links
- ✅ Realistic pricing
- ✅ Quality images (Unsplash is fine)
- ⚠️ Don't need perfect data, just realistic
