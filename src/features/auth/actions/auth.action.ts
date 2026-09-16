import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import type { LoginResponse } from '@features/auth/types/response.types';
import { api } from '@lib/api';
import { setAuthCookies, deleteAuthCookies } from '@/lib/cookies';
import { loginSchema } from '@/lib/validation';

export const auth = {
  login: defineAction({
    accept: 'json',
    input: loginSchema,
    handler: async (input, { cookies }) => {
      const response = await api.post<LoginResponse>('/auth/login', input);

      if (response.error) {
        return {
          error: true,
          message: response.error,
        };
      }

      if (!response.data?.access_token || !response.data?.user) {
        return {
          error: true,
          message: 'Respuesta inválida del servidor',
        };
      }

      const { access_token, refresh_token, expires_in, user } = response.data;

      // Set auth cookies using helper
      setAuthCookies(cookies, { access_token, refresh_token, user, expires_in });

      return {
        error: false,
        message: 'Login exitoso',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        },
      };
    },
  }),

  logout: defineAction({
    accept: 'json',
    input: z.object({}),
    handler: async (_, { cookies }) => {
      deleteAuthCookies(cookies);
      
      return {
        error: false,
        message: 'Sesión cerrada',
      };
    },
  }),
};