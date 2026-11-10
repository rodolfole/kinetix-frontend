type SubmitResult = { data?: unknown; error?: { message: string } | undefined };
type SubmitAction = (input: Record<string, string>) => Promise<SubmitResult>;

export type SubmitOutcome = { ok: true; redirectTo: string } | { ok: false; message: string };

export function eventSlugFromPath(pathname: string): string | null {
  return pathname.match(/^\/events\/([^/]+)\/registration/)?.[1] ?? null;
}

/** Submits the form values through the `registration.submit` Astro action. Empty fields are dropped. */
export async function submitRegistration(
  submit: SubmitAction,
  values: Record<string, string>,
  slug: string,
): Promise<SubmitOutcome> {
  const input = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== ''));
  const { error } = await submit(input);
  if (error) return { ok: false, message: error.message };
  return { ok: true, redirectTo: `/events/${slug}/registration/exito` };
}
