import { z } from 'zod';

// Schema para registro de organizador
export const organizerRegisterSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  business_name: z.string().min(2, 'La razón social debe tener al menos 2 caracteres').max(255, 'La razón social es demasiado larga'),
  brand_name: z.string().min(2, 'El nombre comercial debe tener al menos 2 caracteres').max(255, 'El nombre comercial es demasiado largo').optional().or(z.literal('')),
  rfc: z.string().min(12, 'El RFC debe tener al menos 12 caracteres').max(13, 'El RFC debe tener máximo 13 caracteres'),
  billing_zip_code: z.string().min(4, 'El código postal debe tener al menos 4 caracteres').max(10, 'El código postal es demasiado largo'),
  billing_state: z.string().min(2, 'El estado debe tener al menos 2 caracteres').max(100, 'El estado es demasiado largo'),
  billing_city: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres').max(100, 'La ciudad es demasiado larga'),
  contact_name: z.string().min(2, 'El nombre de contacto debe tener al menos 2 caracteres').max(255, 'El nombre de contacto es demasiado largo'),
  contact_email: z.string().email('Correo de contacto inválido'),
  contact_phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos').max(20, 'El teléfono es demasiado largo'),
  logo_url: z.string().url('La URL del logo no es válida').optional().or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

// Schema base para registro de usuario
export const registerSchema = z.object({
  first_name: z.string().min(1, 'El nombre es requerido'),
  last_name: z.string().min(1, 'El apellido paterno es requerido'),
  second_last_name: z.string().min(1, 'El apellido materno es requerido'),
  birth_date: z.string().min(1, 'La fecha de nacimiento es requerida'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
    error: 'Selecciona un género válido',
  }),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  email: z.string().email('Correo electrónico inválido'),
  confirm_email: z.email('Confirmación de correo inválida'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
}).refine((data) => data.email === data.confirm_email, {
  message: 'Los correos electrónicos no coinciden',
  path: ['confirm_email'],
});

// Schema para información de ubicación y contacto de emergencia (Step 1)
export const personalInfoRegistrationSchema = z.object({
  municipality: z.string().min(1, 'Municipality is required'),
  state: z.string().min(1, 'State is required'),
  zip_code: z.string().min(5, 'ZIP code must have at least 5 characters'),
  emergency_contact_name: z.string().min(1, 'Emergency contact name is required'),
  emergency_contact_phone: z.string().min(10, 'Emergency contact phone must have at least 10 digits'),
  medical_info: z.string().optional(),
});

// Schema para información de carrera
export const raceInfoSchema = z.object({
  distance_id: z.string().min(1, 'Please select a distance'),
  category_id: z.string().min(1, 'Please select a category'),
  time: z.string().optional(),
  team: z.string().optional(),
  size_id: z.string().min(1, 'Please select a shirt size'),
});

// Validar contraseña segura
export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Minimum 8 characters';
  if (!/[A-Z]/.test(password)) return 'Must include at least one uppercase';
  if (!/[a-z]/.test(password)) return 'Must include at least one lowercase';
  if (!/\d/.test(password)) return 'Must include at least one number';
  return null;
}

// Schema base para creación/edición de eventos
export const eventSchema = z.object({
  name: z.string().min(1, 'El nombre del evento es requerido'),
  // Slug es opcional en el cliente: el backend lo genera a partir del nombre si llega vacío.
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones').optional().or(z.literal('')),
  description: z.string().min(1, 'La descripción es requerida'),
  event_date: z.string().min(1, 'La fecha del evento es requerida'),
  deadline: z.string().min(1, 'La fecha límite de registro es requerida'),
  state: z.string().optional(),
  municipality: z.string().optional(),
  address: z.string().min(1, 'La dirección es requerida'),
  logo_url: z.string().optional(),
  itinerary: z.array(z.object({
    key: z.string().min(1, 'El nombre del punto es requerido'),
    time: z.string().min(1, 'La hora es requerida').regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido (HH:MM)'),
    icon: z.string().min(1, 'Selecciona un icono'),
  })).min(1, 'Agrega al menos un punto al itinerario'),
}).refine(
  (data) => data.deadline.slice(0, 10) <= data.event_date.slice(0, 10),
  {
    message: 'La fecha límite de inscripción no puede ser posterior a la fecha del evento',
    path: ['deadline'],
  }
);

