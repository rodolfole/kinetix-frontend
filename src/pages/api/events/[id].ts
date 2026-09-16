import type { APIRoute } from 'astro';
import { api } from '@lib/api';

export const prerender = false;

/**
 * PUT /api/events/:id — actualiza un evento desde el dashboard.
 *
 * El backend Go espera PUT /api/v1/events/:id con el struct UpdateEventRequest
 * (sólo campos base). El frontend ya filtra sub-recursos antes de invocar.
 *
 * Esta ruta existe porque invocar Astro Actions con id en path params no es
 * trivial desde HTTP — el handler no recibe params de URL. Hacer un endpoint
 * dedicado es más simple y robusto que pelear con el wrapper de Actions.
 */
export const PUT: APIRoute = async ({ request, params, cookies }) => {
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: 'ID del evento requerido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Body inválido' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Sólo enviar los campos que el struct UpdateEventRequest acepta. El backend usa
  // DisallowUnknownFields y rechaza con "invalid request body" cualquier payload
  // que tenga campos extra (incluso sub-recursos en null).
  const allowed = [
    'name',
    'slug',
    'description',
    'event_date',
    'deadline',
    'state',
    'municipality',
    'address',
    'logo_url',
    'judges',
    'rules',
    'risks',
    'transit',
    'itinerary',
    'status',
  ];
  const cleanInput: Record<string, any> = {};
  for (const key of allowed) {
    if (body && body[key] !== undefined) {
      cleanInput[key] = body[key];
    }
  }

  const accessToken = cookies.get('access_token')?.value;
  try {
    const res = await api.put(`/events/${id}`, cleanInput, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    });
    if (res.error) {
      return new Response(JSON.stringify({ error: res.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(res.data?.data ?? res.data ?? { ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Error al actualizar el evento' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};