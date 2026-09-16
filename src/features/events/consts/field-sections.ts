// Definición de secciones toggleables del formulario de eventos.
// Cada sección puede activarse/desactivarse y al activarse sus campos son requeridos.
// distances y pricing_stages son SIEMPRE requeridos y no aparecen acá.

export interface FieldSectionDef {
  section_name: string;
  label: string;
  description: string;
  fields: string[]; // campos del formulario que abarca
}

export const EVENT_FIELD_SECTIONS: FieldSectionDef[] = [
  {
    section_name: 'categories',
    label: 'Categorías y Premiaciones',
    description: 'Rangos de edad y montos de premio por distancia',
    fields: ['categories'],
  },
  {
    section_name: 'sponsors',
    label: 'Patrocinadores',
    description: 'Marcas y partners del evento',
    fields: ['sponsors'],
  },
  {
    section_name: 'runner_kits',
    label: 'Kit del Corredor',
    description: 'Artículos que recibirán los participantes (playera, medalla, número, etc.)',
    fields: ['runner_kits'],
  },
  {
    section_name: 'registrations',
    label: 'Puntos de Registro Físico',
    description: 'Ubicaciones y horarios para registro presencial',
    fields: ['registrations'],
  },
  {
    section_name: 'judges',
    label: 'Jueces y Oficiales',
    description: 'Información sobre los jueces de la carrera',
    fields: ['judges'],
  },
  {
    section_name: 'rules',
    label: 'Reglamento',
    description: 'Reglas y regulaciones del evento',
    fields: ['rules'],
  },
  {
    section_name: 'risks',
    label: 'Riesgos y Exenciones',
    description: 'Exenciones de responsabilidad y advertencias',
    fields: ['risks'],
  },
  {
    section_name: 'transit',
    label: 'Área de Transición',
    description: 'Información logística de la zona de transición',
    fields: ['transit'],
  },
];

// Mapa rápido section_name → FieldSectionDef
export const FIELD_SECTION_MAP: Record<string, FieldSectionDef> =
  Object.fromEntries(EVENT_FIELD_SECTIONS.map((s) => [s.section_name, s]));

// Campos que SIEMPRE son requeridos
export const ALWAYS_REQUIRED_SECTIONS = ['distances', 'pricing_stages'] as const;

// Campos individuales que SIEMPRE son requeridos (no section, son fields sueltos)
export const ALWAYS_REQUIRED_FIELDS = [
  'name',
  'slug',
  'description',
  'event_date',
  'deadline',
  'state',
  'municipality',
  'address',
  'logo_url',
] as const;

// Nombre de la sección por defecto para el itinerary
export const ITINERARY_SECTION_NAME = 'itinerary' as const;
