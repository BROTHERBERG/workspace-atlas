# Bottle Rocket Search - Demo Build Guide

**Goal**: Build a compelling demo in 3-5 days to pitch Bottle Rocket Search's CEO on investing.

## The Pitch

"We're building a coworking space directory that naturally generates qualified leads for executive recruitment. Spaces use our platform to improve their presence and get discovered - when they need leadership talent, they already trust us."

## Demo Requirements

What the CEO needs to see:
1. ✅ **Real directory of 50-100 coworking spaces** - Shows market presence
2. ✅ **Working search & filters** - Proves technical capability
3. ✅ **Lead capture system** - Shows the money (his sales pipeline)
4. ✅ **Admin dashboard** - Visualizes the funnel
5. ✅ **"Request Talent" CTA** - Clear path to revenue

## Build Timeline: 3-5 Days

### Day 1: Data Foundation ✅
**Status**: Scripts ready, need execution

```bash
# Install dependencies
npm install csv-parse csv-stringify --legacy-peer-deps

# Generate sample data (5 spaces included)
npm run scrape:sample

# Edit CSV to add 45-95 more spaces
# Use scripts/README.md for sources

# Import into database
npm run import:workspaces data/workspaces-sample.csv
```

**Deliverable**: 50-100 real coworking spaces in database

### Day 2: Real Directory Pages

**Tasks**:
1. Update `/directory` to query Prisma instead of Faker
2. Wire up search filters to database
3. Update workspace detail pages
4. Test pagination

**Files to modify**:
- `app/directory/page.tsx`
- `app/spaces/[id]/page.tsx`
- `components/space-card.tsx`

**Deliverable**: Working directory browsing real data

### Day 3: Lead Capture System

**Tasks**:
1. Create `TalentLead` Prisma model
2. Build API endpoint: `app/api/talent-leads/route.ts`
3. Add "Request Talent" button to workspace pages
4. Create lead capture form
5. Set up email notifications to Bottle Rocket

**Deliverable**: Lead generation pipeline

### Day 4: Admin Dashboard

**Tasks**:
1. Create lead tracking dashboard: `app/admin/talent-leads/page.tsx`
2. Show metrics:
   - Total leads this week/month
   - Leads by industry
   - Leads by location
   - Conversion funnel
3. Export to CSV functionality

**Deliverable**: Visual proof of pipeline value

### Day 5: Polish & Practice

**Tasks**:
1. Add 10-20 more high-value spaces (top coworking brands)
2. Test entire flow end-to-end
3. Take screenshots for pitch deck
4. Practice demo walkthrough
5. Prepare talk track

**Deliverable**: Polished demo ready to show

## Quick Start (Right Now)

```bash
# 1. Install CSV tools
npm install csv-parse csv-stringify --legacy-peer-deps

# 2. Run database migrations (if not done)
npx prisma migrate dev

# 3. Generate sample data
npm run scrape:sample

# 4. (Optional) Manually add more spaces to data/workspaces-sample.csv

# 5. Import into database
npm run import:workspaces data/workspaces-sample.csv

# 6. Verify in development
npm run dev
# Visit: http://localhost:3005/directory
```

## Data Collection Strategy

### Fast Track (2-3 hours for 50 spaces)

**WeWork** (15 spaces):
- Visit: https://www.wework.com/locations
- Copy: Name, address, city for major locations
- Add to CSV

**Regus** (15 spaces):
- Visit: https://www.regus.com/
- Find major city locations
- Add to CSV

**Industrious** (10 spaces):
- Visit: https://www.industriousoffice.com/locations
- Premium spaces in top cities

**Local/Independent** (10 spaces):
- Google "coworking space [city]"
- Add local favorites

**Sample Template**:
```csv
name,city,country,website,description,amenities,hotDeskPrice
Industrious Downtown LA,Los Angeles,USA,https://...,Modern coworking...,WiFi;Coffee;Meeting Rooms,495
```

### Quality Over Quantity

For the demo, **50 high-quality spaces > 100 mediocre ones**

Focus on:
- ✅ Real brands (WeWork, Regus, Spaces, Industrious)
- ✅ Major cities (NYC, SF, LA, London, Austin)
- ✅ Accurate addresses
- ✅ Working website links
- ✅ Realistic pricing

## The Demo Flow

**Screen 1: Homepage**
"This is Workscape Atlas - a global directory of coworking spaces"

