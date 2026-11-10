import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { api } from '@lib/api';

export const admin = {
  getConfig: defineAction({
    accept: 'json',
    input: z.object({}).optional(),
    handler: async (_input, { cookies }) => {
      const token = cookies.get('access_token')?.value;
      const res = await api.get<{ data: { commission_pct: number; updated_at: string } }>(
        '/admin/config',
        { token }
      );
      if (res.error) throw new Error(res.error);
      return res.data?.data ?? { commission_pct: 10, updated_at: new Date().toISOString() };
    },
  }),

  updateConfig: defineAction({
    accept: 'form',
    input: z.object({
      commission_pct: z.coerce.number().min(0).max(100),
      updated_by: z.string().min(1).max(200),
    }),
    handler: async (input, { cookies }) => {
      const token = cookies.get('access_token')?.value;
      const res = await api.put<{ data: { commission_pct: number } }>(
        '/admin/config',
        input,
        { token }
      );
      if (res.error) throw new Error(res.error);
      return res.data?.data ?? { commission_pct: input.commission_pct };
    },
  }),

  listPayouts: defineAction({
    accept: 'json',
    input: z.object({
      status: z.enum(['pending', 'sent', 'failed', 'all']).optional(),
    }).optional(),
    handler: async (input, { cookies }) => {
      const token = cookies.get('access_token')?.value;
      const status = input?.status ?? 'all';
      const path = status === 'all' ? '/admin/payouts' : `/admin/payouts?status=${status}`;
      const res = await api.get<{ data: Array<Record<string, unknown>>; total: number }>(
        path,
        { token }
      );
      if (res.error) throw new Error(res.error);
      return res.data ?? { data: [], total: 0 };
    },
  }),
};
