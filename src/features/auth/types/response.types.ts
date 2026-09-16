export type UserClaims = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  second_last_name?: string;
  phone?: string;
  birth_date?: string;
  role: 'participant' | 'organizer' | 'admin';
  organizer_id?: string;
  participant_id?: string;
};

export type RegisterResponse = {
  user: UserClaims;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
};

export type LoginResponse = {
  user: UserClaims;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
};

export type RefreshResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};