**Screen 2: Directory**
"We have 50+ spaces across major cities" (scroll, show search working)

**Screen 3: Space Detail**
"Each space has full details - and here's the key..." (show Request Talent button)

**Screen 4: Lead Capture**
"When a space needs leadership talent, they submit here" (show form)

**Screen 5: Admin Dashboard**
"And this is YOUR sales pipeline - see who's looking, where, and what roles" (show leads table)

**The Ask**:
"We want to build this to 1,000+ spaces and drive 100+ qualified leads/month to you. We need $X to:
- Build out the platform
- Hire data team to populate spaces
- Drive traffic through SEO/content
- In exchange: Exclusive recruitment partnership + equity"

## Technical Notes

### Database Schema (Already Done)

```prisma
model Workspace {
  // Basic fields ready for import
  name, city, country, address
  website, phone, email
  latitude, longitude
  amenities String[]
  images String[]
  hotDeskPrice, dedicatedDeskPrice, privateOfficePrice
  // ... etc
}
```

### Need to Add: TalentLead Model

```prisma
model TalentLead {
  id          String   @id @default(cuid())
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id])

  contactName  String
  contactEmail String
  contactPhone String?
  companyName  String
  position     String   // e.g., "CEO", "COO", "Head of Operations"
  industry     String?
  urgency      String?  // "Immediate", "1-3 months", "3-6 months"
  budget       String?
  notes        String?  @db.Text

  status       String   @default("NEW") // NEW, CONTACTED, QUALIFIED, CLOSED
  source       String   @default("Website")

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("talent_leads")
}
```

## Success Metrics for Demo

**Prove These Points**:

1. **Market Presence**: "We have 50+ real coworking spaces" ✅
2. **Technical Execution**: "Search actually works, it's real data" ✅
3. **Lead Generation**: "Here's how spaces request talent" ✅
4. **Pipeline Value**: "15 leads this week, here's the breakdown" ✅
5. **Scalability**: "This is just the start - imagine 1,000 spaces" ✅

## Questions CEO Will Ask

**Q: "How many spaces do you have?"**
A: "50 in the demo, but we can scale to 1,000+ with your investment"

**Q: "How do you get traffic?"**
A: "SEO (coworking directories rank well), content marketing, partnerships"

**Q: "What's your revenue model?"**
A: "Premium listings from spaces ($99-299/mo) + referral fees from placements (10-20%)"

**Q: "Why would spaces use you vs. LinkedIn?"**
A: "We're specialized - better matching, industry knowledge, warm intros through our community"

**Q: "What do you need money for?"**
A: "Data team to populate 1,000 spaces, dev to build features, marketing to drive traffic"

**Q: "What's my ROI?"**
A: "If we drive 100 qualified leads/month at your 10% close rate = 10 placements = $XXX,XXX revenue"

## Next Steps After Positive Meeting

If he's interested:
1. **Week 1-2**: Build out to 200 spaces
2. **Week 3-4**: Add digital scoring feature
3. **Week 5-6**: Launch beta, drive initial traffic
4. **Month 2**: Start generating real leads
5. **Month 3**: Prove model, discuss Series A

## Files Created for You

✅ **Data Import**:
- `scripts/import-workspaces.ts` - CSV importer
- `scripts/scrape-coworking-spaces.ts` - Sample data generator
- `data/workspaces-template.csv` - Template format
- `scripts/README.md` - Import documentation

✅ **Documentation**:
- This file - Complete demo build guide
- Step-by-step instructions
- Pitch flow and talk track
- FAQ for CEO meeting

## What You Need to Build Next

**Priority 1: Real Directory (Day 2)**
- Update directory queries to use Prisma
- Wire filters to database
- Test with imported data

**Priority 2: Lead Capture (Day 3)**
- Add TalentLead model
- Create API endpoint
- Build form component
- Email notifications

**Priority 3: Admin Dashboard (Day 4)**
- Lead tracking page
- Metrics visualization
- Export functionality

Ready to start? Begin with:
```bash
npm install csv-parse csv-stringify --legacy-peer-deps
npm run scrape:sample
```

Then manually add 45+ more spaces to the CSV and import!

## Support

Questions while building? Refer to:
- `scripts/README.md` - Data import help
- `docs/DEPLOYMENT_GUIDE.md` - Technical setup
- `docs/PROGRESS_SUMMARY.md` - What we've built so far

**Let's build something that gets funded!** 🚀💰
