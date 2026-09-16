import type { BaseEvent, EventFilter } from '@features/events/types/event.type';

export interface IEventRepository {
  getAll(filters?: EventFilter): Promise<BaseEvent[]>;
  getById(id: string): Promise<BaseEvent | null>;
  getBySlug(slug: string): Promise<BaseEvent | null>;
  getFeatured(): Promise<BaseEvent[]>;
  getUpcoming(): Promise<BaseEvent[]>;
}

export class MockEventRepository implements IEventRepository {
  private events: BaseEvent[] = [];

  constructor() {
    this.events = [];
  }

  setEvents(events: BaseEvent[]): void {
    this.events = events;
  }

  async getAll(filters?: EventFilter): Promise<BaseEvent[]> {
    let filtered = [...this.events];

    if (filters) {
      if (filters.status) {
        filtered = filtered.filter((e) => e.status === filters.status);
      }
      if (filters.featured) {
        filtered = filtered.filter((e) => e.featured);
      }
      if (filters.location) {
        filtered = filtered.filter((e) =>
          e.location.city.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }
      if (filters.tags && filters.tags.length > 0) {
        filtered = filtered.filter((e) =>
          filters.tags!.some((tag) => e.tags.includes(tag))
        );
      }
    }

    return filtered;
  }

  async getById(id: string): Promise<BaseEvent | null> {
    return this.events.find((e) => e.id === id) || null;
  }

  async getBySlug(slug: string): Promise<BaseEvent | null> {
    return this.events.find((e) => e.slug === slug) || null;
  }

  async getFeatured(): Promise<BaseEvent[]> {
    return this.events.filter((e) => e.featured && e.status === 'upcoming');
  }

  async getUpcoming(): Promise<BaseEvent[]> {
    return this.events.filter((e) => e.status === 'upcoming');
  }
}