# Data Import Documentation

This document describes the data import system for Workspace Atlas, which scrapes and populates workspace data from external sources.

## Overview

The data import pipeline consists of several components:

- **Google Places API Integration** (`lib/scraping/google-places.ts`)
- **Core Web Scraping Tools** (`lib/scraping/scraper-core.ts`) 
- **Data Import Pipeline** (`lib/data-import/import-pipeline.ts`)
- **CLI Scripts** (`scripts/import-data.ts`, `scripts/test-import.ts`)

## Architecture

### Data Flow
1. **Source APIs** → Google Places API, custom web scrapers
2. **Raw Data Extraction** → Normalized `WorkspaceRawData` format
3. **Validation & Processing** → Data validation, duplicate detection
4. **Database Import** → Prisma ORM, PostgreSQL database

### Key Components

#### GooglePlacesClient
- Searches for coworking spaces by city/location
- Fetches detailed place information
- Converts Google data to standardized format
- Handles rate limiting and error recovery

#### DataImportPipeline
- Processes data in configurable batches
- Validates data integrity
- Detects and skips duplicates
- Generates unique slugs for workspaces
- Provides detailed import statistics

#### WebScraper (Core)
- Rate-limited HTTP requests
- Retry logic with exponential backoff
- HTML parsing utilities
- Text extraction helpers

## Data Schema

### WorkspaceRawData Interface
```typescript
interface WorkspaceRawData {
  name: string              // Required workspace name
  description?: string      // Marketing description
  address?: string          // Full address
  city?: string            // City name
  country?: string         // Country name
  coordinates?: [number, number]  // [latitude, longitude]
  phone?: string           // Contact phone
  email?: string           // Contact email
  website?: string         // Website URL
  images?: string[]        // Array of image URLs
  amenities?: string[]     // List of amenities
  pricing?: {              // Pricing information
    hotDesk?: number
    dedicatedDesk?: number
    privateOffice?: number
    currency?: string
  }
  socialMedia?: {          // Social media URLs
    instagram?: string
    twitter?: string
    linkedin?: string
    facebook?: string
  }
  hours?: string           // Operating hours description
  rating?: number          // User rating (1-5)
  reviewCount?: number     // Number of reviews
  source: string           // Data source identifier
  sourceId?: string        // External source ID
  scrapedAt: Date         // When data was collected
}
```

### Database Schema
The data is imported into the `workspaces` table with the following key fields:

- **Identity**: `id`, `name`, `slug`
- **Location**: `address`, `city`, `country`, `latitude`, `longitude`
- **Contact**: `website`, `phone`, `email`
- **Social**: `instagramUrl`, `twitterUrl`, `linkedinUrl`, `facebookUrl`
- **Content**: `description`, `images[]`, `amenities[]`, `hoursDescription`
- **Pricing**: `pricingCurrency`, `hotDeskPrice`, `dedicatedDeskPrice`, `privateOfficePrice`
- **Metrics**: `rating`, `reviewCount`, `digitalScore`
- **Metadata**: `source`, `sourceId`, `scrapedAt`, `createdAt`, `updatedAt`

## Usage

### Environment Setup

1. **Database Configuration**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/workscape_atlas_dev"
   ```

2. **Google Places API** (optional but recommended)
   ```env
   GOOGLE_PLACES_API_KEY="your-api-key-here"
   ```

3. **Scraping Configuration**
   ```env
   SCRAPER_USER_AGENT="Mozilla/5.0 (compatible; WorkspaceAtlas/1.0)"
   SCRAPER_DELAY_MS="1000"
   SCRAPER_MAX_RETRIES="3"
   SCRAPER_TIMEOUT_MS="30000"
   ```

### Database Setup

1. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

2. **Run Migrations** (if using a real database)
   ```bash
   npm run db:migrate
   ```

### Import Commands

#### Test Import (Mock Data)
```bash
# Dry run with mock data
npx tsx scripts/test-import.ts --dry-run

# Import mock data to database
npx tsx scripts/test-import.ts
```

#### Google Places Import
```bash
# Dry run (no database changes)
npx tsx scripts/import-data.ts --dry-run

# Import all major cities
npx tsx scripts/import-data.ts

# Import specific cities
npx tsx scripts/import-data.ts --cities "New York,San Francisco,London"

# Custom batch size and no validation
npx tsx scripts/import-data.ts --batch-size 20 --no-validation

