import { defineAction, ActionError } from 'astro:actions';
import { api } from '@lib/api';
import type { BaseEvent, EventDistance } from '@features/events/types/event.type';

// ── Backend response types ────────────────────────────────────

interface BackendEvent {
  id: string;
  organizer_id: string;
  name: string;
  slug: string;
  description: string;
  event_date: string;
  deadline: string;
  state: string;
  municipality: string;
  address: string;
  logo_url?: string;
  status: string;
  itinerary?: { key: string; value: string; icon: string }[];
  created_at: string;
  updated_at: string;
}

interface BackendDistance {
  id: string;
  km: number;
  capacity: number;
  surface: string;
}

interface BackendPricingStage {
  id: string;
  distance_id: string;
  name: string;
  price: number;
  start_date: string;
  end_date: string;
  is_early_bird: boolean;
}

interface BackendOrganizer {
  id: string;
  business_name: string;
  brand_name?: string;
  contact_email: string;
  logo_url?: string;
}

interface EventDetailResponse {
  message: string;
  data: BackendEvent;
  distances: BackendDistance[];
  pricing_stages: BackendPricingStage[];
}

interface EventsListResponse {
  message: string;
  data: BackendEvent[];
  total: number;
}

// ── Mappers ───────────────────────────────────────────────────

/**
 * Encuentra el precio base para una distancia usando su pricing stage activo
 * (el que tiene la fecha de fin más reciente antes de la fecha del evento).
 */
function resolveDistancePrice(distanceId: string, stages: BackendPricingStage[]): number {
  const distanceStages = stages
    .filter((s) => s.distance_id === distanceId)
    .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
  return distanceStages.length > 0 ? distanceStages[0].price : 0;
}

/**
 * Mapea un evento del backend a BaseEvent, usando detail + organizer.
 */
function mapToBaseEvent(
  evt: BackendEvent,
  distances: BackendDistance[],
  pricingStages: BackendPricingStage[],
  organizer: BackendOrganizer,
): BaseEvent {
  const eventDistances: EventDistance[] = distances.map((d) => ({
    id: d.id,
    distanceKm: d.km,
    name: `${d.km}K`,
    capacity: d.capacity,
    priceModifier: 0, // cada distancia tiene su propio pricing stage, no hay modifier sobre base
  }));

  const basePrice =
    eventDistances.length > 0
      ? resolveDistancePrice(eventDistances[0].id, pricingStages)
      : 0;

  return {
    id: evt.id,
    slug: evt.slug,
    name: evt.name,
    description: evt.description,
    shortDescription: evt.description.replace(/<[^>]*>/g, '').slice(0, 120) + '...',
    date: evt.event_date,
    location: {
      state: evt.state,
      municipality: evt.municipality,
      address: evt.address,
    },
    organizer: {
      id: organizer.id,
      name: organizer.brand_name || organizer.business_name,
      logo: organizer.logo_url,
    },
    images: {
      hero: evt.logo_url || organizer.logo_url || '',
    },
    distances: eventDistances,
    pricing: {
      basePrice,
      currency: 'MXN',
      earlyBirdDeadline: evt.deadline,
    },
    status: evt.status as BaseEvent['status'],
    featured: false,
    tags: [],
    registered: 0,
    createdAt: evt.created_at,
    updatedAt: evt.updated_at,
  };
}

// ── Action ────────────────────────────────────────────────────

export const home = {
  getEvents: defineAction({
    accept: 'json',
    handler: async () => {
      // 1. Listar eventos
      const listRes = await api.get<EventsListResponse>(`/events`);
      if (listRes.error) throw new ActionError({ code: 'BAD_REQUEST', message: listRes.error });

      const events = listRes.data?.data || [];
      if (events.length === 0) return [];

      // 2. Para cada evento, traer detail + organizer en paralelo
      const mapped = await Promise.all(
        events.map(async (evt) => {
          const [detailRes, orgRes] = await Promise.all([
            api.get<EventDetailResponse>(`/events/${evt.id}/detail`),
            api.get<{ message: string; data: BackendOrganizer }>(`/organizers/${evt.organizer_id}`),
          ]);

          return mapToBaseEvent(
            evt,
            detailRes.data?.distances || [],
            detailRes.data?.pricing_stages || [],
            orgRes.data?.data || {
              id: evt.organizer_id,
              business_name: 'Unknown Organizer',
              contact_email: '',
            },
          );
        }),
      );

      return mapped;
    },
  }),
};
