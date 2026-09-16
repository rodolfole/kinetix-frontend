/**
 * Genera un slug amigable para URL a partir de un string.
 * @param text - El texto a transformar (ej. "Maratón de Arandas")
 * @returns El slug formateado (ej. "maraton-de-arandas")
 */
export const generateSlug = (text: string): string => {
  return text
    .toString()
    .normalize('NFD')                   // Separa caracteres base de sus acentos
    .replace(/[\u0300-\u036f]/g, '')    // Elimina los acentos (diacríticos)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')               // Reemplaza espacios por guiones
    .replace(/[^\w-]+/g, '')            // Elimina caracteres especiales (excepto guiones)
    .replace(/--+/g, '-')               // Evita guiones dobles
    .replace(/^-+/, '')                 // Elimina guiones al inicio
    .replace(/-+$/, '');                // Elimina guiones al final
};