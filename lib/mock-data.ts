import { faker } from '@faker-js/faker';

export interface WorkspaceData {
  id: number;
  name: string;
  location: {
    city: string;
    country: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  description: string;
  amenities: string[];
  pricing: {
    hourly?: number;
    daily?: number;
    monthly?: number;
    currency: string;
  };
  images: string[];
  rating: number;
  reviewCount: number;
  digitalScore: number;
  featured: boolean;
  verified: boolean;
  openingHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
  socialMedia: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
}

// List of realistic coworking amenities
const AMENITIES = [
  "High-Speed WiFi",
  "24/7 Access",
  "Meeting Rooms",
  "Coffee Bar",
  "Kitchen",
  "Printing Services",
  "Phone Booths",
  "Outdoor Space",
  "Bike Storage",
  "Showers",
  "Event Space",
  "Quiet Zones",
  "Lounge Area",
  "Standing Desks",
  "Ergonomic Chairs",
  "Mail Handling",
  "Parking",
  "Childcare",
  "Gym Access",
  "Podcast Studio",
  "Nap Room",
  "Wellness Room",
  "Game Room"
];

// List of popular coworking space cities
const CITIES = [
  { city: "New York", country: "USA" },
  { city: "London", country: "UK" },
  { city: "Berlin", country: "Germany" },
  { city: "Singapore", country: "Singapore" },
  { city: "Tokyo", country: "Japan" },
  { city: "Paris", country: "France" },
  { city: "Amsterdam", country: "Netherlands" },
  { city: "Barcelona", country: "Spain" },
  { city: "Sydney", country: "Australia" },
  { city: "Toronto", country: "Canada" },
  { city: "Stockholm", country: "Sweden" },
  { city: "Austin", country: "USA" },
  { city: "Lisbon", country: "Portugal" },
  { city: "Mexico City", country: "Mexico" },
  { city: "Seoul", country: "South Korea" }
];

// List of coworking space name patterns
const WORKSPACE_NAME_PATTERNS = [
  "The [Adjective] [Noun]",
  "[Noun] [Noun]",
  "[Adjective] [Noun]",
  "[Noun] House",
  "[Noun] Works",
  "[Noun] Space",
  "The [Noun] Collective",
  "[Noun] Hub",
  "[City] Works",
  "Co[Noun]",
  "[Noun] Studio",
  "[Noun] Labs",
  "[Adjective] Office",
  "The [Noun] Office",
  "[Noun] & [Noun]"
];

// Generate a workspace name
function generateWorkspaceName(): string {
  const pattern = WORKSPACE_NAME_PATTERNS[Math.floor(Math.random() * WORKSPACE_NAME_PATTERNS.length)];
  
  return pattern
    .replace('[Adjective]', faker.word.adjective({ length: { min: 4, max: 7 } }))
    .replace('[Noun]', faker.word.noun({ length: { min: 4, max: 8 } }))
    .replace('[Noun]', faker.word.noun({ length: { min: 4, max: 8 } }))
    .replace('[City]', faker.location.city());
}

// Generate a single workspace
export function generateWorkspace(id: number): WorkspaceData {
  const location = CITIES[Math.floor(Math.random() * CITIES.length)];
  const amenityCount = 4 + Math.floor(Math.random() * 8); // 4-12 amenities
  const selectedAmenities = [...AMENITIES]
    .sort(() => 0.5 - Math.random())
    .slice(0, amenityCount);
  
  const hasHourly = Math.random() > 0.3;
  const hasDaily = Math.random() > 0.2;
  const hasMonthly = true;
  
  const digitalScore = Math.floor(65 + Math.random() * 35); // 65-100
  const rating = 3.5 + Math.random() * 1.5; // 3.5-5.0
  
  return {
    id,
    name: generateWorkspaceName(),
    location: {
      city: location.city,
      country: location.country,
      address: faker.location.streetAddress({ useFullAddress: true }),
      coordinates: {
        lat: parseFloat(faker.location.latitude()),
        lng: parseFloat(faker.location.longitude())
      }
    },
    description: faker.lorem.paragraph(3),
    amenities: selectedAmenities,
    pricing: {
      ...(hasHourly ? { hourly: 5 + Math.floor(Math.random() * 20) } : {}), // $5-25/hr
      ...(hasDaily ? { daily: 20 + Math.floor(Math.random() * 60) } : {}), // $20-80/day
      monthly: 150 + Math.floor(Math.random() * 450), // $150-600/month
      currency: "USD"
    },
    images: Array(4).fill(0).map((_, index) => 
      `/modern-coworking-hub.png?height=300&width=500&query=coworking space interior ${id}-${index}`
    ),
    rating,
    reviewCount: 5 + Math.floor(Math.random() * 195), // 5-200 reviews
    digitalScore,
    featured: Math.random() > 0.8, // 20% chance of being featured
    verified: Math.random() > 0.4, // 60% chance of being verified
    openingHours: {
      monday: "8:00 AM - 6:00 PM",
      tuesday: "8:00 AM - 6:00 PM",
      wednesday: "8:00 AM - 6:00 PM",
      thursday: "8:00 AM - 6:00 PM",
      friday: "8:00 AM - 6:00 PM",
      saturday: Math.random() > 0.5 ? "10:00 AM - 4:00 PM" : "Closed",
      sunday: Math.random() > 0.2 ? "Closed" : "10:00 AM - 4:00 PM"
    },
    contactInfo: {
      phone: faker.phone.number(),
      email: faker.internet.email(),
      website: faker.internet.url()
    },
    socialMedia: {
      twitter: Math.random() > 0.3 ? `https://twitter.com/${faker.internet.userName()}` : undefined,
      facebook: Math.random() > 0.3 ? `https://facebook.com/${faker.internet.userName()}` : undefined,
      instagram: Math.random() > 0.3 ? `https://instagram.com/${faker.internet.userName()}` : undefined,
      linkedin: Math.random() > 0.5 ? `https://linkedin.com/company/${faker.company.name().toLowerCase().replace(/\s+/g, '-')}` : undefined
    }
  };
}

// Generate multiple workspaces
export function generateWorkspaces(count: number): WorkspaceData[] {
  return Array(count).fill(0).map((_, index) => generateWorkspace(index + 1));
}

// Get a fixed set of workspaces (for consistent data between page loads)
const WORKSPACE_CACHE: Record<number, WorkspaceData> = {};

export function getWorkspace(id: number): WorkspaceData {
  if (!WORKSPACE_CACHE[id]) {
    WORKSPACE_CACHE[id] = generateWorkspace(id);
  }
  return WORKSPACE_CACHE[id];
}

export function getWorkspaces(count: number): WorkspaceData[] {
  return Array(count).fill(0).map((_, index) => getWorkspace(index + 1));
}
