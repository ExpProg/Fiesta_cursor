// Базовые типы для базы данных
export interface Database {
  public: {
    Tables: {
      users: {
        Row: DatabaseUser;
        Insert: DatabaseUserInsert;
        Update: DatabaseUserUpdate;
      };
      events: {
        Row: DatabaseEvent;
        Insert: DatabaseEventInsert;
        Update: DatabaseEventUpdate;
      };
      bookings: {
        Row: DatabaseBooking;
        Insert: DatabaseBookingInsert;
        Update: DatabaseBookingUpdate;
      };
      payments: {
        Row: DatabasePayment;
        Insert: DatabasePaymentInsert;
        Update: DatabasePaymentUpdate;
      };
    };
    Views: {
      events_with_host: {
        Row: EventWithHost;
      };
      bookings_with_details: {
        Row: BookingWithDetails;
      };
    };
    Functions: {
      search_events: {
        Args: {
          search_query?: string;
          event_date?: string;
          location_filter?: string;
          category_filter?: string;
          min_price?: number;
          max_price?: number;
          limit_count?: number;
          offset_count?: number;
        };
        Returns: SearchEventResult[];
      };
      get_user_stats: {
        Args: {
          user_telegram_id: number;
        };
        Returns: UserStats[];
      };
    };
    Enums: {
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
    };
  };
}

// Enum типы
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'telegram_stars' | 'wallet';

