export { EventService, MockEventRepository } from '@features/events';
export type { IEventService, IEventRepository, BaseEvent, EventFilter } from '@features/events';

export { AuthService, MockAuthRepository } from '@features/auth';
export type { IAuthService, IAuthRepository, User, AuthSession, LoginCredentials, RegisterData } from '@features/auth';

export interface AppServices {
  events: IEventService;
  auth: IAuthService;
}

export function createAppServices(): AppServices {
  const eventRepository = new MockEventRepository();
  const authRepository = new MockAuthRepository();

  return {
    events: new EventService(eventRepository),
    auth: new AuthService(authRepository),
  };
}