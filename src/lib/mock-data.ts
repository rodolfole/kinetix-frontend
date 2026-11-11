// Display helpers for the demo EventCard/CTA/Distances components.
// Demo data (`mockEvents`, getEventBySlug, getFeaturedEvents, etc.) has been
// removed — the live API now feeds the components via actions.home.getEvents.

import type { BaseEvent } from '@features/events/types/event.type';

export function formatPrice(price: number, currency: string = 'EUR'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(price / 100);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getAvailableSlots(event: BaseEvent, distanceId: string): number | undefined {
  const distance = event.distances.find((d) => d.id === distanceId);
  if (!distance || !distance.availableSlots) return undefined;

  return distance.availableSlots - (distance.registered || 0);
}
