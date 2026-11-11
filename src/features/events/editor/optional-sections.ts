/**
 * Toggleable event sections. Each entry renders a FormSection-like block when
 * the user turns its checkbox on; the toggle ids and the DOM contract
 * (`#add-reg-btn`, `#reg-locations-container`, `#no-registration-msg`) are what
 * the rest of the editor script relies on.
 */

export interface OptionalSectionDefinition {
  title: string;
  description: string;
  render: () => string;
}

const TEXTAREA_CLASS =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none';

const textarea = (id: string, placeholder: string) =>
  `<textarea id="${id}" name="${id}" placeholder="${placeholder}" rows="4" class="${TEXTAREA_CLASS}"></textarea>`;

export const OPTIONAL_SECTION_DEFINITIONS: Record<string, OptionalSectionDefinition> = {
  registrations: {
    title: 'Puntos de Registro Físico',
    description: 'Ubicaciones y horarios de inscripción presencial',
    render: () => `
            <div class="section-content" data-section="registrations">
              <div class="flex gap-2 mb-4">
                <button type="button" id="add-reg-btn" class="ml-auto h-9 px-4 inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white text-sm font-medium hover:bg-zinc-50 transition">+ Añadir Ubicación</button>
              </div>
              <div id="reg-locations-container" class="space-y-6"></div>
              <p class="text-sm text-muted-foreground text-center py-4" id="no-registration-msg">No hay ubicaciones registradas todavía.</p>
            </div>`,
  },
  rules: {
    title: 'Reglamento',
    description: 'Reglas y regulaciones',
    render: () => textarea('rules', 'Escribe el reglamento...'),
  },
  risks: {
    title: 'Carta Responsiva',
    description: 'Texto legal de responsabilidad',
    render: () => textarea('risks', 'Escribe la carta responsiva...'),
  },
  judges: {
    title: 'Jueces y Oficiales',
    description: 'Información sobre los jueces de carrera',
    render: () => textarea('judges', 'Información de jueces...'),
  },
  transit: {
    title: 'Área de Transición',
    description: 'Información de logística',
    render: () => textarea('transit', 'Información del área de transición...'),
  },
};

/** Marks the section as enabled/disabled in the "Secciones Opcionales" grid. */
export const OPTIONAL_SECTION_CARDS = [
  {
    name: 'registrations',
    label: 'Puntos de Registro Físico',
    icon: '📍',
    desc: 'Ubicaciones de inscripción presencial',
  },
  { name: 'rules', label: 'Reglamento', icon: '📜', desc: 'Reglas y regulaciones' },
  { name: 'risks', label: 'Carta Responsiva', icon: '✍️', desc: 'Texto legal de responsabilidad' },
  {
    name: 'judges',
    label: 'Jueces y Oficiales',
    icon: '👨‍⚖️',
    desc: 'Información de los jueces de carrera',
  },
  { name: 'transit', label: 'Área de Transición', icon: '🔄', desc: 'Información de logística' },
] as const;
