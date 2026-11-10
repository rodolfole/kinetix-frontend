export interface PersonalInfo {
  first_name: string;
  last_name: string;
  second_last_name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone: string;
  email: string;
}

export interface RaceInfo {
  event_id: string;
  distance_id: string;
  bib_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface RegistrationPayload extends PersonalInfo, RaceInfo {
  t_shirt_size?: string;
  medical_conditions?: string;
}

export interface RegistrationResult {
  id: string;
  status: string;
  bib_number?: string;
}
