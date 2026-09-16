import type { AuthSession, LoginCredentials, RegisterData, User } from '../types/auth.type';
import type { IAuthRepository } from './AuthRepository';

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  register(data: RegisterData): Promise<AuthSession>;
  logout(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  getCurrentUser(): Promise<User | null>;
  isAuthenticated(): Promise<boolean>;
}

export class AuthService implements IAuthService {
  constructor(private readonly repository: IAuthRepository) {}

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    return this.repository.login(credentials);
  }

  async register(data: RegisterData): Promise<AuthSession> {
    return this.repository.register(data);
  }

  async logout(): Promise<void> {
    return this.repository.logout();
  }

  async getSession(): Promise<AuthSession | null> {
    return this.repository.getSession();
  }

  async getCurrentUser(): Promise<User | null> {
    return this.repository.getCurrentUser();
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.repository.getSession();
    return session !== null;
  }
}