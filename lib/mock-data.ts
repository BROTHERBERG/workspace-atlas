import { faker } from '@faker-js/faker';

// Globe workspace location interface
export interface WorkspaceLocation {
  id: string;
  name: string;
  location: [number, number]; // latitude, longitude
  size: number;
  spaces: number;
  description: string;
}

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
        lat: Number(faker.location.latitude()),
        lng: Number(faker.location.longitude())
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
      twitter: Math.random() > 0.3 ? `https://twitter.com/${faker.internet.username()}` : undefined,
      facebook: Math.random() > 0.3 ? `https://facebook.com/${faker.internet.username()}` : undefined,
      instagram: Math.random() > 0.3 ? `https://instagram.com/${faker.internet.username()}` : undefined,
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

// Globe workspace locations data
export const WORKSPACE_LOCATIONS: WorkspaceLocation[] = [
  {
    id: "nyc",
    name: "New York",
    location: [40.7128, -74.006],
    size: 0.1,
    spaces: 247,
    description: "The largest hub for tech startups and creative agencies in the US.",
  },
  {
    id: "la",
    name: "Los Angeles",
    location: [34.0522, -118.2437],
    size: 0.1,
    spaces: 183,
    description: "Home to entertainment industry professionals and digital creators.",
  },
  {
    id: "london",
    name: "London",
    location: [51.5074, -0.1278],
    size: 0.1,
    spaces: 312,
    description: "Europe's financial center with a thriving tech ecosystem.",
  },
  {
    id: "paris",
    name: "Paris",
    location: [48.8566, 2.3522],
    size: 0.1,
    spaces: 156,
    description: "A blend of historic charm and modern innovation spaces.",
  },
  {
    id: "berlin",
    name: "Berlin",
    location: [52.52, 13.405],
    size: 0.08,
    spaces: 128,
    description: "Known for affordable spaces and a vibrant startup culture.",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    location: [35.6762, 139.6503],
    size: 0.09,
    spaces: 201,
    description: "High-tech facilities catering to both local and international businesses.",
  },
  {
    id: "singapore",
    name: "Singapore",
    location: [1.3521, 103.8198],
    size: 0.07,
    spaces: 94,
    description: "A gateway to Asian markets with world-class infrastructure.",
  },
  {
    id: "sydney",
    name: "Sydney",
    location: [-33.8688, 151.2093],
    size: 0.08,
    spaces: 87,
    description: "Beachside workspaces with strong connections to Asian markets.",
  },
  {
    id: "mexico-city",
    name: "Mexico City",
    location: [19.4326, -99.1332],
    size: 0.08,
    spaces: 76,
    description: "Emerging as a major hub for Latin American entrepreneurs.",
  },
  {
    id: "sao-paulo",
    name: "São Paulo",
    location: [-23.5505, -46.6333],
    size: 0.09,
    spaces: 112,
    description: "Brazil's economic center with a growing tech presence.",
  },
  {
    id: "moscow",
    name: "Moscow",
    location: [55.7558, 37.6173],
    size: 0.08,
    spaces: 68,
    description: "Modern facilities in one of the world's largest urban economies.",
  },
  {
    id: "dubai",
    name: "Dubai",
    location: [25.2048, 55.2708],
    size: 0.07,
    spaces: 103,
    description: "Luxury workspaces in a global business and travel hub.",
  },
];

// Testimonials data
export interface Testimonial {
  id: number;
  name: string;
  role: string;
  image: string;
  rating: number;
  content: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Coworking Space Owner",
    image: "/confident-professional.png",
    rating: 5,
    content: "Workspace Atlas helped us increase our visibility and attract the right members. The digital score was eye-opening.",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Remote Worker",
    image: "/confident-businessman.png",
    rating: 5,
    content: "Finding a reliable coworking space used to be a gamble. With Workspace Atlas, I know exactly what I'm getting.",
  },
  {
    id: 3,
    name: "Aisha Patel",
    role: "Community Manager",
    image: "/confident-professional.png",
    rating: 5,
    content: "As a Community Manager, I found my dream job through Workspace Atlas. The platform connected me with a space that perfectly matched my skills.",
  },
];

// Partners data
export interface Partner {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  description: string;
}

export const PARTNERS: Partner[] = [
  {
    id: "bottle-rocket",
    name: "Bottle Rocket Search Group",
    icon: "Building",
    description: "Executive search and recruitment",
  },
  {
    id: "obelisq",
    name: "Obelisq",
    icon: "Zap",
    description: "Digital transformation consulting",
  },
];
