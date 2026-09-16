export type RegistrationStep = 'personal' | 'race';

export interface PersonalInfo {
  nombre: string;
  paterno: string;
  materno?: string;
  sexo: 'masculino' | 'femenino' | 'otro';
  nacimiento: string;
  email: string;
  confirmEmail: string;
  telefono: string;
  pais: string;
  estado: string;
  cp: string;
}

export interface RaceInfo {
  distanceId: string;
  category: string;
  estimatedTime: string;
  team?: string;
  shirtSize: 'S' | 'M' | 'L' | 'XL';
}

export interface RegistrationData {
  eventId: string;
  personalInfo: PersonalInfo;
  raceInfo: RaceInfo;
  currentStep: RegistrationStep;
}

export interface Distance {
  id: string;
  name: string;
  description: string;
}

export interface Category {
  value: string;
  label: string;
  minAge: number;
  maxAge: number;
}

export const DISTANCES: Distance[] = [
  { id: '5k', name: '5K', description: 'Recreativa' },
  { id: '10k', name: '10K', description: 'Competitiva' },
  { id: '42k', name: '42K', description: 'Maratón' },
];

export const CATEGORIES: Category[] = [
  { value: 'juvenil', label: 'Juvenil (15-19 años)', minAge: 15, maxAge: 19 },
  { value: 'libre', label: 'Libre (20-39 años)', minAge: 20, maxAge: 39 },
  { value: 'master', label: 'Master (40-49 años)', minAge: 40, maxAge: 49 },
  { value: 'veteranos', label: 'Veteranos (50+ años)', minAge: 50, maxAge: 99 },
];

export const SHIRT_SIZES = ['S', 'M', 'L', 'XL'] as const;