// Schema para distancia dentro del evento (passthrough para _tempId)
export const eventDistanceSchema = z.object({
  distance_type_id: z.string().min(1, 'Selecciona un tipo de distancia'),
  capacity: z.string().min(1, 'La capacidad es requerida'),
  surface: z.enum(['asphalt', 'trail', 'track', 'mixed'], {
    error: 'Selecciona una superficie válida',
  }),
}).passthrough();

// Schema para categoría de premiación
export const categorySchema = z.object({
  distance_id: z.string().min(1, 'Selecciona una distancia'),
  age_category_id: z.string().min(1, 'Selecciona un rango de edad'),
  gender: z.enum(['general', 'male', 'female']).default('general'),
  prize_amount: z.string().optional(),
});

// Schema para etapa de precio
export const priceStageSchema = z.object({
  distance_id: z.string().min(1, 'Selecciona una distancia'),
  name: z.string().optional(),
  price: z.string().min(1, 'El precio es requerido'),
  start_date: z.string().min(1, 'La fecha de inicio es requerida'),
  end_date: z.string().min(1, 'La fecha de fin es requerida'),
  is_early_bird: z.string().optional(),
}).refine(
  (data) => data.end_date >= data.start_date,
  {
    message: 'La fecha de fin no puede ser anterior a la fecha de inicio',
    path: ['end_date'],
  }
).refine(
  // La etapa de precio no puede cerrar después del evento. Comparamos sólo
  // la parte de fecha (YYYY-MM-DD) porque end_date es date-only mientras
  // event_date puede incluir hora.
  (data) => {
    if (!data.end_date) return true;
    // Leemos event_date desde el DOM al validar; si no está, no bloqueamos.
    const ed = (document.getElementById('event_date') as HTMLInputElement | null)?.value;
    if (!ed) return true;
    return data.end_date <= ed.slice(0, 10);
  },
  {
    message: 'La fecha de fin no puede ser posterior a la fecha del evento',
    path: ['end_date'],
  }
);

// Schema para ubicación de registro físico
export const registrationLocationSchema = z.object({
  location_name: z.string().min(1, 'El nombre de la ubicación es requerido'),
  address: z.string().optional(),
});

// Schema para sponsor
export const sponsorSchema = z.object({
  name: z.string().min(1, 'El nombre del sponsor es requerido'),
  tier: z.string().optional(),
  logo_url: z.string().optional(),
});

// Schema para ítem de kit del corredor
export const runnerKitItemSchema = z.object({
  name: z.string().min(1, 'El nombre del artículo es requerido'),
  icon: z.string().optional(),
});

// Schema base para info adicional del evento (textos largos opcionales)
export const eventInfoSchema = z.object({
  judges: z.string().optional(),
  rules: z.string().optional(),
  risks: z.string().optional(),
  transit: z.string().optional(),
});

// Schema para items dinámicos del evento (distances, categories, etc.)
export const dynamicItemSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.record(z.string(), itemSchema);

// Schema para un ítem de itinerario (key, time, icon)
export const itineraryItemSchema = z.object({
  key: z.string().min(1, 'El nombre del punto es requerido'),
  time: z.string().min(1, 'La hora es requerida').regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido (HH:MM)'),
  icon: z.string().min(1, 'Selecciona un icono'),
});

