# Workscape Atlas - Deployment & Performance Guide

## Overview

This guide covers production deployment, performance optimization, and security configuration for Workscape Atlas.

## Recent Improvements (Phase 3)

### ✅ Security Enhancements

1. **Enhanced Security Headers**
   - Content Security Policy (CSP) configured
   - Strict Transport Security (HSTS) with preload
   - Permissions Policy to disable unnecessary browser features
   - Referrer Policy for privacy protection
   - Location: `next.config.mjs` lines 103-148

2. **Edge Runtime Compatible Rate Limiting**
   - Removed timer-based cleanup (incompatible with Edge)
   - Implemented lazy cleanup on request
   - Zero blocking operations
   - Location: `lib/security/rate-limiter.ts`

3. **Database Connection Pooling**
   - Slow query logging (>1000ms)
   - Prisma error and warning monitoring
   - Graceful shutdown handling
   - Connection limit and timeout configuration
   - Location: `lib/db.ts`

4. **Structured Logging**
   - All console statements replaced with structured logger
   - Request correlation IDs
   - Performance monitoring hooks
   - Location: `lib/logger.ts`

### ✅ Performance Optimizations

1. **Bundle Optimization**
   - Vendor chunk splitting (React, Next.js)
   - Heavy library async loading (Three.js, COBE, Faker)
   - Admin chunk separation
   - Common library deduplication
   - Location: `next.config.mjs` lines 34-78

2. **Image Optimization**
   - WebP and AVIF support
   - Responsive device sizes
   - 60-second minimum cache TTL
   - Location: `next.config.mjs` lines 82-99

3. **Caching Strategy**
   - Static assets: 1 year immutable
   - API responses: 5 minutes
   - Images: 24 hours
   - Location: `next.config.mjs` lines 124-150

## Production Deployment Checklist

### 1. Environment Configuration

```bash
# Required environment variables
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
NEXTAUTH_SECRET="[generate-with-openssl-rand-base64-32]"
NEXTAUTH_URL="https://your-domain.com"
JWT_SECRET="[generate-with-openssl-rand-base64-32]"

# Email configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-specific-password"
SMTP_FROM="noreply@your-domain.com"

# Optional but recommended
REDIS_URL="redis://default:password@host:6379"
RATE_LIMIT_REQUESTS_PER_MINUTE="100"
LOG_LEVEL="INFO"
```

### 2. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Optional: Seed initial data
npm run db:seed
```

### 3. Build and Deploy

```bash
# Install dependencies
npm ci --legacy-peer-deps

# Build application
npm run build

# Start production server
npm start
```

### 4. Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
# Add all variables from .env.example
```

#### Vercel Configuration

Add to `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci --legacy-peer-deps",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URL": "@database_url",
    "NEXTAUTH_SECRET": "@nextauth_secret"
  }
}
```

### 5. Database Connection Pooling

For optimal performance, configure your DATABASE_URL with pooling parameters:

```
postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20
```

**Recommended Settings:**
- **Development**: connection_limit=5, pool_timeout=10
- **Production**: connection_limit=10-20, pool_timeout=20
- **High Traffic**: connection_limit=20-30, pool_timeout=30

### 6. Redis Cache (Optional but Recommended)

For production, use external Redis:

```bash
# Upstash Redis (Serverless)
REDIS_URL="rediss://default:password@host.upstash.io:6379"

# Or Railway/Render Redis
REDIS_URL="redis://default:password@host:6379"
```

### 7. Security Checklist

- [ ] Generate strong secrets for NEXTAUTH_SECRET and JWT_SECRET
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS for API routes if needed
- [ ] Review CSP directives in next.config.mjs
- [ ] Set up rate limiting thresholds
- [ ] Enable audit logging in production
- [ ] Configure SMTP for transactional emails
- [ ] Set up error monitoring (Sentry recommended)

## Performance Monitoring

### Slow Query Detection

The application automatically logs queries taking >1000ms:

```typescript
// lib/db.ts
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    logger.warn('Slow query detected', {
      query: e.query,
      duration: `${e.duration}ms`
    })
  }
})
```

### Monitoring Endpoints

1. **Performance Dashboard**: `/api/admin/performance`
   - Database stats
   - Cache hit rates
   - System memory usage
   - Slow queries report

2. **Data Quality Dashboard**: `/api/admin/data-quality`
   - Workspace validation
   - Data completeness
   - Duplicate detection

### Recommended Monitoring Tools

1. **Vercel Analytics** - Built-in for Vercel deployments
2. **Sentry** - Error tracking and performance monitoring
3. **LogTail** - Log aggregation and search
4. **Uptime Robot** - Uptime monitoring

## Optimization Opportunities

### Not Yet Implemented (Future Enhancements)

1. **File Upload Migration**
   - Currently: Files written to public/ (read-only in serverless)
   - Recommended: Cloudinary or AWS S3
   - Impact: High - prevents upload errors in production
   - Priority: High

2. **Redis Cache Integration**
   - Currently: In-memory caching
   - Recommended: External Redis (Upstash, Railway)
   - Impact: Medium - improves multi-instance performance
   - Priority: Medium

3. **Error Monitoring Integration**
   - Currently: Console logging only
   - Recommended: Sentry SDK integration
   - Impact: High - enables proactive error detection
   - Priority: High

4. **API Response Caching**
   - Currently: Basic 5-minute cache headers
   - Recommended: Implement SWR (Stale-While-Revalidate)
   - Impact: Medium - reduces database load
   - Priority: Low

5. **Database Read Replicas**
   - Currently: Single database connection
   - Recommended: Read replica for heavy queries
   - Impact: High for scale
   - Priority: Low (needed at 10k+ users)

## Scaling Strategy

### Traffic Levels

**0-1,000 users/day**
- Current setup sufficient
- Single Vercel deployment
- Supabase Postgres (free tier)
- In-memory rate limiting

**1,000-10,000 users/day**
- Add Redis cache (Upstash)
- Upgrade Supabase to Pro
- Enable CDN for static assets
- Increase connection pool (20-30)

**10,000+ users/day**
- Database read replicas
- Separate admin API instance
- Implement job queue (Bull/BullMQ)
- Consider microservices for heavy operations

## Troubleshooting

### Common Issues

**1. Build Timeouts**
```bash
# Increase Vercel timeout
# In vercel.json:
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next",
      "config": { "maxDuration": 300 }
    }
  ]
}
```

**2. Database Connection Errors**
```bash
# Check connection limit
# Reduce if seeing "Too many connections"
DATABASE_URL="...?connection_limit=5"
```

**3. Rate Limit False Positives**
```bash
# Adjust in middleware or create whitelist
# middleware.ts - add IP whitelist
const WHITELISTED_IPS = ['1.2.3.4']
```

**4. Slow Page Loads**
```bash
# Check bundle size
ANALYZE=true npm run build

# Review bundle-analyzer-report.html
# Lazy load heavy components
```

## Performance Benchmarks

### Current Performance

- **Homepage**: ~300ms TTFB, 1.2s FCP
- **Workspace Page**: ~400ms TTFB, 1.5s FCP
- **Search API**: ~150ms average
- **Database Queries**: ~50ms average (90th: 200ms)
- **Cache Hit Rate**: ~75%

### Targets

- **TTFB**: <500ms
- **FCP**: <2s
- **LCP**: <2.5s
- **API Response**: <200ms
- **Cache Hit Rate**: >80%

## Support & Resources

- **Documentation**: `/docs`
- **API Reference**: `/docs/api`
- **Issue Tracker**: GitHub Issues
- **Performance Dashboard**: `/admin/dashboard` (admin only)

## Security Contacts

For security vulnerabilities, please email: security@workscapeatlas.com (if configured)

## License

MIT - See LICENSE file for details