// Таблица users
export interface DatabaseUser {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string;
  last_name: string | null;
  language_code: string;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
  bio: string | null;
  is_premium: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseUserInsert {
  id?: string;
  telegram_id: number;
  username?: string | null;
  first_name: string;
  last_name?: string | null;
  language_code?: string;
  avatar_url?: string | null;
  phone?: string | null;
  email?: string | null;
  bio?: string | null;
  is_premium?: boolean;
  is_verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseUserUpdate {
  telegram_id?: number;
  username?: string | null;
  first_name?: string;
  last_name?: string | null;
  language_code?: string;
  avatar_url?: string | null;
  phone?: string | null;
  email?: string | null;
  bio?: string | null;
  is_premium?: boolean;
  is_verified?: boolean;
  updated_at?: string;
}

// Таблица events - обновленная структура
export interface DatabaseEvent {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  date: string; // TIMESTAMP WITH TIME ZONE - изменено с event_date на date
  event_time: string | null; // TIME - добавлено поле event_time
  location: string | null;
  max_participants: number | null;
  current_participants: number;
  price: number;
  created_by: number; // telegram_id создателя
  created_at: string;
  updated_at: string;
  status: 'active' | 'cancelled' | 'completed' | 'draft';
}

export interface DatabaseEventInsert {
  id?: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  date: string; // изменено с event_date на date
  event_time?: string | null; // добавлено поле event_time
  location?: string | null;
  max_participants?: number | null;
  current_participants?: number;
  price?: number;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  status?: 'active' | 'cancelled' | 'completed' | 'draft';
}

export interface DatabaseEventUpdate {
  title?: string;
  description?: string | null;
  image_url?: string | null;
  date?: string; // изменено с event_date на date
  event_time?: string | null; // добавлено поле event_time
  location?: string | null;
  max_participants?: number | null;
  current_participants?: number;
  price?: number;
  status?: 'active' | 'cancelled' | 'completed' | 'draft';
  updated_at?: string;
}

// Таблица bookings
export interface DatabaseBooking {
  id: string;
  event_id: string;
  user_id: string;
  guests_count: number;
  total_amount: number;
  status: BookingStatus;
  special_requests: string | null;
  booking_code: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DatabaseBookingInsert {
  id?: string;
  event_id: string;
  user_id: string;
  guests_count: number;
  total_amount: number;
  status?: BookingStatus;
  special_requests?: string | null;
  booking_code?: string;
  confirmed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface DatabaseBookingUpdate {
  guests_count?: number;
  total_amount?: number;
  status?: BookingStatus;
  special_requests?: string | null;
  confirmed_at?: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  metadata?: Record<string, any>;
  updated_at?: string;
}

// Таблица payments
export interface DatabasePayment {
  id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  stripe_payment_intent_id: string | null;
  telegram_payment_charge_id: string | null;
  wallet_transaction_hash: string | null;
  payment_data: Record<string, any>;
  failure_reason: string | null;
  refund_amount: number;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabasePaymentInsert {
  id?: string;
  booking_id: string;
  amount: number;
  currency?: string;
  status?: PaymentStatus;
  payment_method: PaymentMethod;
  stripe_payment_intent_id?: string | null;
  telegram_payment_charge_id?: string | null;
  wallet_transaction_hash?: string | null;
  payment_data?: Record<string, any>;
  failure_reason?: string | null;
  refund_amount?: number;
  refunded_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DatabasePaymentUpdate {
  amount?: number;
  currency?: string;
  status?: PaymentStatus;
  stripe_payment_intent_id?: string | null;
  telegram_payment_charge_id?: string | null;
  wallet_transaction_hash?: string | null;
  payment_data?: Record<string, any>;
  failure_reason?: string | null;
  refund_amount?: number;
  refunded_at?: string | null;
  updated_at?: string;
}

// Представления (Views)
export interface EventWithHost extends DatabaseEvent {
  host_first_name: string;
  host_last_name: string | null;
  host_username: string | null;
  host_avatar_url: string | null;
  host_is_verified: boolean;
}

export interface BookingWithDetails extends DatabaseBooking {
  event_title: string;
  event_date: string;
  event_time: string;
  event_location: string;
  event_image_url: string | null;
  user_first_name: string;
  user_last_name: string | null;
  user_username: string | null;
  user_avatar_url: string | null;
  host_first_name: string;
  host_last_name: string | null;
  host_username: string | null;
}

// Результаты функций
export interface SearchEventResult {
  id: string;
  title: string;
  description: string;
  date: string;
  event_time: string;
  location: string;
  max_guests: number;
  current_guests: number;
  price_per_person: number;
  image_url: string | null;
  category: string | null;
  tags: string[] | null;
  host_first_name: string;
  host_last_name: string | null;
  host_username: string | null;
  host_avatar_url: string | null;
  created_at: string;
}

export interface UserStats {
  total_events_hosted: number;
  total_bookings_made: number;
  total_amount_spent: number;
  total_amount_earned: number;
  upcoming_events: number;
  upcoming_bookings: number;
}

// Прикладные типы для компонентов
export interface User extends Omit<DatabaseUser, 'created_at' | 'updated_at'> {
  created_at: Date;
  updated_at: Date;
}

export interface Event extends Omit<DatabaseEvent, 'created_at' | 'updated_at' | 'date'> {
  created_at: Date;
  updated_at: Date;
  date: Date;
}

export interface Booking extends Omit<DatabaseBooking, 'created_at' | 'updated_at' | 'confirmed_at' | 'cancelled_at'> {
  created_at: Date;
  updated_at: Date;
  confirmed_at: Date | null;
  cancelled_at: Date | null;
}

export interface Payment extends Omit<DatabasePayment, 'created_at' | 'updated_at' | 'refunded_at'> {
  created_at: Date;
  updated_at: Date;
  refunded_at: Date | null;
}

// Форматы для создания/обновления
export interface CreateEventData {
  title: string;
  description?: string;
  image_url?: string;
  date: string; // ISO string format - изменено с event_date на date
  location?: string;
  max_participants?: number;
  price?: number;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  is_active?: boolean;
  is_featured?: boolean;
}

export interface CreateBookingData {
  event_id: string;
  guests_count: number;
  special_requests?: string;
}

export interface UpdateBookingData {
  guests_count?: number;
  total_amount?: number;
  status?: BookingStatus;
  special_requests?: string;
  cancellation_reason?: string;
}

export interface CreatePaymentData {
  booking_id: string;
  amount: number;
  payment_method: PaymentMethod;
  currency?: string;
  payment_data?: Record<string, any>;
}

export interface UpdatePaymentData {
  status?: PaymentStatus;
  stripe_payment_intent_id?: string;
  telegram_payment_charge_id?: string;
  wallet_transaction_hash?: string;
  payment_data?: Record<string, any>;
  failure_reason?: string;
  refund_amount?: number;
}

// Поисковые параметры
export interface SearchEventsParams {
  query?: string;
  date?: string;
  location?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
  offset?: number;
}

// Ошибки API
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// Результаты API
export interface ApiResponse<T> {
  data: T | null;
  error: SupabaseError | null;
  count?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Real-time события
export interface RealtimeEvent<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T | null;
  old: T | null;
  table: string;
  schema: string;
  commit_timestamp: string;
}

export interface BookingRealtimeEvent extends RealtimeEvent<DatabaseBooking> {}
export interface PaymentRealtimeEvent extends RealtimeEvent<DatabasePayment> {}
export interface EventRealtimeEvent extends RealtimeEvent<DatabaseEvent> {}

// Типы для подписок
export interface SubscriptionOptions {
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema?: string;
  table?: string;
  filter?: string;
}

// Утилитарные типы
export type TableName = keyof Database['public']['Tables'];
export type ViewName = keyof Database['public']['Views'];
export type FunctionName = keyof Database['public']['Functions'];

// Константы категорий событий
export const EVENT_CATEGORIES = [
  'party',
  'concert',
  'festival',
  'club',
  'bar',
  'restaurant',
  'outdoor',
  'indoor',
  'birthday',
  'wedding',
  'corporate',
  'networking',
  'art',
  'music',
  'dance',
  'food',
  'drinks',
  'sports',
  'games',
  'tech',
  'business',
  'education',
  'charity',
  'cultural',
  'seasonal',
  'holiday',
  'other'
] as const;

export type EventCategory = typeof EVENT_CATEGORIES[number];

// Константы валют
export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'RUB',
  'UAH',
  'KZT',
  'BYN',
  'GBP',
  'CAD',
  'AUD',
  'JPY',
  'CNY'
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

// Валидационные схемы (совместимы с Zod)
export interface ValidationSchema {
  event: {
    title: { min: 3; max: 100 };
    description: { min: 10; max: 2000 };
    location: { min: 3; max: 200 };
    maxGuests: { min: 1; max: 10000 };
    pricePerPerson: { min: 0; max: 100000 };
  };
  booking: {
    guestsCount: { min: 1; max: 50 };
    specialRequests: { max: 500 };
  };
  user: {
    firstName: { min: 1; max: 50 };
    lastName: { max: 50 };
    bio: { max: 500 };
  };
} 