import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro/zod';
import { api } from '@lib/api';

/**
 * Server-side dashboard reads.
 *
 * There are no dashboard endpoints in the backend, so both actions aggregate
 * what the existing endpoints expose: `/events` (list), `/events/{id}/detail`
 * (distances/capacity) and `/registrations` (counts / per participant).
 */

type DashboardStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';

interface BackendEvent {
  id: string;
  organizer_id: string;
  name: string;
  slug: string;
  event_date: string;
  deadline: string;
  state: string;
  municipality: string;
  address: string;
  status: string;
}

interface BackendDistance {
  id: string;
  km: number;
  capacity: number;
}

interface BackendRegistration {
  id: string;
  event_id: string;
  distance_id?: string;
  status: string;
  bib_number?: string;
  registration_date?: string;
}

interface ListEnvelope<T> {
  message?: string;
  data: T[];
  total?: number;
}

export interface DashboardEventSummary {
  id: string;
  slug: string;
  name: string;
  date: string;
  location: string;
  status: DashboardStatus;
  registered: number;
  capacity: number;
}

export interface OrganizerOverview {
  stats: {
    totalEvents: number;
    activeEvents: number;
    totalRegistrations: number;
  };
  events: DashboardEventSummary[];
  recentEvents: DashboardEventSummary[];
  deadlines: { event: string; date: string; type: string }[];
  distanceDistribution: { label: string; count: number }[];
  empty: boolean;
}

export interface DashboardRegistrationSummary {
  id: string;
  eventId: string;
  eventName: string;
  eventSlug: string;
  eventDate: string;
  status: string;
  bibNumber: string;
  distanceId: string;
}

export interface ParticipantOverview {
  stats: {
    total: number;
    confirmed: number;
    pending: number;
  };
  registrations: DashboardRegistrationSummary[];
  upcoming: DashboardRegistrationSummary[];
  empty: boolean;
}

const KNOWN_STATUSES: DashboardStatus[] = [
  'draft',
  'published',
  'ongoing',
  'completed',
  'cancelled',
];

const normalizeStatus = (status: string): DashboardStatus =>
  KNOWN_STATUSES.includes(status as DashboardStatus) ? (status as DashboardStatus) : 'draft';

const toAuthHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });

