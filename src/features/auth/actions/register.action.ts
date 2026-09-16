import { defineAction } from 'astro:actions';
import type { RegisterResponse } from '@features/auth/types/response.types';
import { api } from '@lib/api';
import { setAuthCookies } from '@/lib/cookies';
import { registerSchema, organizerRegisterSchema } from '@/lib/validation';

export const register = {
  create: defineAction({
    accept: 'json',
    input: registerSchema,
    handler: async (input, { cookies }) => {
      const { confirm_email, ...payload } = {
        ...input,
        birth_date: new Date(input.birth_date).toISOString()
      };

      const response = await api.post<RegisterResponse>('/auth/register/participant', payload);

      if (response.error) {
        return {
          error: true,
          message: response.error,
        };
      }

      const { access_token, refresh_token, expires_in, user } = response.data!;

      // Set auth cookies using helper
      setAuthCookies(cookies, { access_token, refresh_token, user, expires_in });

      return {
        error: false,
        message: 'Usuario registrado correctamente',
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

  registerOrganizer: defineAction({
    accept: 'json',
    input: organizerRegisterSchema,
    handler: async (input, { cookies }) => {
      const response = await api.post<RegisterResponse>('/auth/register/organizer', input);

      if (response.error) {
        return {
          error: true,
          message: response.error,
        };
      }

      const { access_token, refresh_token, expires_in, user } = response.data!;

      // Set auth cookies using helper (role = 'organizer')
      setAuthCookies(cookies, { access_token, refresh_token, user, expires_in });

      return {
        error: false,
        message: 'Organizador registrado correctamente',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    },
  }),
};