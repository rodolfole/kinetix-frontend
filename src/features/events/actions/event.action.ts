import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro/zod';
import type { BaseEvent, EventDistance, EventFieldConfig, RunnerKitItem } from '@features/events/types/event.type';
import type { RouteData } from '@features/events/types/route.type';
import { api } from '@lib/api';

/** Backend event types (snake_case from API) */
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
  itinerary?: { key: string; time: string; icon: string }[];
  status: string;
  created_at: string;
  updated_at: string;
}

interface BackendDistance {
  id: string;
  km: number;
  capacity: number;
  surface: string;
  elevation?: number | null;
  time_limit?: string | null;
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

/** List endpoints wrap their payload as `{ message, data }`. */
interface BackendListEnvelope<T> {
  message?: string;
  data: T[];
}

interface BackendDistanceType {
  id: string;
  name: string;
  km: number;
}

interface BackendAgeCategory {
  id: string;
  name: string;
  min_age?: number;
  max_age?: number;
  display_order: number;
}

interface BackendEventDetail {
  message: string;
  data: BackendEvent;
  distances: BackendDistance[];
  tags: string[];
  pricing_stages: BackendPricingStage[];
  runner_kits: RunnerKitItem[];
}

// ── Helpers ───────────────────────────────────────────────────

/** Convierte fecha a RFC3339 UTC. Acepta "YYYY-MM-DD" o "YYYY-MM-DDTHH:MM". */
const toRFC3339 = (d: string): string => {
  if (!d) return '';
  // date-only → UTC midnight (per ECMAScript spec),
  // datetime-local → local time, .toISOString() convierte a UTC.
  return new Date(d).toISOString();
};

/** Crea sub-recursos en secuencia */
async function createSubResources(
  endpoint: string,
  items: Record<string, any> | undefined,
  buildPayload: (item: any) => any,
  headers: Record<string, string>,
  errorLabel: string
): Promise<void> {
  for (const item of Object.values(items || {})) {
    const payload = buildPayload(item);
    if (payload === null) continue;
    const res = await api.post(endpoint, payload, { headers });
    if (res.error) {
      throw new ActionError({ code: 'BAD_REQUEST', message: `${errorLabel}: ${res.error}` });
    }
  }
}

// ── Action exports ────────────────────────────────────────────

export const event = {
  create: defineAction({
    accept: 'json',
    input: z.any(),
    handler: async (input, { cookies }) => {
      // ── 0. Auth ──────────────────────────────────────────────────
      const accessToken = cookies.get('access_token')?.value;
      const userRaw = cookies.get('user')?.value;
      if (!userRaw) {
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'Usuario no autenticado' });
      }
      const organizerId = JSON.parse(userRaw)?.organizer_id;
      if (!organizerId) {
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'No tienes permisos de organizador' });
      }
      const headers = { Authorization: `Bearer ${accessToken}` };

      // ── 1. Crear evento ──────────────────────────────────────────
      const eventRes = await api.post('/events', {
        organizer_id: organizerId,
        name: input.name,
        slug: input.slug,
        description: input.description || '',
        event_date: toRFC3339(input.event_date),
        deadline: toRFC3339(input.deadline),
        state: input.state || '',
        municipality: input.municipality || '',
        address: input.address || 'Sin dirección',
        logo_url: input.logo_url || '',
        judges: input.judges || '',
        rules: input.rules || '',
        risks: input.risks || '',
        transit: input.transit || '',
        itinerary: input.itinerary || [],
      }, { headers });

      if (eventRes.error) {
        throw new ActionError({ code: 'BAD_REQUEST', message: eventRes.error });
      }
      const eventId = eventRes.data?.data?.id;
      if (!eventId) {
        throw new ActionError({ code: 'BAD_REQUEST', message: 'No se pudo obtener el ID del evento' });
      }

      // ── 2. Resolver tipos de distancia (fallback IDs → UUIDs reales) ──
      const distTypeMap: Record<string, string> = {};
      const typesRes = await api.get('/distances/types', { headers });
      if (!typesRes.error && typesRes.data?.data) {
        for (const dt of typesRes.data.data) {
          distTypeMap[dt.id] = dt.id;
          distTypeMap[dt.name] = dt.id;
          const fallbackId = `fallback-${dt.name.replace(/\s+/g, '').toLowerCase()}`;
          distTypeMap[fallbackId] = dt.id;
        }
      }
      const resolveDistTypeId = (id: string) => distTypeMap[id] || id;

