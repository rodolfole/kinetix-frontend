import type { BaseEvent, EventFilter } from '@features/events/types/event.type';
import type { IEventRepository } from './EventRepository';

export interface IEventService {
  getAllEvents(filters?: EventFilter): Promise<BaseEvent[]>;
  getEventById(id: string): Promise<BaseEvent | null>;
  getEventBySlug(slug: string): Promise<BaseEvent | null>;
  getFeaturedEvents(): Promise<BaseEvent[]>;
  getUpcomingEvents(): Promise<BaseEvent[]>;
}

export class EventService implements IEventService {
  constructor(private readonly repository: IEventRepository) {}

  async getAllEvents(filters?: EventFilter): Promise<BaseEvent[]> {
    return this.repository.getAll(filters);
  }

  async getEventById(id: string): Promise<BaseEvent | null> {
    return this.repository.getById(id);
  }

  async getEventBySlug(slug: string): Promise<BaseEvent | null> {
    return this.repository.getBySlug(slug);
  }

  async getFeaturedEvents(): Promise<BaseEvent[]> {
    return this.repository.getFeatured();
  }

  async getUpcomingEvents(): Promise<BaseEvent[]> {
    return this.repository.getUpcoming();
  }
}