# 🎯 Bottle Rocket Demo - Quick Checklist

## Pre-Demo Setup (Do This First)

```bash
# 1. Install CSV tools
npm install csv-parse csv-stringify --legacy-peer-deps

# 2. Generate sample data (5 spaces included)
npm run scrape:sample

# 3. Import sample data
npm run import:workspaces data/workspaces-sample.csv

# 4. Verify it worked
npm run dev
# Visit: http://localhost:3005/directory
# Should see 5 sample workspaces
```

## Day-by-Day Tasks

### ☐ Day 1: Get Real Data (2-4 hours)

- [ ] Open `data/workspaces-sample.csv` in Excel/Google Sheets
- [ ] Visit WeWork.com - add 15 locations
- [ ] Visit Regus.com - add 15 locations
- [ ] Visit Industrious.com - add 10 locations
- [ ] Google "coworking [your city]" - add 10 local spaces
- [ ] Save CSV
- [ ] Run: `npm run import:workspaces data/workspaces-sample.csv`
- [ ] Verify in `/directory` - should see 50+ spaces

**Tip**: Don't need perfect data, just real names and cities

### ☐ Day 2: Make Directory Real (4-6 hours)

Files to update:
- [ ] `app/directory/page.tsx` - Replace Faker with Prisma
- [ ] `app/spaces/[id]/page.tsx` - Fetch from database
- [ ] `components/space-card.tsx` - Use real data

**Goal**: Directory shows your imported spaces, search works

### ☐ Day 3: Add Lead Capture (4-6 hours)

- [ ] Add `TalentLead` model to `prisma/schema.prisma`
- [ ] Run: `npx prisma migrate dev --name add-talent-leads`
- [ ] Create: `app/api/talent-leads/route.ts`
- [ ] Add "Request Talent" button to space detail pages
- [ ] Create lead form component
- [ ] Test: Submit form, check database

**Goal**: Can capture leads from workspace pages

### ☐ Day 4: Build Lead Dashboard (4-6 hours)

- [ ] Create: `app/admin/talent-leads/page.tsx`
- [ ] Show table of all leads
- [ ] Add filters (date, status, location)
- [ ] Show metrics (total leads, by city, by role)
- [ ] Add export to CSV button

**Goal**: Visual dashboard showing the pipeline

### ☐ Day 5: Polish & Practice (2-4 hours)

- [ ] Add 10 more high-profile spaces (Google HQ, Meta, etc.)
- [ ] Test entire flow: search → detail → request talent → see in admin
- [ ] Take screenshots for pitch deck
- [ ] Practice demo walkthrough (time yourself - aim for 10 min)
- [ ] Write down answers to FAQ

**Goal**: Confident, smooth demo

## Demo Day Checklist

### Before Meeting

- [ ] Laptop charged
- [ ] Internet connection confirmed (have hotspot backup)
- [ ] Database has 50+ spaces
- [ ] Have 5-10 sample leads in dashboard
- [ ] Screenshots ready (in case of tech issues)
- [ ] Pitch deck ready
- [ ] Know your numbers (ask, valuation, timeline)

### Opening (2 min)

"Hi [Name], thanks for meeting. I know your time is valuable, so I'll be quick.

We're building Workscape Atlas - a coworking directory that generates qualified executive recruitment leads. Let me show you..."

### Demo Flow (10 min)

**Screen 1**: Homepage
- "Global directory of coworking spaces"
- "Currently 50+ spaces, scaling to 1,000+"

**Screen 2**: Directory
- Search for "New York" → Show results
- "All real data - WeWork, Regus, Industrious"
- "Filters work - try 'Meeting Rooms'"

**Screen 3**: Space Detail
- Click a space
- "Full details, contact info, pricing"
- "And here's the key..." → Point to "Request Talent" button

**Screen 4**: Lead Form
- Click "Request Talent"
- "When spaces need leadership, they submit here"
- "Name, role, urgency, budget"

**Screen 5**: Admin Dashboard
- "This is YOUR sales pipeline"
- "15 leads this week"
- "See who's looking, where, what roles"
- "Export to CSV, integrate with your CRM"

### The Ask (3 min)

"Here's the opportunity:

