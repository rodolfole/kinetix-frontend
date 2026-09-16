import { z } from 'zod';

// Helper to convert null to empty string
const nullToEmpty = (val: unknown) => val ?? "";

export const personalInfoSchema = z
  .object({
    nombre: z.preprocess(
      nullToEmpty,
      z
        .string()
        .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
        .max(100, { message: "El nombre no puede exceder 100 caracteres" }),
    ),

    paterno: z.preprocess(
      nullToEmpty,
      z
        .string()
        .min(2, { message: "El apellido paterno es requerido" })
        .max(100, { message: "El apellido no puede exceder 100 caracteres" }),
    ),

    materno: z.string().optional(),

    sexo: z.preprocess(
      nullToEmpty,
      z.enum(["masculino", "femenino", "otro"], {
        errorMap: () => ({ message: "Selecciona una opción válida" }),
      }),
    ),

    nacimiento: z.preprocess(
      nullToEmpty,
      z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), {
          message: "Fecha de nacimiento inválida",
        })
        .refine(
          (val) => {
            const date = new Date(val);
            const today = new Date();
            const age = today.getFullYear() - date.getFullYear();
            return age >= 15 && age <= 100;
          },
          { message: "Debes tener entre 15 y 100 años para participar" },
        ),
    ),

    email: z.preprocess(
      nullToEmpty,
      z.string().email({ message: "Por favor ingresa un email válido" }),
    ),

    confirmEmail: z.preprocess(nullToEmpty, z.string()),

    telefono: z.preprocess(
      nullToEmpty,
      z
        .string()
        .min(10, { message: "El teléfono debe tener al menos 10 dígitos" })
        .max(20, { message: "El teléfono no puede exceder 20 caracteres" }),
    ),

    pais: z.preprocess(
      nullToEmpty,
      z.string().min(1, { message: "Selecciona un país" }),
    ),

    estado: z.preprocess(
      nullToEmpty,
      z.string().min(1, { message: "Selecciona un estado" }),
    ),

    cp: z.preprocess(
      nullToEmpty,
      z
        .string()
        .min(4, {
          message: "El código postal debe tener al menos 4 caracteres",
        })
        .max(10, {
          message: "El código postal no puede exceder 10 caracteres",
        }),
    ),
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: "Los emails no coinciden",
    path: ["confirmEmail"],
  });

export const raceInfoSchema = z.object({
  distanceId: z.preprocess(
    nullToEmpty,
    z.string().min(1, { message: "Selecciona una distancia" }),
  ),

  category: z.preprocess(
    nullToEmpty,
    z.string().min(1, { message: "Selecciona una categoría" }),
  ),

  estimatedTime: z.preprocess(
    nullToEmpty,
    z
      .string()
      .regex(/^\d{1,2}:\d{2}$/, { message: "Formato inválido. Usa HH:MM" }),
  ),

  team: z.string().optional(),

  shirtSize: z.preprocess(
    nullToEmpty,
    z.enum(["S", "M", "L", "XL"], {
      errorMap: () => ({ message: "Selecciona una talla válida" }),
    }),
  ),
});

export const registrationSchema = z.object({
  eventId: z.string().min(1, { message: "ID del evento requerido" }),
  personalInfo: personalInfoSchema,
  raceInfo: raceInfoSchema,
});

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;
export type RaceInfoInput = z.infer<typeof raceInfoSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;