      // ── 3. Distancias (construye map _tempId → uuid) ─────────
      const distanceMap = new Map<string, string>();
      for (const d of (input.distances || [])) {
        const dist = d as any;
        const res = await api.post('/distances', {
          event_id: eventId,
          distance_type_id: resolveDistTypeId(dist.distance_type_id),
          capacity: Number(dist.capacity) || 0,
          surface: dist.surface || 'asphalt',
        }, { headers });

        if (res.error) {
          throw new ActionError({ code: 'BAD_REQUEST', message: `Distancia: ${res.error}` });
        }
        const realId = res.data?.data?.id;
        if (realId) distanceMap.set(dist._tempId, realId);
      }

      const resolveDistId = (tempId: string) => distanceMap.get(tempId) || null;

      // ── 4. Pricing stages ───────────────────────────────────────
      await createSubResources(
        '/events/pricing',
        input.pricing_stages,
        (s: any) => {
          const realDistId = resolveDistId(s.distance_id);
          if (!realDistId) return null;
          return {
            distance_id: realDistId,
            name: s.name || '',
            price: Number(s.price) || 0,
            start_date: toRFC3339(s.start_date),
            end_date: toRFC3339(s.end_date),
            is_early_bird: s.is_early_bird === 'on' || s.is_early_bird === 'true' || s.is_early_bird === true,
          };
        },
        headers,
        'Pricing'
      );

      // ── 5. Awards ───────────────────────────────────────────────
      // Cada categoría puede tener N lugares (1°, 2°, 3°, …). El frontend
      // envía `prize_amounts` (array) y/o `prize_amount` (legacy single).
      // Generamos una fila de award por lugar con `place` 1-based.
      const awardItems: any[] = [];
      for (const c of (input.categories || [])) {
        const realDistId = resolveDistId((c as any).distance_id);
        if (!realDistId) continue;
        const amounts: number[] = Array.isArray((c as any).prize_amounts)
          ? (c as any).prize_amounts
          : [];
        if (amounts.length === 0) {
          // Fallback legacy: si sólo viene prize_amount (un único monto),
          // lo tratamos como 1er lugar.
          const legacy = Number((c as any).prize_amount) || 0;
          if (legacy > 0) amounts.push(legacy);
        }
        amounts.forEach((amt: any, idx: number) => {
          awardItems.push({
            distance_id: realDistId,
            age_category_id: (c as any).age_category_id || '',
            gender: (c as any).gender || 'general',
            place: idx + 1,
            prize_amount: Number(amt) || 0,
          });
        });
      }
      for (const payload of awardItems) {
        const res = await api.post('/events/awards', payload, { headers });
        if (res.error) {
          throw new ActionError({ code: 'BAD_REQUEST', message: `Award: ${res.error}` });
        }
      }

      // ── 6. Sponsors ─────────────────────────────────────────────
      await createSubResources(
        '/events/sponsors',
        input.sponsors,
        (s: any) => ({
          event_id: eventId,
          name: s.name || '',
          tier: s.tier || '',
          logo_url: s.logo_url || '',
        }),
        headers,
        'Sponsor'
      );

      // ── 7. Runner Kit Items ─────────────────────────────────────
      // CreateRunnerKitItemRequest solo acepta: event_id, name, icon (no
      // description). Si se manda un campo extra con DisallowUnknownFields()
      // el backend devuelve 400 "invalid request body: json: unknown field ...".
      await createSubResources(
        '/runner-kits',
        input.runner_kits,
        (k: any) => ({
          event_id: eventId,
          name: k.name || '',
          icon: k.icon || '',
        }),
        headers,
        'RunnerKit'
      );

      // ── 8. Locations ────────────────────────────────────────────
      await createSubResources(
        '/events/locations',
        input.registrations,
        (l: any) => ({
          event_id: eventId,
          location_name: l.location_name || '',
          address: l.address || '',
        }),
        headers,
        'Location'
      );