**Problem**: Coworking spaces struggle to find experienced leadership. You spend time on cold outreach.

**Solution**: We attract spaces organically through SEO and content. They opt-in to talent matching. You get warm, qualified leads.

**Traction**: 50 spaces in database, lead capture working, admin dashboard live.

**Ask**: $[X] seed investment for:
- Data team to scale to 1,000 spaces
- Dev resources for digital scoring feature
- Marketing to drive traffic

**Your ROI**: Exclusive recruitment partner. If we drive 100 leads/month at 10% close rate = 10 placements = $[XXX,XXX] revenue annually.

**Equity**: [Y]% for $[X] + exclusive partnership agreement.

What questions can I answer?"

### Questions You'll Get

**Q: "How many spaces?"**
A: "50 now, 200 in 30 days, 1,000 in 6 months"

**Q: "How do you get traffic?"**
A: "SEO (we'll rank for 'coworking [city]'), content marketing, partnerships"

**Q: "Revenue model?"**
A: "Premium listings ($99-299/mo) + referral fees from placements (10-20%)"

**Q: "Why you vs LinkedIn?"**
A: "Specialized platform, better matching, we know coworking industry"

**Q: "What if I say yes?"**
A: "Draft terms this week, close in 2 weeks, hire team immediately, launch beta in 60 days"

### Closing

"I'll send over the deck and financial projections tonight. Can we schedule a follow-up for next week to discuss terms?"

## If You Get a Yes

**Week 1**:
- [ ] Send formal pitch deck
- [ ] Share financial projections
- [ ] Draft partnership agreement
- [ ] Share product roadmap

**Week 2**:
- [ ] Negotiate terms
- [ ] Sign agreements
- [ ] Set up company entity (if not done)
- [ ] Open business bank account

**Week 3-4**:
- [ ] Hire data entry team
- [ ] Scale to 200 spaces
- [ ] Build digital scoring feature
- [ ] Plan marketing strategy

**Month 2**:
- [ ] Launch beta
- [ ] Drive first traffic
- [ ] Generate first real leads
- [ ] Deliver to Bottle Rocket

## If You Get a Maybe

"What would you need to see to move forward?"

Common answers:
- More spaces → "I can have 200 by next week"
- More features → "What's most important to you?"
- Proof of traffic → "Let's do a 30-day pilot"

**Follow-up email**:
"Thanks for your time today. As discussed, I'll [action item]. Let's reconnect on [date]."

## If You Get a No

"I appreciate your honesty. Can I ask - what would need to change for this to be a yes?"

**Learn and pivot**:
- If it's the model → Reconsider approach
- If it's timing → "Can we revisit in 3 months?"
- If it's fit → Ask for intro to other potential partners

## Emergency Backup Plans

**Tech fails during demo**:
- [ ] Have screenshots ready
- [ ] Can walk through on phone if needed
- [ ] Offer to reschedule if necessary

**Forgot your numbers**:
- [ ] Keep cheat sheet in pocket
- [ ] Have deck on phone as backup

**He brings partner/CFO**:
- [ ] Stay calm, more people = good sign
- [ ] Address their specific concerns
- [ ] Financial person = focus on numbers

## Post-Demo

**Same Day**:
- [ ] Send thank you email
- [ ] Include pitch deck
- [ ] Include demo recording if you made one
- [ ] Propose next steps

**Day 2-3**:
- [ ] Follow up if no response
- [ ] Share any additional info requested

**Week 2**:
- [ ] Check in: "Any questions I can answer?"

## Resources

- Full guide: `docs/BOTTLE_ROCKET_DEMO.md`
- Data import: `scripts/README.md`
- Technical docs: `docs/DEPLOYMENT_GUIDE.md`

## Final Tips

✅ **Practice your demo 3x before the meeting**
✅ **Know your numbers cold (ask, equity, projections)**
✅ **Have real conviction - believe in the opportunity**
✅ **Listen more than you talk**
✅ **Ask for the money clearly**

**You got this!** 🚀

---

**Ready to start?**
```bash
npm install csv-parse csv-stringify --legacy-peer-deps
npm run scrape:sample
npm run import:workspaces data/workspaces-sample.csv
npm run dev
```

Then visit http://localhost:3005/directory and verify it works!
