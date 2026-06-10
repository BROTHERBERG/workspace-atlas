# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` - Starts Next.js development server
- **Build**: `npm run build` - Creates production build
- **Production server**: `npm start` - Starts production server
- **Linting**: `npm run lint` - Runs Next.js linting

## Architecture Overview

**Workspace Atlas** is a Next.js 15 application built as a global coworking directory that scores spaces, helps improve their digital presence, and connects them with talent.

### Technology Stack
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom design system
- **Components**: shadcn/ui components with custom styling
- **Icons**: Lucide React
- **3D Visualization**: COBE (3D globe component)
- **Mock Data**: Faker.js for development data

### Design System
- **Primary Color**: Yellow `#f9cb16` (also `#facc14` in some places)
- **Background**: Black `#1f1f1f` 
- **Typography**: Custom Cal Sans font (`font-cal`) for headings, Inter for body text
- **Button Styles**: Custom press/shadow effects with yellow accents
- **Visual Style**: Bold, brutalist design with thick borders and drop shadows

### Project Structure

```
app/                    # Next.js App Router pages
├── admin/             # Admin interface for space management
├── directory/         # Space directory/search page  
├── haven-passport/    # Passport feature page
├── recruitment/       # Talent/recruitment page
├── score-my-space/    # Space scoring feature
├── spaces/[id]/       # Individual space pages
├── layout.tsx         # Root layout with navbar/footer
└── page.tsx          # Homepage

components/            # Reusable React components
├── ui/               # shadcn/ui base components
├── globe.tsx         # Interactive 3D globe with workspace locations
├── featured-spaces.tsx # Featured workspace cards
├── navbar.tsx        # Navigation component
├── footer.tsx        # Footer component
└── ...

lib/
├── mock-data.ts      # Faker.js workspace data generation
└── utils.ts          # Utility functions

public/               # Static assets including workspace images
```

### Key Features

1. **Interactive Globe**: 3D globe showing global workspace locations with clickable markers
2. **Space Directory**: Search and browse coworking spaces with filtering
3. **Digital Scoring**: Proprietary scoring system for workspace digital presence
4. **Haven Passport**: Gamified workspace exploration system
5. **Admin Interface**: Backend for managing spaces and content
6. **Talent Matching**: Recruitment platform connecting spaces with leadership talent

### Data Architecture

- Uses `lib/mock-data.ts` with Faker.js to generate realistic workspace data
- `WorkspaceData` interface defines the complete workspace schema
- Caching system for consistent data across page loads
- Mock data includes pricing, amenities, ratings, digital scores, contact info

### Development Notes

- TypeScript errors temporarily ignored during builds (will be fixed in Phase 2)
- Images are optimized with Next.js image optimization enabled
- ESLint runs during builds with simplified configuration
- Uses Tailwind CSS with custom design system variables
- Custom font loading through Next.js font optimization
- Uses `--legacy-peer-deps` for npm install due to React 19 compatibility issues

### Component Patterns

- Components use shadcn/ui as base with heavy customization
- Consistent use of black borders, yellow accents, and drop shadows
- Button components have custom press animations
- Cards use layered border effects and rotated elements
- Mobile-responsive design throughout

### Testing and Quality

- No formal test setup currently configured
- Linting available via `npm run lint`
- TypeScript checking can be run manually but is ignored in builds