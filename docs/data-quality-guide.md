# Data Quality Validation and Deduplication Guide

This guide explains how to use the data quality validation and deduplication system in Workspace Atlas.

## Overview

The data quality system ensures that workspace data meets minimum quality standards before being added to the production database. It includes:

1. **Data Validation** - Checks data completeness, format, and accuracy
2. **Deduplication** - Identifies and prevents duplicate workspace entries
3. **Quality Scoring** - Assigns quality scores (0-100) to each workspace
4. **Automated Reporting** - Provides insights into data quality trends

## Quality Validation Rules

### Required Fields (20 points each)
- `name` - Workspace name (minimum 3 characters)
- `source` - Data source identifier
- `sourceId` - Unique identifier from source

### Recommended Fields (5 points each)
- `address` - Physical address (minimum 10 characters)
- `city` - City location
- `country` - Country location
- `website` - Website URL (must be valid URL format)

### Additional Validation Rules

**Name Quality (15 points)**
- Minimum 3 characters, maximum 100 characters
- Should contain valid characters (letters, numbers, basic punctuation)

**Description (5 points)**
- Minimum 10 characters for good quality
- Maximum 2000 characters

**Address Format (10 points)**
- Should contain both numbers and letters
- Minimum 10 characters for completeness

**Website URL (10 points)**
- Must be valid URL format
- Should start with http/https

**Email Format (10 points)**
- Must match standard email format regex

**Phone Format (5 points)**
- Must contain at least 7 digits

**Coordinates (15 points each)**
- Latitude must be between -90 and 90
- Longitude must be between -180 and 180
- Both must be provided together

**Images (15 points)**
- URLs must be valid
- Should point to common image formats (jpg, jpeg, png, webp, gif)

**Data Freshness (up to 20 points)**
- Data older than 30 days loses quality points
- Recent data (within 30 days) maintains full score

### Quality Score Thresholds

- **80-100**: Excellent quality data, ready for production
- **60-79**: Good quality data, may need minor improvements
- **40-59**: Fair quality data, requires attention before production
- **0-39**: Poor quality data, needs significant improvement

Default minimum threshold: **60 points**

## Deduplication Rules

The system identifies duplicates using multiple strategies:

### Exact Matches
1. **Source ID Match** - Same `sourceId` and `source`
2. **Website Match** - Identical website URLs
3. **Name + City Match** - Exact name match in same city (case-insensitive)

### Similarity Matching
Uses weighted similarity scoring:

- **Name similarity (40% weight)** - Levenshtein distance comparison
- **Address similarity (30% weight)** - Address string comparison
- **City similarity (20% weight)** - City name comparison
- **Website similarity (10% weight)** - Website URL comparison

**Similarity threshold**: 85% (configurable)

## Using the CLI Tool

### Basic Validation
```bash
# Validate existing database data
npx tsx scripts/validate-data-quality.ts --verbose

# Validate specific number of records
npx tsx scripts/validate-data-quality.ts --limit 100 --verbose

# Save detailed report
npx tsx scripts/validate-data-quality.ts --output report.json --verbose
```

### Scraper Validation
```bash
# Validate data from specific scraper
npx tsx scripts/validate-data-quality.ts --source wework --verbose

# Validate with custom threshold
npx tsx scripts/validate-data-quality.ts --threshold 70 --verbose

# Dry run (no database changes)
npx tsx scripts/validate-data-quality.ts --source regus --dry-run --verbose
```

### Output Interpretation

The CLI tool provides:
- **Total processed**: Number of records validated
- **Valid/Invalid counts**: Records meeting/failing quality threshold
- **Duplicate count**: Potential duplicate entries found
- **Average score**: Overall data quality score
- **Common issues**: Most frequent validation problems

## Using the Admin Dashboard

Access the data quality dashboard at `/admin/dashboard` under the "Data Quality" tab.

### Overview Tab
- Quality metrics and trends
- Common data issues
- Overall health indicators

### Validation Tab
- Run validation on recent data
- View invalid entries with specific errors
- Quality score distribution

### Duplicates Tab
- Find potential duplicate workspaces
- Review match confidence scores
- See matching fields and similarity details

## API Endpoints

### GET /api/admin/data-quality

**Query Parameters:**
- `action` - Action to perform (`status`, `validate`, `duplicates`)
- `limit` - Number of records to process (default: 100)
- `threshold` - Quality threshold (default: 60)

**Examples:**
```bash
# Get quality status
curl "/api/admin/data-quality?action=status"

# Run validation
curl "/api/admin/data-quality?action=validate&limit=200"

# Find duplicates
curl "/api/admin/data-quality?action=duplicates&limit=500"
```

### POST /api/admin/data-quality

**Actions:**
- `fix_duplicates` - Queue duplicate resolution (placeholder)

**Example:**
```bash
curl -X POST "/api/admin/data-quality" \
  -H "Content-Type: application/json" \
  -d '{"action": "fix_duplicates", "workspaceIds": ["id1", "id2"]}'
```

## Best Practices

### Before Data Import
1. Run validation on scraped data: `--source <scraper_name>`
2. Review quality scores and common issues
3. Fix data quality issues in scrapers if needed
4. Check for duplicates against existing database

### Regular Maintenance
1. Run weekly quality audits on database
2. Monitor quality score trends
3. Address common validation issues
4. Review and merge confirmed duplicates

### Quality Improvement
1. Focus on required fields first (highest impact)
2. Improve scraper logic for common issues
3. Add validation rules for new data sources
4. Set quality thresholds based on use case requirements

## Configuration

### Environment Variables
```env
# Database connection (required)
DATABASE_URL=your_database_url

# Google Places API (optional, for enhanced validation)
GOOGLE_PLACES_API_KEY=your_api_key
```

### Customizing Validation Rules

Edit `/lib/data-quality/validator.ts`:

```typescript
// Adjust quality thresholds
private qualityThreshold = 60 // Minimum score

// Modify required fields
private requiredFields = ['name', 'source', 'sourceId']

// Update recommended fields
private recommendedFields = ['address', 'city', 'country', 'website']
```

### Customizing Deduplication

Edit `/lib/data-quality/validator.ts`:

```typescript
// Adjust similarity threshold
private similarityThreshold = 0.85 // 85% similarity

// Modify weight factors in calculateSimilarity()
const nameSim = this.stringSimilarity(data1.name, data2.name)
score += nameSim * 0.4 // 40% weight for name
```

## Troubleshooting

### Common Issues

**High duplicate count**: Review deduplication threshold and rules
**Low quality scores**: Check most common validation errors
**API timeouts**: Reduce batch size with `--limit` parameter
**Permission errors**: Ensure admin role for API access

### Performance Considerations

- Large datasets: Use `--limit` to process in batches
- Background processing: Consider queue-based validation for production
- Database load: Run during low-traffic periods
- Memory usage: Monitor when processing large datasets

## Integration with Data Pipeline

The data quality system integrates with:

1. **Scraping Pipeline** - Validates data before database insertion
2. **Import Pipeline** - Filters out low-quality and duplicate data
3. **Admin Dashboard** - Provides real-time quality monitoring
4. **API Responses** - Ensures only quality data is served to users

For production deployments, consider implementing:
- Automated quality checks in CI/CD pipeline
- Real-time quality monitoring and alerts
- Scheduled batch validation jobs
- Quality metrics tracking and reporting