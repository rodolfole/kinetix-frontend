// Same-origin relative path: a single leading "/", no backslashes, no whitespace/control chars.
const SAFE_PATH = /^\/(?![/\\])[^\\\s\x00-\x1f]*$/;
const EVENT_SLUG = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

export function safeRedirect(value: string | null | undefined, fallback = '/'): string {
  return value && SAFE_PATH.test(value) ? value : fallback;
}

/** Login `?redirect=` target: a bare event slug maps to its registration page; anything else must be a safe path. */
export function resolveLoginRedirect(value: string | null | undefined, fallback: string): string {
  if (value && EVENT_SLUG.test(value)) return `/events/${value}/registration`;
  return safeRedirect(value, fallback);
}
