import type { AuthSession, LoginCredentials, RegisterData, User } from '../types/auth.type';

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  register(data: RegisterData): Promise<AuthSession>;
  logout(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  getCurrentUser(): Promise<User | null>;
}

export class MockAuthRepository implements IAuthRepository {
  private currentUser: User | null = null;
  private token: string | null = null;

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const user: User = {
      id: 'user-001',
      email: credentials.email,
      firstName: 'John',
      lastName: 'Doe',
      role: 'participant',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.currentUser = user;
    this.token = 'mock-jwt-token';

    return {
      user,
      token: this.token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async register(data: RegisterData): Promise<AuthSession> {
    await new Promise((resolve) => setTimeout(resolve, 800));

    const user: User = {
      id: 'user-' + Date.now(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || 'participant',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.currentUser = user;
    this.token = 'mock-jwt-token-new';

    return {
      user,
      token: this.token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    this.token = null;
  }

  async getSession(): Promise<AuthSession | null> {
    if (!this.currentUser || !this.token) {
      return null;
    }

    return {
      user: this.currentUser,
      token: this.token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }
}