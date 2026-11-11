// Funciones utilitarias para validación de formularios en el frontend
// Estas funciones se usan en los scripts inline de los archivos .astro

/**
 * Mostrar error en un campo del formulario
 */
export function showFieldError(fieldId: string, message: string) {
  const input = document.getElementById(fieldId);
  if (!input) return;

  // Aplicar estilos de error
  input.classList.add('border-red-500', 'ring-1', 'ring-red-500');
  input.classList.remove('border-input');

  // Crear o actualizar mensaje de error
  let errorEl = document.getElementById(`${fieldId}-error`);
  if (!errorEl) {
    errorEl = document.createElement('p');
    errorEl.id = `${fieldId}-error`;
    errorEl.className = 'text-xs text-red-500 mt-1';
    input.parentElement?.appendChild(errorEl);
  }
  errorEl.textContent = message;
}

/**
 * Limpiar todos los errores del formulario
 */
export function clearAllFieldErrors() {
  // Quitar clases de error
  document.querySelectorAll('.border-red-500, .ring-red-500').forEach((el) => {
    el.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
    el.classList.add('border-input');
  });

  // Eliminar todos los mensajes de error
  document.querySelectorAll('[id$="-error"]').forEach((el) => el.remove());
}

/**
 * Configurar listeners para limpiar errores al escribir en campos
 */
export function setupFieldErrorListeners(formSelector: string = '#registration-form') {
  const form = document.querySelector(formSelector);
  if (!form) return;

  form.querySelectorAll('input, select, textarea').forEach((input) => {
    input.addEventListener('input', () => {
      input.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
      input.classList.add('border-input');
      document.getElementById(`${input.id}-error`)?.remove();
    });
  });
}
