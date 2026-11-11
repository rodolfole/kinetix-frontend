import type { APIRoute } from 'astro';
import { getBaseUrl } from '@lib/api';

export const prerender = false;

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * POST /api/routes/upload — proxies the GPX multipart upload to the backend
 * (POST /routes/upload) attaching the httpOnly access_token cookie as Bearer.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('access_token')?.value;
  if (!token) return json({ message: 'No autenticado' }, 401);

  try {
    const body = await request.formData();
    const res = await fetch(`${getBaseUrl()}/routes/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
    return new Response(await res.text(), {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return json({ message: 'Error de conexión' }, 502);
  }
};
