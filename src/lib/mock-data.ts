import type { BaseEvent, EventFilter } from '@features/events/types/event.type';

export const mockEvents: BaseEvent[] = [
  {
    id: 'event-001',
    slug: '10k-valencia-marathon',
    name: '10K Valencia Marathon',
    description: `
      <p>Valencia is known worldwide as the City of Running. The 10K Valencia Marathon offers an exceptionally flat course designed for performance, winding through the historic center and finishing at the iconic City of Arts and Sciences.</p>
      <p>Join 30,000 runners from across the globe in a high-octane celebration of speed, endurance, and Mediterranean spirit. Our precision-timed event ensures your personal best is recorded with elite-level accuracy.</p>
    `,
    shortDescription: "Valencia is known worldwide as the City of Running. The 10K Valencia Marathon offers an exceptionally flat course designed for performance.",
    date: '2024-12-01T08:00:00Z',
    location: {
      state: 'Valencia',
      municipality: 'Edirt',
      address: 'Ciudad de las Artes y las Ciencias, Valencia, Spain',
      coordinates: {
        lat: 39.454,
        lng: -0.3503,
      },
    },
    organizer: {
      id: 'org-001',
      name: 'Valencia Running Association',
      logo: '/organizers/valencia-running-logo.png',
    },
    distances: [
      {
        id: 'dist-5k',
        name: '5K Sprint',
        distanceKm: 5,
        priceModifier: -2000,
        availableSlots: 5000,
        registered: 3200,
      },
      {
        id: 'dist-10k',
        name: '10K Classic',
        distanceKm: 10,
        priceModifier: 0,
        availableSlots: 20000,
        registered: 15000,
      },
      {
        id: 'dist-42k',
        name: 'Full Marathon',
        distanceKm: 42.195,
        priceModifier: 4000,
        availableSlots: 5000,
        registered: 3800,
      },
    ],
    pricing: {
      basePrice: 4500,
      currency: 'EUR',
      earlyBirdDiscount: 10,
      earlyBirdDeadline: '2024-10-01T23:59:59Z',
    },
    images: {
      hero: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkbDag8tf8bPkhAlsM1TKR17llHBVSnRFRIUzw_RYhu34WTOG11Sxjl1dXDL4o45KanfiyM0OkMLCA-Bjobsj5tfktHYh9kXGZQFjINTzukdhvC8cN2kjhUmkIoJp5jwYQ_KhtxTwiNBCrcyzfuxkrAObT36TLgGopof98bY_D0dpOUVmp9Ktlp9B-W0-4kyLF5cUh7gLAzy0DlDxelH8N0gk8BtaN5qC59OqapEf_BJWICnWzfc9bFmSPbgZlL9aAGQF2YUnf1PEQ',
      gallery: [
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDaA1hSQMsAF49rWNF6s2s9aSzl_rP-jF9jEgEjBQSmIQT8bztl0Exe7MVPebsvKJh8e8dOSqjYHprRGXCfaIJ4RmzdhXUFoJJ_WqPo15xuMuB3-Wc2K-B3NnnxkfRMY9U29xbzvQ9jicVVyfEh5uU6-xMZeU7Ue2GB-QIadjj77enMVQ1kmglIoL-fWti35PN_6nsAcwobAQWmPL4H86--mI3pzodScF2-c_sH4ZLUwcCWaJBKCl9aK6KlyOdeMkLeeLsjxkyl_d1F',
      ],
    },
    capacity: 30000,
    registered: 22000,
    status: 'upcoming',
    featured: true,
    tags: ['10k', 'valencia', 'spain', 'road-running', 'flat'],
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-09-20T15:30:00Z',
  },
  {
    id: 'event-002',
    slug: 'neon-dash-10k',
    name: 'THE NEON DASH',
    description: `
      <p>Experience the pulse of the city under the neon lights. A technical night race designed for personal bests through the vibrant downtown metro area.</p>
    `,
    shortDescription: 'Experience the pulse of the city under the neon lights. A technical night race designed for personal bests.',
    date: '2024-10-24T20:00:00Z',
    location: {
      state: 'Downtown Metro',
      municipality: 'Deou',
      address: '123 Main Street, Downtown',
    },
    organizer: {
      id: 'org-002',
      name: 'Night Running Club',
      logo: '/organizers/night-running-logo.png',
    },
    distances: [
      {
        id: 'dist-10k',
        name: '10K Night',
        distanceKm: 10,
        priceModifier: 0,
        availableSlots: 1500,
        registered: 1100,
      },
    ],
    pricing: {
      basePrice: 4500,
      currency: 'USD',
    },
    images: {
      hero: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCYH6DOVlBJWUsvAF_JqMgQtVr0HHqMQ4_IlH-1FctEtOufriE934psPoSEIiV0Kyhw8pMkz8FrJ9hHaQvx_D6Y5Xj-_oDjFWftat07SB11uazBDUqm7fmesC_xPs_pGrEZikGjV-d3sN7_zfGNojqYRKvy3lFlF13u1JaEQdcltDFLg9KlA5OZ8uGu7YUVfhKn5RwUvDGo7MJQifEs57r67n3k33958_OOnixURtzIKQMzZ6uh4o1qc2oBx_FQbFgXqI1BhTZyDg42',
    },
    capacity: 1500,
    registered: 1100,
    status: 'upcoming',
    featured: false,
    tags: ['10k', 'night', 'urban', 'neon'],
    createdAt: '2024-08-01T10:00:00Z',
    updatedAt: '2024-09-20T15:30:00Z',
  },
  {
    id: 'event-003',
    slug: 'coastal-elite-half',
    name: 'COASTAL ELITE',
    description: `
      <p>Scenic coastal road with blue ocean in background, early morning light, long shadow, high dynamic range. A half marathon along the Pacific Highway.</p>
    `,
    shortDescription: 'Scenic coastal road with blue ocean in background. A half marathon along the Pacific Highway.',
    date: '2024-11-12T06:30:00Z',
    location: {
      state: 'Pacific Highway',
      municipality: 'Ytrew',
      address: 'Pacific Coast Highway, CA',
    },
    organizer: {
      id: 'org-003',
      name: 'Coastal Running Events',
      logo: '/organizers/coastal-events-logo.png',
    },
    distances: [
      {
        id: 'dist-half',
        name: 'Half Marathon',
        distanceKm: 21.0975,
        priceModifier: 0,
        availableSlots: 3000,
        registered: 2145,
      },
    ],
    pricing: {
      basePrice: 8500,
      currency: 'USD',
    },
    images: {
      hero: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEbZPD8jxE8g4VM3hGjjxWZtsnv7xO1TCJZTsFJHTWqrD3LM6eFlDR8HcEOh7KBnLGnw3j6WWAR066DmaHqrnf0UezzMjtp0pwLCcseADpF0x79noMcVIQpC49zMoPUrjIjsl_P89RbvZP1B5-f85J2CqolWTzQVl-Fgb4o5FGcYRwY2lVStACslnbDYUULbr1S1XCvdKxX5XJn_vNFQxOX8wAZHhlZuOa2I73gyjarpLO0-aabjK4sGwd4AR9Fvvahgge8fxEYBIz',
    },
    capacity: 3000,
    registered: 2145,
    status: 'upcoming',
    featured: true,
    tags: ['half-marathon', 'coastal', 'scenic', 'ocean'],
    createdAt: '2024-07-15T10:00:00Z',
    updatedAt: '2024-09-20T15:30:00Z',
  },
  {
    id: 'event-004',
    slug: 'summit-peak-trail',
    name: 'SUMMIT PEAK',
    description: `
      <p>Rugged mountain trail at sunset, athletic runner in distance, silhouette against orange sky, sharp peaks. A 25K trail running experience.</p>
    `,
    shortDescription: 'Rugged mountain trail at sunset. A 25K trail running experience.',
    date: '2024-12-05T05:00:00Z',
    location: {
      state: 'Alpine Ridge',
      municipality: 'Juvid',
      address: 'Alpine Ridge Trail, CO',
    },
    organizer: {
      id: 'org-004',
      name: 'Trail Running Association',
      logo: '/organizers/trail-association-logo.png',
    },
    distances: [
      {
        id: 'dist-25k',
        name: 'Trail 25K',
        distanceKm: 25,
        priceModifier: 0,
        availableSlots: 800,
        registered: 650,
      },
    ],
    pricing: {
      basePrice: 6000,
      currency: 'USD',
    },
    images: {
      hero: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2qbDqeknWxsvvp_BJb5k4jzxOxnYjA0IhClvzMEcKYDSKyPHVR3G5es_vIALUERCkr2PCcrfQdhTAl_gTXve9vqZlQwNjCEdVHX1DYAMII9B1nydgNZ1Vfy4YTd2KVFBy_LI57nUvTUYnOwmC80iltHoTiG8h1Jfubz7z0A0XiiRu2a0bVNVrafntLb-zpbEGeLPM2sny-jG5j39S3x5SUhndIrI6e_GejNKkvoNCBGnNfYWBg5SFDlywDLHjv93z8xY7K1RXxHem',
    },
    capacity: 800,
    registered: 650,
    status: 'upcoming',
    featured: false,
    tags: ['trail', 'mountain', '25k', 'adventure'],
    createdAt: '2024-06-20T10:00:00Z',
    updatedAt: '2024-09-20T15:30:00Z',
  },
  {
    id: 'event-005',
    slug: 'skyline-sprint-5k',
    name: 'SKYLINE SPRINT',
    description: `
      <p>Modern urban skyline reflected in puddles on race track, architectural focus, cool blue tones, athletic precision. A fast 5K through Central Plaza.</p>
    `,
    shortDescription: 'Modern urban skyline. A fast 5K through Central Plaza.',
    date: '2024-12-18T18:30:00Z',
    location: {
      state: 'Central Plaza',
      municipality: 'Serieb',
      address: 'Central Plaza, Downtown',
    },
    organizer: {
      id: 'org-005',
      name: 'Urban Sprint Series',
      logo: '/organizers/urban-sprint-logo.png',
    },
    distances: [
      {
        id: 'dist-5k',
        name: '5K Sprint',
        distanceKm: 5,
        priceModifier: 0,
        availableSlots: 2000,
        registered: 1750,
      },
    ],
    pricing: {
      basePrice: 3500,
      currency: 'USD',
    },
    images: {
      hero: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCN1AZn_NKIKlQhuQiMCY9UFScUpSUj73gahKXUz7iQ4l0U198yzX8B7r8uBqQxqVKcabm3wf_Kz4Yq-I_FxiskgrsWJSGDtZTbsgmt_woCZH3VDJBfn9IwI_C3N3OGRx9NrFzT673twzz2F9o2ksMikuD93nfE6MRhhUUp0hMkfMJGuke5IufAy9gIsFdITMGroI26PV3jzWXo0w3mQBKaB2lPCXtA6TObN35R6r5S5GTN62mE0cewgtVh7ZkOQiKIXCSHqCELEAVC',
    },
    capacity: 2000,
    registered: 1750,
    status: 'upcoming',
    featured: false,
    tags: ['5k', 'urban', 'sunset', 'fast'],
    createdAt: '2024-08-10T10:00:00Z',
    updatedAt: '2024-09-20T15:30:00Z',
  },
];

export function getEventBySlug(slug: string): BaseEvent | undefined {
  return mockEvents.find((event) => event.slug === slug);
}

export function getEventById(id: string): BaseEvent | undefined {
  return mockEvents.find((event) => event.id === id);
}

export function getFeaturedEvents(): BaseEvent[] {
  return mockEvents.filter((event) => event.featured && event.status === 'upcoming');
}

export function getUpcomingEvents(): BaseEvent[] {
  return mockEvents.filter((event) => event.status === 'upcoming');
}

export function getPriceForDistance(event: BaseEvent, distanceId: string): number {
  const distance = event.distances.find((d) => d.id === distanceId);
  if (!distance) return event.pricing.basePrice;
  
  const basePrice = event.pricing.basePrice;
  const modifier = distance.priceModifier;
  
  return Math.max(0, basePrice + modifier);
}

export function formatPrice(price: number, currency: string = 'EUR'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(price / 100);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getAvailableSlots(event: BaseEvent, distanceId: string): number | undefined {
  const distance = event.distances.find((d) => d.id === distanceId);
  if (!distance || !distance.availableSlots) return undefined;
  
  return distance.availableSlots - (distance.registered || 0);
}