export interface User {
  id: string;
  telegram_id: number;
  username?: string;
  first_name: string;
  last_name?: string;
  language_code?: string;
  created_at: string;
  updated_at: string;
}

export interface Party {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  max_participants: number;
  current_participants: number;
  price_per_person: number;
  image_url?: string;
  host_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Booking {
  id: string;
  party_id: string;
  user_id: string;
  guests_count: number;
  total_amount: number;
  status: BookingStatus;
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export interface BookingFormData {
  guests_count: number;
  special_requests?: string;
}

export interface PartyFormData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  max_participants: number;
  price_per_person: number;
  image_url?: string;
}

// Экспортируем типы Telegram из отдельного файла
export * from './telegram'; 