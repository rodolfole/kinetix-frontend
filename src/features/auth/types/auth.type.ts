export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'participant' | 'organizer' | 'admin';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizerProfile = {
  id: string;
  userId: string;
  organizationName: string;
  logo?: string;
  website?: string;
  description?: string;
  verified: boolean;
  eventsOrganized: number;
};

export type AuthSession = {
  user: User;
  token: string;
  expiresAt: string;
};

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'participant' | 'organizer';
};