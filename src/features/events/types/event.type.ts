export type ItineraryItem = {
  key: string;
  time: string;
  icon: string;
};

export type BaseEvent = {
  id: string;
  capacity?: number;
  date: string;
  description: string;
  distances: EventDistance[];
  featured: boolean;
  images: {
    gallery?: string[];
    hero: string;
  };
  itinerary?: ItineraryItem[];
  location: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    municipality: string;
    state: string;
  };
  logo_url?: string;
  name: string;
  organizer: {
    id: string;
    logo?: string;
    name: string;
  };
  pricing: {
    basePrice: number;
    currency: string;
    earlyBirdDeadline?: string;
    earlyBirdDiscount?: number;
  };
  registered?: number;
  shortDescription: string;
  slug: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  tags: string[];
  runner_kits?: RunnerKitItem[];
  createdAt: string;
  updatedAt: string;
};

export type EventDistance = {
  id: string;
  availableSlots?: number;
  distanceKm: number;
  name: string;
  priceModifier: number;
  registered?: number;
};

/**
 * Distance as rendered on the event page: the base fields plus the display
 * extras that the event detail action maps from the backend (`km`,
 * `description`, `elevation`, `timeLimit`, `capacity`). Lists built from other
 * endpoints can leave the extras out.
 */
export type EventDistanceView = EventDistance & {
  km?: number;
  description?: string;
  elevation?: number | null;
  timeLimit?: string | null;
  capacity?: number;
};

export type EventRegistration = {
  eventId: string;
  additionalOptions?: {
    hasMedicalCondition?: boolean;
    medicalNotes?: string;
    needsAccommodation?: boolean;
    tShirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  };
  distanceId: string;
  participant: {
    country: string;
    dateOfBirth: string;
    email: string;
    emergencyContact: {
      name: string;
      phone: string;
    };
    firstName: string;
    gender: 'male' | 'female' | 'other';
    lastName: string;
    phone: string;
  };
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
};

export type EventFilter = {
  dateRange?: {
    end: string;
    start: string;
  };
  distance?: number;
  featured?: boolean;
  location?: string;
  status?: BaseEvent['status'];
  tags?: string[];
};

export type RunnerKitItem = {
  id: string;
  event_id: string;
  name: string;
  description: string;
  icon: string;
  created_at: string;
};

export type EventFieldConfig = {
  section_name: string;
  is_enabled: boolean;
  is_required: boolean;
};