// Construye el schema de validación del evento basado en las secciones habilitadas.
// - distances y pricing_stages son SIEMPRE requeridas
// - itinerary es SIEMPRE requerido
// - Las secciones en enabledSections se agregan como requeridas
export function buildEventSchema(enabledSections: string[]) {
  const schemaObj: Record<string, z.ZodTypeAny> = {
    // Distancias: siempre requeridas, al menos una (como array)
    distances: z.array(eventDistanceSchema).min(1, 'Agrega al menos una distancia al evento'),
    // Etapas de precio: siempre requeridas, al menos una (como array)
    pricing_stages: z.array(priceStageSchema).min(1, 'Agrega al menos una etapa de precio al evento'),
  };

  // Agregar secciones toggleables
  if (enabledSections.includes('categories')) {
    schemaObj.categories = dynamicItemSchema(categorySchema);
  }
  if (enabledSections.includes('registrations')) {
    schemaObj.registrations = dynamicItemSchema(registrationLocationSchema);
  }
  if (enabledSections.includes('sponsors')) {
    schemaObj.sponsors = dynamicItemSchema(sponsorSchema);
  }
  if (enabledSections.includes('runner_kits')) {
    schemaObj.runner_kits = dynamicItemSchema(runnerKitItemSchema).optional();
  }
  if (enabledSections.includes('judges')) {
    schemaObj.judges = z.string().optional();
  }
  if (enabledSections.includes('rules')) {
    schemaObj.rules = z.string().optional();
  }
  if (enabledSections.includes('risks')) {
    schemaObj.risks = z.string().min(1, 'Los riesgos y exenciones son requeridos');
  }
  if (enabledSections.includes('transit')) {
    schemaObj.transit = z.string().optional();
  }

  return eventSchema.extend(schemaObj);
}

/**
 * Schema sólo con los campos básicos — usado en modo edición porque el backend
 * de update ignora sub-recursos (distances, pricing, sponsors, etc). Validar
 * sub-recursos rompería la UX sin sentido: ya están persistidos.
 *
 * Se construye a mano con z.object en vez de eventSchema.pick() porque Zod v4
 * no permite .pick() sobre schemas con refinements (refine en eventSchema).
 */
export const baseEventSchema = z.object({
  name: z.string().min(1, 'El nombre del evento es requerido'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones').optional().or(z.literal('')),
  description: z.string().min(1, 'La descripción es requerida'),
  event_date: z.string().min(1, 'La fecha del evento es requerida'),
  deadline: z.string().min(1, 'La fecha límite de registro es requerida'),
  state: z.string().optional(),
  municipality: z.string().optional(),
  address: z.string().min(1, 'La dirección es requerida'),
  logo_url: z.string().optional(),
  itinerary: z.array(z.object({
    key: z.string().min(1, 'El nombre del punto es requerido'),
    time: z.string().min(1, 'La hora es requerida').regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora inválido (HH:MM)'),
    icon: z.string().min(1, 'Selecciona un icono'),
  })).min(1, 'Agrega al menos un punto al itinerario'),
}).refine(
  (data) => data.deadline.slice(0, 10) <= data.event_date.slice(0, 10),
  {
    message: 'La fecha límite de inscripción no puede ser posterior a la fecha del evento',
    path: ['deadline'],
  }
);

export type EventFullData = z.infer<ReturnType<typeof buildEventSchema>>;

// Tipos para los resultados
export type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};

// Helper para colectar items dinámicos desde el DOM
// Reutilizable para distances, categories, pricing_stages, registrations, sponsors
// Retorna un objeto simple { [id]: { field: value } }
export function collectDynamicItems(
  containerId: string,
  fields: string[]
): Record<string, unknown> {
  const container = document.getElementById(containerId);
  if (!container) return {};
  
  const items: Record<string, unknown> = {};
  
  container.querySelectorAll('[data-id]').forEach((card: Element) => {
    const el = card as HTMLElement;
    const id = el.dataset.id;
    if (!id) return;
    
    const item: Record<string, string> = {};
    let hasValue = false;
    
    fields.forEach(field => {
      const input = el.querySelector(`[data-name="${field}"]`) as HTMLInputElement | HTMLSelectElement | null;
      if (input) {
        item[field] = input.value;
        if (input.value) hasValue = true;
      }
    });
    
    if (hasValue) {
      items[id] = item;
    }
  });
  
  return items;
}