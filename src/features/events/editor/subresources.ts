/**
 * Server-side mappings of the event editor page:
 * - loaded event → form input values
 * - `/events/{id}/detail` → pre-populated sub-resource cards
 */

export interface EventFormValues {
  name: string;
  slug: string;
  description: string;
  state: string;
  municipality: string;
  address: string;
  logo_url: string;
  date: string;
  deadline: string;
}

export interface InitialSubResources {
  distances: any[];
  pricing_stages: any[];
  sponsors: any[];
  runner_kits: any[];
  registrations: any[];
  itinerary: any[];
  categories: any[];
}

const emptyFormValues = (): EventFormValues => ({
  name: '',
  slug: '',
  description: '',
  state: '',
  municipality: '',
  address: '',
  logo_url: '',
  date: '',
  deadline: '',
});

const toDateInput = (value: string | undefined, sliceTo: number): string =>
  value ? new Date(value).toISOString().slice(0, sliceTo) : '';

export function buildFormData(existingEvent: any | null): EventFormValues {
  if (!existingEvent) return emptyFormValues();

  return {
    name: existingEvent.name ?? '',
    slug: existingEvent.slug ?? '',
    // La descripción completa, no el shortDescription truncado.
    description: existingEvent.description || existingEvent.shortDescription || '',
    state: existingEvent.location?.state ?? '',
    municipality: existingEvent.location?.municipality ?? '',
    address: existingEvent.location?.address ?? '',
    logo_url: existingEvent.logo_url ?? '',
    date: toDateInput(existingEvent.date, 16),
    // El backend expone el deadline como pricing.earlyBirdDeadline (RFC3339);
    // el input type="date" espera "YYYY-MM-DD".
    deadline: toDateInput(existingEvent.pricing?.earlyBirdDeadline, 10),
  };
}

/** Groups the flat award rows into one card per (distance, age category, gender). */
function groupAwardRows(awards: any[]): InitialSubResources['categories'] {
  const groups = new Map<string, any>();
  for (const award of awards) {
    const key = `${award.distance_id}__${award.age_category_id}__${award.gender}`;
    if (!groups.has(key)) {
      groups.set(key, {
        distance_id: award.distance_id,
        age_category_id: award.age_category_id,
        gender: award.gender,
        prizes: [] as any[],
      });
    }
    groups.get(key)!.prizes.push({
      place: award.place || 1,
      prize_amount: award.prize_amount,
    });
  }

  return Array.from(groups.values()).map((group) => ({
    distance_id: group.distance_id,
    age_category_id: group.age_category_id,
    gender: group.gender,
    num_places: group.prizes.length,
    prize_amounts: group.prizes
      .sort((a: any, b: any) => (a.place || 0) - (b.place || 0))
      .map((prize: any) => prize.prize_amount),
  }));
}

export function buildInitialSubResources(eventDetail: any | null): InitialSubResources {
  if (!eventDetail) {
    return {
      distances: [],
      pricing_stages: [],
      sponsors: [],
      runner_kits: [],
      registrations: [],
      itinerary: [],
      categories: [],
    };
  }

  const awards = eventDetail.categories || eventDetail.awards || [];

  return {
    distances: (eventDetail.distances || []).map((distance: any) => ({
      distance_type_id: distance.km ? `fallback-${distance.km}K` : '',
      km: distance.km,
      capacity: distance.capacity,
      surface: distance.surface,
    })),
    pricing_stages: (eventDetail.pricing_stages || []).map((stage: any) => ({
      distance_id: stage.distance_id,
      name: stage.name,
      price: stage.price,
      start_date: toDateInput(stage.start_date, 10),
      end_date: toDateInput(stage.end_date, 10),
      is_early_bird: !!stage.is_early_bird,
    })),
    sponsors: (eventDetail.sponsors || []).map((sponsor: any) => ({
      name: sponsor.name,
      tier: sponsor.tier,
      logo_url: sponsor.logo_url || '',
    })),
    runner_kits: (eventDetail.runner_kits || []).map((kit: any) => ({
      name: kit.name,
      icon: kit.icon,
    })),
    registrations: (eventDetail.registration_locations || []).map((location: any) => ({
      location_name: location.location_name || location.name || '',
      address: location.address || '',
    })),
    itinerary: eventDetail.data?.itinerary || [],
    categories: groupAwardRows(awards),
  };
}
