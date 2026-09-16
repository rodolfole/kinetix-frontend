import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { api } from '@lib/api';

// participant fields config from event
export interface ParticipantFieldConfig {
  field_name: string;
  is_required: boolean;
  is_enabled: boolean;
}

// Schema para Step 1 - Location & Emergency Contact (base, field config handled dynamically)
// When participant_id is provided (logged in user), core fields come from profile
const personalInfoBaseSchema = z.object({
  // address is ALWAYS required
  address: z.string().min(1, 'La dirección es obligatoria'),
  // participant_id: if provided, the existing participant is used and these fields are not needed
  participant_id: z.string().uuid().optional(),
  // Core fields - only required when NOT using existing participant (anonymous flow)
  first_name: z.string().min(1, 'El nombre es obligatorio').optional(),
  last_name: z.string().min(1, 'El apellido es obligatorio').optional(),
  gender: z.enum(['M', 'F', 'O'], { required_error: 'El género es obligatorio' }).optional(),
  birth_date: z.string().min(1, 'La fecha de nacimiento es obligatoria').optional(),
  email: z.string().email('El email no es válido').optional(),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos').optional(),
  // Configurable fields - optional by default, made required based on event config
  country: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  medical_info: z.string().optional(),
  waiver_signed_at: z.string().optional(),
});

// Schema para Step 2 - Race Info
const raceInfoSchema = z.object({
  distance_id: z.string().min(1, 'Please select a distance'),
  category: z.string().min(1, 'Please select a category'),
  time: z.string().optional(),
  team: z.string().optional(),
  size: z.string().min(1, 'Please select a shirt size'),
});

// Schema completo
const completeRegistrationSchema = z.object({
  event_id: z.string().uuid('ID de evento inválido'),
  event_slug: z.string().min(1, 'Event slug is required'),
  personal_info: personalInfoBaseSchema,
  race_info: raceInfoSchema,
});

export const registration = {
  // Completar inscripción
  completeRegistration: defineAction({
    accept: 'json',
    input: completeRegistrationSchema,
    handler: async (input, { cookies }) => {
      // Obtener token de las cookies
      const accessToken = cookies.get('access_token')?.value;

      const isLoggedIn = !!input.personal_info.participant_id;

      // Build request payload
      const payload: any = {
        event_id: input.event_id,
        registration: {
          distance_id: input.race_info.distance_id,
          category: input.race_info.category,
          time: input.race_info.time || null,
          team: input.race_info.team || null,
          size: input.race_info.size || null,
        },
      };

      if (isLoggedIn) {
        // Logged in user - use existing participant, just update team/size and create registration
        payload.participant_id = input.personal_info.participant_id;
      } else {
        // Anonymous user - create new participant with all data
        payload.participant = {
          first_name: input.personal_info.first_name,
          last_name: input.personal_info.last_name,
          second_last_name: null,
          gender: input.personal_info.gender,
          birth_date: input.personal_info.birth_date,
          email: input.personal_info.email,
          phone: input.personal_info.phone,
          country: input.personal_info.country || 'MX',
          municipality: input.personal_info.city || null,
          state: input.personal_info.state || null,
          zip_code: input.personal_info.zip_code || null,
          team: input.race_info.team || null,
          size: input.race_info.size || null,
          emergency_contact_name: input.personal_info.emergency_contact_name || null,
          emergency_contact_phone: input.personal_info.emergency_contact_phone || null,
          medical_info: input.personal_info.medical_info || null,
          waiver_signed_at: input.personal_info.waiver_signed_at || null,
          address: input.personal_info.address,
        };
      }

      // Call the API
      const response = await api.post('/registrations/with-participant', payload, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });

      if (response.error) {
        return {
          error: true,
          message: response.error,
        };
      }

      return {
        error: false,
        message: 'Registration completed successfully',
        redirectUrl: `/events/${input.event_slug}/registration/exito`,
        data: response.data,
      };
    },
  }),
};