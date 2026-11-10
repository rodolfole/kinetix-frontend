import { z } from 'zod';

export const personalInfoSchema = z.object({
  first_name: z.string().min(1, 'Nombre requerido'),
  last_name: z.string().min(1, 'Apellido paterno requerido'),
  second_last_name: z.string().min(1, 'Apellido materno requerido'),
  birth_date: z.string().min(1, 'Fecha de nacimiento requerida'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
    errorMap: () => ({ message: 'Selecciona un género' }),
  }),
  phone: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  email: z.string().email('Email inválido'),
});

export const raceInfoSchema = z.object({
  event_id: z.string().uuid('ID de evento inválido'),
  distance_id: z.string().min(1, 'Selecciona una distancia'),
  bib_number: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  t_shirt_size: z.enum(['XS', 'S', 'M', 'L', 'XL']).optional(),
  medical_conditions: z.string().optional(),
});

export const registrationSchema = personalInfoSchema.merge(raceInfoSchema);

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type RaceInfoInput = z.infer<typeof raceInfoSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;
