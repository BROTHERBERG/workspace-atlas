# 🚀 Workscape Atlas - Deployment Checklist

**Quick reference for launching to production**

---

## Pre-Deployment (Local Setup)

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Configure environment
cp .env.example .env
# Edit .env with your values (see below)

# 3. Set up database
npx prisma generate
npx prisma migrate deploy

# 4. Test build locally
npm run build
npm start
```

---

## Required Environment Variables

```bash
# Database (add connection pooling params)
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"

# Generate secrets (run in terminal)
# openssl rand -base64 32
NEXTAUTH_SECRET="[generated-secret-here]"
JWT_SECRET="[generated-secret-here]"

# URLs
NEXTAUTH_URL="https://your-domain.com"
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Email (for contact forms)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@your-domain.com"

# Optional but recommended
REDIS_URL="rediss://default:password@host.upstash.io:6379"
LOG_LEVEL="INFO"
RATE_LIMIT_REQUESTS_PER_MINUTE="100"
```

---

## Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Link project (first time only)
vercel link

# Add environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add JWT_SECRET
# ... add all required vars

# Deploy to production
vercel --prod
```

---

## Post-Deployment Verification

### ✅ Health Checks

- [ ] Homepage loads: `https://your-domain.com`
- [ ] API responds: `https://your-domain.com/api/workspaces`
- [ ] Database connected: Check admin dashboard
- [ ] Auth works: Test login/register
- [ ] Email sends: Test contact form
- [ ] Images load: Check workspace pages

### ✅ Performance Checks

```bash
# Run Lighthouse audit
npx lighthouse https://your-domain.com --view

# Targets:
# - Performance: >90
# - Accessibility: >90
# - Best Practices: >90
# - SEO: >90
```

### ✅ Security Checks

- [ ] HTTPS enabled (SSL certificate)
- [ ] Security headers present (check Network tab)
  - Content-Security-Policy
  - Strict-Transport-Security
  - X-Frame-Options
  - X-Content-Type-Options
- [ ] Rate limiting active (test with repeated requests)
- [ ] CSRF tokens working (check forms)

### ✅ Monitoring Setup

- [ ] **Error Tracking**: Set up Sentry
  ```bash
  npm install @sentry/nextjs
  npx @sentry/wizard -i nextjs
  ```

- [ ] **Uptime Monitoring**: Configure UptimeRobot or similar
- [ ] **Analytics**: Add Google Analytics (optional)
- [ ] **Logs**: Set up log aggregation (LogTail, Datadog)

---

## DNS Configuration

```
# Example DNS records
@ (root)     A      76.76.21.21  (Vercel IP)
www          CNAME  cname.vercel-dns.com
```

---

## Database Maintenance

```bash
# Create database backup schedule
# Recommended: Daily backups with 7-day retention

# Supabase: Backups automatic on paid plans
# Railway: Configure in dashboard
# Vercel Postgres: Use pg_dump

# Example manual backup:
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

---

## Scaling Triggers

### When to scale (usage metrics)

**Tier 1: Current Setup (0-1k daily users)**
- ✅ Vercel Hobby/Pro
- ✅ Supabase Free/Pro
- ✅ In-memory caching
- ✅ Single database

**Tier 2: Add Redis (1k-10k daily users)**
- 🔄 Add Upstash Redis
- 🔄 Upgrade Supabase to Pro/Team
- 🔄 Increase connection pool (20-30)

**Tier 3: Scale Infrastructure (10k+ daily users)**
- 🔄 Database read replicas
- 🔄 CDN for static assets
- 🔄 Separate admin API instance
- 🔄 Job queue (Bull/BullMQ)

---

## Quick Troubleshooting

### Build fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install --legacy-peer-deps
npm run build
```

### Database connection errors
```bash
# Check connection string format
# Add connection pooling params
DATABASE_URL="...?connection_limit=10&pool_timeout=20"

# Test connection
npx prisma db push --preview-feature
```

### Rate limit issues
```bash
# Adjust in middleware.ts or add IP whitelist
const WHITELISTED_IPS = ['your.ip.here']
```

### Slow performance
```bash
# Analyze bundle
ANALYZE=true npm run build

# Check slow queries in admin dashboard
# Location: /admin/dashboard > Performance tab
```

---

## Support Resources

- 📘 **Full Guide**: [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)
- 📗 **Progress Log**: [docs/PROGRESS_SUMMARY.md](docs/PROGRESS_SUMMARY.md)
- 📙 **Dev Guide**: [CLAUDE.md](CLAUDE.md)
- 🔧 **Issues**: GitHub Issues

---

## Emergency Contacts

```bash
# Database
Supabase Support: https://supabase.com/support

# Hosting
Vercel Support: https://vercel.com/support

# Email
SMTP Provider Support: [your-provider]

# DNS
Domain Registrar Support: [your-registrar]
```

---

## Final Pre-Launch Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Build passes locally
- [ ] Security headers verified
- [ ] SSL certificate active
- [ ] Custom domain configured
- [ ] Email sending works
- [ ] Error monitoring active
- [ ] Backups scheduled
- [ ] Team has access to all services
- [ ] Documentation shared with team

---

**Status**: Ready to deploy! 🚀

**Command**: `vercel --prod`

**Docs**: See [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for details

---

*Built with ❤️ | Hardened for production | Optimized for scale*