      return { success: true, event_id: eventId };
    },
  }),

  update: defineAction({
    accept: 'json',
    input: z.any(),
    handler: async (input, context) => {
      const { cookies, params, url } = context;
      // Astro Actions expone context.url (APIContext) con searchParams. Leemos
      // el id desde ?id=... cuando el cliente hace POST por HTTP; params.id
      // aplica cuando se invoca via Astro.callAction en SSR.
      const id =
        (params && params.id) ||
        (url && url.searchParams.get('id')) ||
        (input && input.id) ||
        '';
      if (!id) {
        throw new ActionError({ code: 'BAD_REQUEST', message: 'ID del evento requerido' });
      }

      const accessToken = cookies.get('access_token')?.value;
      // Strip dynamic sections + id — no forman parte del struct UpdateEventRequest
      const { distances, pricing_stages, categories, sponsors, registrations, runner_kits, id: _id, ...cleanInput } = input;
      const response = await api.put(`/events/${id}`, cleanInput, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (response.error) {
        throw new ActionError({ code: 'BAD_REQUEST', message: response.error });
      }

      return response.data;
    },
  }),

  getDistanceTypes: defineAction({
    accept: 'json',
    input: z.object({}),
    handler: async (_input, { cookies }) => {
      const accessToken = cookies.get('access_token')?.value;
      const response = await api.get<BackendListEnvelope<BackendDistanceType>>('/distances/types', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (response.error) {
        throw new ActionError({ code: 'BAD_REQUEST', message: response.error });
      }

      // El backend devuelve { message, data: [...] }, extraemos el array
      return response.data?.data ?? [];
    },
  }),

  getAgeCategories: defineAction({
    accept: 'json',
    input: z.object({}),
    handler: async (_input, { cookies }) => {
      const accessToken = cookies.get('access_token')?.value;
      const response = await api.get<BackendListEnvelope<BackendAgeCategory>>('/age-categories', {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (response.error) {
        throw new ActionError({ code: 'BAD_REQUEST', message: response.error });
      }

      // El backend devuelve { message, data: [...] }, extraemos el array
      return response.data?.data ?? [];
    },
  }),

  getFieldConfig: defineAction({
    accept: 'json',
    input: z.object({
      slug: z.string().min(1, 'Slug del evento requerido'),
    }),
    handler: async (input, { cookies }) => {
      const accessToken = cookies.get('access_token')?.value;
      // Backend expects event UUID, not slug. Resolve via getBySlug first.
      const lookup = await api.get<{ data: { id: string } }>(`/events/slug/${input.slug}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (lookup.error || !lookup.data?.data?.id) {
        throw new ActionError({ code: 'NOT_FOUND', message: 'Evento no encontrado' });
      }
      const eventId = lookup.data.data.id;
      const response = await api.get<EventFieldConfig[]>(`/events/${eventId}/field-config`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (response.error) {
        throw new ActionError({ code: 'BAD_REQUEST', message: response.error });
      }

      return response.data;
    },
  }),

  updateFieldConfig: defineAction({
    accept: 'json',
    input: z.object({
      slug: z.string().min(1, 'Slug del evento requerido'),
      sections: z.array(z.object({
        section_name: z.string(),
        is_enabled: z.boolean(),
      })),
    }),
    handler: async (input, { cookies }) => {
      const accessToken = cookies.get('access_token')?.value;
      // Resolve slug → event_id; backend requires UUID for path param.
      const lookup = await api.get<{ data: { id: string } }>(`/events/slug/${input.slug}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (lookup.error || !lookup.data?.data?.id) {
        throw new ActionError({ code: 'NOT_FOUND', message: 'Evento no encontrado' });
      }
      const eventId = lookup.data.data.id;
      const response = await api.put(`/events/${eventId}/field-config`, {
        sections: input.sections,
      }, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (response.error) {
        throw new ActionError({ code: 'BAD_REQUEST', message: response.error });
      }

      return { message: 'Configuración actualizada' };
    },
  }),

  getEventDetail: defineAction({
    accept: 'json',
    input: z.object({
      slug: z.string().min(1),
    }),
    handler: async (input, { cookies }) => {
      const accessToken = cookies.get('access_token')?.value;
      const headers: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

      // Resolve slug → UUID
      const lookup = await api.get<{ data: { id: string } }>(`/events/slug/${input.slug}`, { headers });
      if (lookup.error || !lookup.data?.data?.id) {
        throw new ActionError({ code: 'NOT_FOUND', message: 'Evento no encontrado' });
      }
      const id = lookup.data.data.id;

      // Full detail with sub-resources
      const res = await api.get<BackendEventDetail>(`/events/${id}/detail`, { headers });
      if (res.error) {
        throw new ActionError({ code: 'BAD_REQUEST', message: res.error });
      }
      return res.data;
    },
  }),

  getBySlug: defineAction({
    accept: 'json',
    input: z.object({
      slug: z.string().min(1),
    }),
    handler: async (input, { cookies }) => {
      const accessToken = cookies.get('access_token')?.value;
      const headers: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

      // 1. Get event by slug
      const eventRes = await api.get<{ message: string; data: BackendEvent }>(
        `/events/slug/${input.slug}`, { headers },
      );
      if (eventRes.error) {
        throw new ActionError({ code: 'NOT_FOUND', message: 'Evento no encontrado' });
      }
      const evt = eventRes.data!.data;

      // 2. Get full detail (distances, pricing, tags)
      const [detailRes, orgRes] = await Promise.all([
        api.get<BackendEventDetail>(`/events/${evt.id}/detail`, { headers }),
        api.get<{ message: string; data: BackendOrganizer }>(`/organizers/${evt.organizer_id}`, { headers }),
      ]);

      const detail = detailRes.data;
      const org = orgRes.data?.data;

      // 3. Map distances
      const eventDistances: (EventDistance & { km: number; description: string; elevation?: number | null; timeLimit?: string | null; capacity: number })[] =
        (detail?.distances || []).map((d) => ({
          id: d.id,
          km: d.km,
          distanceKm: d.km,
          name: `${d.km}K`,
          description: '', // backend no tiene descripción por distancia
          elevation: d.elevation,
          timeLimit: d.time_limit,
          priceModifier: 0,
          capacity: d.capacity,
        }));

      // 4. Resolve base price from first distance's pricing
      const firstDistId = eventDistances[0]?.id;
      const basePrice = firstDistId
        ? (detail?.pricing_stages || [])
            .filter((s) => s.distance_id === firstDistId)
            .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0]?.price || 0
        : 0;

      // 5. Build gallery from logo_url
      const logoUrl = evt.logo_url || org?.logo_url || '';
      const gallery = logoUrl ? [logoUrl, logoUrl] : [];

      // 6. Compute capacity from distances (backend doesn't store it on event)
      const totalCapacity = eventDistances.reduce((sum, d) => sum + (d.capacity || 0), 0);

      const baseEvent: BaseEvent = {
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
          id: org?.id || evt.organizer_id,
          name: org?.brand_name || org?.business_name || 'Unknown Organizer',
          logo: org?.logo_url,
        },
        images: {
          hero: logoUrl,
          gallery,
        },
        distances: eventDistances,
        pricing: {
          basePrice,
          currency: 'MXN',
          earlyBirdDeadline: evt.deadline,
        },
        status: evt.status as BaseEvent['status'],
        featured: false,
        tags: detail?.tags || [],
        itinerary: evt.itinerary,
        runner_kits: detail?.runner_kits || [],
        capacity: totalCapacity,
        registered: 0, // TODO: compute from actual registration counts
        createdAt: evt.created_at,
        updatedAt: evt.updated_at,
      };

      return baseEvent;
    },
  }),

  deleteRoute: defineAction({
    accept: 'json',
    input: z.object({
      id: z.string().min(1, 'Route ID requerido'),
    }),
    handler: async (input, { cookies }) => {
      const accessToken = cookies.get('access_token')?.value;
      const headers: Record<string, string> = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

      const res = await api.delete(`/routes/${input.id}`, { headers });
      if (res.error) {
        throw new ActionError({ code: 'BAD_REQUEST', message: res.error });
      }
      return { success: true };
    },
  }),

  getRoutes: defineAction({
    accept: 'json',
    input: z.object({
      eventId: z.string().min(1, 'Event ID requerido'),
    }),
    handler: async (input) => {
      // GET /events/event/{event_id}/routes returns routes for all distances
      const res = await api.get<{ message: string; data: RouteData[] }>(`/events/event/${input.eventId}/routes`);
      if (res.error) {
        throw new ActionError({ code: 'BAD_REQUEST', message: res.error });
      }
      return res.data?.data || [];
    },
  }),
};
