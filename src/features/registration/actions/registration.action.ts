import { defineAction, ActionError } from 'astro:actions';
import { api } from '@lib/api';
import { registrationSchema } from '@features/registration/schemas/registration.schema';
import type { RegistrationResult } from '@features/registration/types/registration.type';

// The form does not collect these; the backend requires them on /registrations/with-participant.
const DEFAULT_COUNTRY = 'MX';
const DEFAULT_ADDRESS = 'No especificada';
const DEFAULT_CATEGORY = 'general';

export const registration = {
  submit: defineAction({
    accept: 'json',
    input: registrationSchema,
    handler: async (input, { cookies }): Promise<RegistrationResult> => {
      const token = cookies.get('access_token')?.value;
      if (!token) {
        throw new ActionError({ code: 'UNAUTHORIZED', message: 'Inicia sesión para inscribirte' });
      }

      const body = {
        event_id: input.event_id,
        participant: {
          first_name: input.first_name,
          last_name: input.last_name,
          second_last_name: input.second_last_name,
          gender: input.gender,
          birth_date: `${input.birth_date}T00:00:00Z`,
          email: input.email,
          phone: input.phone,
          country: DEFAULT_COUNTRY,
          address: DEFAULT_ADDRESS,
          ...(input.t_shirt_size && { size: input.t_shirt_size }),
          ...(input.emergency_contact_name && { emergency_contact_name: input.emergency_contact_name }),
          ...(input.emergency_contact_phone && { emergency_contact_phone: input.emergency_contact_phone }),
          ...(input.medical_conditions && { medical_info: input.medical_conditions }),
        },
        registration: {
          distance_id: input.distance_id,
          category: DEFAULT_CATEGORY,
          ...(input.t_shirt_size && { size: input.t_shirt_size }),
        },
      };

      const res = await api.post<{ data: RegistrationResult }>('/registrations/with-participant', body, { token });
      if (res.error) {
        throw new ActionError({ code: 'BAD_REQUEST', message: res.error });
      }
      const result = res.data?.data ?? ({} as RegistrationResult);

      // Short-lived summary for the confirmation page (PLAN-11 T8). The
      // backend is the source of truth; this is presentation data only.
      if (result.bib_number || result.id) {
        cookies.set('registration-data', JSON.stringify(result), {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 900,
          secure: import.meta.env.PROD,
        });
      }
      return result;
    },
  }),
};