# Force import (overwrite existing)
npx tsx scripts/import-data.ts --force
```

### Configuration Options

#### ImportConfig
```typescript
interface ImportConfig {
  batchSize: number        // Items per batch (default: 10)
  maxConcurrent: number    // Concurrent requests (default: 3)
  skipExisting: boolean    // Skip duplicates (default: true)
  validateData: boolean    // Validate before import (default: true)  
  dryRun: boolean         // Preview only (default: false)
}
```

## Data Sources

### Google Places API
- **Coverage**: Global
- **Data Quality**: High (official business data)
- **Rate Limits**: 1000 requests/day (free tier)
- **Supported Queries**: 20+ major cities predefined

#### Predefined Cities
- **US**: New York, San Francisco, Los Angeles, Chicago, Austin, Seattle, Boston, Miami
- **International**: London, Berlin, Paris, Amsterdam, Barcelona, Tokyo, Singapore, Toronto, Sydney, Dubai

### Custom Web Scrapers (Future)
- WeWork locations
- Regus/Spaces directory
- Local coworking directories
- Property listing sites

## Data Quality

### Validation Rules
1. **Name**: Minimum 2 characters
2. **Address**: Minimum 10 characters  
3. **Coordinates**: Valid latitude/longitude pair
4. **Duplicates**: Detected by source ID or name/address similarity

### Data Processing
1. **Slug Generation**: Unique URL-friendly identifiers
2. **Image Collection**: Photos from Google Places
3. **Amenity Extraction**: Keyword matching from reviews/types
4. **Pricing Estimation**: Based on Google price_level (0-4 scale)

### Quality Metrics
- **Success Rate**: Percentage of successful imports
- **Error Rate**: Failed imports due to validation/network issues  
- **Duplicate Rate**: Skipped existing workspaces
- **Data Completeness**: Fields populated per workspace

## Monitoring & Logging

### Structured Logging
All import operations use structured JSON logging:

```typescript
logger.info('Import completed', {
  source: 'Google Places',
  processed: 150,
  imported: 142,
  skipped: 6,
  errors: 2,
  duration: '45.2s'
})
```

### Performance Tracking
- Request timing with `PerformanceTimer`
- Memory usage monitoring
- Database operation metrics
- Rate limiting compliance

### Error Handling
- Automatic retries with exponential backoff
- Graceful degradation on API failures
- Detailed error logging with context
- Import statistics even on partial failures

## Production Deployment

### Supabase Setup (Recommended)
1. Create Supabase project
2. Update `DATABASE_URL` in environment
3. Run migrations: `npm run db:migrate`
4. Import data: `npx tsx scripts/import-data.ts`

### Local PostgreSQL
1. Install PostgreSQL
2. Create database: `createdb workscape_atlas_dev`
3. Update `DATABASE_URL`
4. Follow same migration/import steps

### Scheduling (Future)
- Daily incremental updates
- Weekly full refresh
- Cron job integration
- Error notifications

## Troubleshooting

### Common Issues

#### Database Connection
```
Error: User was denied access on the database
```
**Solution**: Check `DATABASE_URL` and ensure database exists

#### API Rate Limits
```
Google Places API error: OVER_QUERY_LIMIT
```
**Solution**: Reduce `batchSize` or increase `SCRAPER_DELAY_MS`

#### Validation Failures
```
Invalid workspace name: null
```
**Solution**: Check data source quality or disable with `--no-validation`

#### Duplicate Slugs
```
Unique constraint failed on slug
```
**Solution**: Clear database or use `--force` flag

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=DEBUG npx tsx scripts/import-data.ts --dry-run
```

### Performance Issues
- Reduce `batchSize` (default: 10 → 5)
- Increase `SCRAPER_DELAY_MS` (default: 1000 → 2000)
- Lower `maxConcurrent` (default: 3 → 1)

## Future Enhancements

### Data Sources
- [ ] WeWork API integration
- [ ] Booking.com workspace listings  
- [ ] Yelp business listings
- [ ] Facebook Places API
- [ ] Custom web scrapers for major sites

### Features
- [ ] Image processing and optimization
- [ ] Automated data quality scoring
- [ ] Real-time data updates
- [ ] Competitive analysis integration
- [ ] User-contributed data validation

### Infrastructure
- [ ] Distributed scraping with Redis queue
- [ ] Kubernetes deployment
- [ ] Monitoring with Prometheus/Grafana
- [ ] Alert system for import failures
- [ ] Data pipeline orchestration

## API Reference

### DataImportPipeline Methods

#### `importFromGooglePlaces(): Promise<ImportResult>`
Imports workspace data from Google Places API using predefined city queries.

#### `importWorkspaceData(workspaces: WorkspaceRawData[]): Promise<ImportResult>`  
Imports an array of workspace data objects.

#### `cleanup(): Promise<void>`
Closes database connections and cleans up resources.

### GooglePlacesClient Methods

#### `searchCoworkingSpaces(query: PlaceSearchQuery): Promise<GooglePlace[]>`
Searches for coworking spaces matching the query parameters.

#### `getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null>`
Fetches detailed information for a specific place ID.

#### `convertToWorkspaceData(place: GooglePlaceDetails): WorkspaceRawData`
Converts Google Places data to standardized workspace format.

#### `getPhotoUrl(photoReference: string, maxWidth?: number): string`
Generates photo URLs from Google Places photo references.

---

For questions or issues with the data import system, please refer to the logs or create an issue in the project repository.