const readUserCookie = (cookies: any): Record<string, any> | null => {
  const raw = cookies.get('user')?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

/** Registration counts per event id; a failing call counts as zero. */
async function countRegistrations(
  eventIds: string[],
  headers: Record<string, string>,
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  await Promise.all(
    eventIds.map(async (eventId) => {
      const response = await api.get<ListEnvelope<BackendRegistration>>(
        `/registrations?event_id=${eventId}`,
        { headers },
      );
      counts[eventId] = response.error ? 0 : (response.data?.data ?? []).length;
    }),
  );
  return counts;
}

/** Total capacity per event id from the distances of the detail payload. */
async function readCapacities(
  eventIds: string[],
  headers: Record<string, string>,
): Promise<Record<string, { capacity: number; distances: BackendDistance[] }>> {
  const result: Record<string, { capacity: number; distances: BackendDistance[] }> = {};
  await Promise.all(
    eventIds.map(async (eventId) => {
      const response = await api.get<{ data: BackendEvent; distances?: BackendDistance[] }>(
        `/events/${eventId}/detail`,
        { headers },
      );
      const distances = response.error ? [] : (response.data?.distances ?? []);
      result[eventId] = {
        capacity: distances.reduce((sum, distance) => sum + (distance.capacity || 0), 0),
        distances,
      };
    }),
  );
  return result;
}

const distanceLabel = (km: number): string => `${Math.round(km)}K`;

export const dashboard = {
  /**
   * Organizer overview: totals, event cards (with registration counts and
   * capacity), upcoming registration deadlines and distance distribution.
   */
  getOrganizerOverview: defineAction({
    accept: 'json',
    input: z.object({
      recentLimit: z.number().int().min(1).max(20).default(4),
    }),
    handler: async (input, { cookies }): Promise<OrganizerOverview> => {
      const token = cookies.get('access_token')?.value;
      const user = readUserCookie(cookies);
      const organizerId = user?.organizer_id;
      if (!token || !organizerId) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'No tienes permisos de organizador',
        });
      }
      const headers = toAuthHeaders(token);

      const listResponse = await api.get<ListEnvelope<BackendEvent>>('/events?limit=100', {
        headers,
      });
      if (listResponse.error) {
        throw new ActionError({ code: 'BAD_REQUEST', message: listResponse.error });
      }

      const events = (listResponse.data?.data ?? []).filter(
        (event) => event.organizer_id === organizerId,
      );

      if (events.length === 0) {
        return {
          stats: { totalEvents: 0, activeEvents: 0, totalRegistrations: 0 },
          events: [],
          recentEvents: [],
          deadlines: [],
          distanceDistribution: [],
          empty: true,
        };
      }

      const eventIds = events.map((event) => event.id);
      const [counts, capacityByEvent] = await Promise.all([
        countRegistrations(eventIds, headers),
        readCapacities(eventIds, headers),
      ]);

      const summaries: DashboardEventSummary[] = events.map((event) => ({
        id: event.id,
        slug: event.slug,
        name: event.name,
        date: event.event_date,
        location: [event.municipality, event.state].filter(Boolean).join(', '),
        status: normalizeStatus(event.status),
        registered: counts[event.id] ?? 0,
        capacity: capacityByEvent[event.id]?.capacity ?? 0,
      }));

      const now = Date.now();
      const deadlines = events
        .filter((event) => event.deadline && new Date(event.deadline).getTime() >= now)
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        .slice(0, 5)
        .map((event) => ({
          event: event.name,
          date: event.deadline,
          type: 'Cierre de inscripciones',
        }));

      const distribution = new Map<string, number>();
      for (const event of events) {
        for (const distance of capacityByEvent[event.id]?.distances ?? []) {
          const label = distanceLabel(distance.km);
          distribution.set(label, (distribution.get(label) ?? 0) + 1);
        }
      }
      const distanceDistribution = [...distribution.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

      return {
        stats: {
          totalEvents: summaries.length,
          activeEvents: summaries.filter((event) => event.status === 'published').length,
          totalRegistrations: summaries.reduce((sum, event) => sum + event.registered, 0),
        },
        events: summaries,
        recentEvents: [...summaries]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, input.recentLimit),
        deadlines,
        distanceDistribution,
        empty: false,
      };
    },
  }),

  /** Participant overview: registration list (with event names) and counters. */
  getParticipantOverview: defineAction({
    accept: 'json',
    input: z.object({}),
    handler: async (_input, { cookies }): Promise<ParticipantOverview> => {
      const token = cookies.get('access_token')?.value;
      const user = readUserCookie(cookies);
      const participantId = user?.participant_id;
      if (!token || !participantId) {
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'No hay un participante en la sesión',
        });
      }
      const headers = toAuthHeaders(token);

      const registrationsResponse = await api.get<ListEnvelope<BackendRegistration>>(
        `/registrations/participant/${participantId}`,
        { headers },
      );
      if (registrationsResponse.error) {
        throw new ActionError({ code: 'BAD_REQUEST', message: registrationsResponse.error });
      }

      const registrations = registrationsResponse.data?.data ?? [];

      const eventsById: Record<string, BackendEvent> = {};
      if (registrations.length > 0) {
        // Event names are not part of the registration payload; the list call is
        // the cheapest way to resolve them (failures degrade to empty names).
        const eventsResponse = await api.get<ListEnvelope<BackendEvent>>('/events?limit=100', {
          headers,
        });
        for (const event of eventsResponse.data?.data ?? []) {
          eventsById[event.id] = event;
        }
      }

      const summaries: DashboardRegistrationSummary[] = registrations.map((registration) => {
        const event = eventsById[registration.event_id];
        return {
          id: registration.id,
          eventId: registration.event_id,
          eventName: event?.name ?? '',
          eventSlug: event?.slug ?? '',
          eventDate: event?.event_date ?? '',
          status: registration.status,
          bibNumber: registration.bib_number ?? '',
          distanceId: registration.distance_id ?? '',
        };
      });

      const now = Date.now();
      return {
        stats: {
          total: summaries.length,
          confirmed: summaries.filter((item) => item.status === 'confirmed').length,
          pending: summaries.filter((item) => item.status === 'pending').length,
        },
        registrations: summaries,
        upcoming: summaries
          .filter((item) => item.eventDate && new Date(item.eventDate).getTime() >= now)
          .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()),
        empty: summaries.length === 0,
      };
    },
  }),
};
