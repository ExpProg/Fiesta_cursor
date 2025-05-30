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
      event_responses: {
        Row: EventResponse;
        Insert: EventResponseInsert;
        Update: EventResponseUpdate;
      };
    };
    Views: {
      events_with_host: {
        Row: EventWithHost;
      };
    };
    Functions: {
      search_events: {
        Args: {
          search_query?: string;
          event_date?: string;
          location_filter?: string;
          category_filter?: string;
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
      response_status: ResponseStatus;
    };
  };
}

// Enum типы
export type ResponseStatus = 'attending' | 'not_attending' | 'maybe';

// Таблица users
export interface DatabaseUser {
  id: string;
  telegram_id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  language_code: string | null;
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
  date: string;
  event_time: string | null;
  location: string | null;
  map_url: string | null;
  max_participants: number | null;
  current_participants: number;
  status: 'active' | 'completed' | 'cancelled';
  created_by: number;
  host_id: number | null;
  gradient_background: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseEventInsert {
  title: string;
  description?: string | null;
  image_url?: string | null;
  date: string;
  event_time?: string | null;
  location?: string | null;
  map_url?: string | null;
  max_participants?: number | null;
  status?: 'active' | 'completed' | 'cancelled';
  created_by: number;
  host_id?: number | null;
  gradient_background?: string | null;
  is_private?: boolean;
}

export interface DatabaseEventUpdate {
  title?: string;
  description?: string | null;
  image_url?: string | null;
  date?: string;
  event_time?: string | null;
  location?: string | null;
  map_url?: string | null;
  max_participants?: number | null;
  status?: 'active' | 'completed' | 'cancelled';
  host_id?: number | null;
  gradient_background?: string | null;
  is_private?: boolean;
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

// Результаты функций
export interface SearchEventResult {
  id: string;
  title: string;
  description: string;
  date: string;
  event_time: string;
  location: string;
  max_participants: number;
  current_participants: number;
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
  total_events_attended: number;
  upcoming_events: number;
  upcoming_participations: number;
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

// Форматы для создания/обновления
export interface CreateEventData {
  title: string;
  description?: string;
  image_url?: string;
  date: string;
  event_time?: string | null;
  location?: string;
  map_url?: string;
  max_participants?: number;
  host_id?: number;
  is_private?: boolean;
  invited_users?: InvitedUser[];
}

export interface UpdateEventData extends Partial<CreateEventData> {
  is_active?: boolean;
  is_featured?: boolean;
}

// Поисковые параметры
export interface SearchEventsParams {
  query?: string;
  date?: string;
  location?: string;
  category?: string;

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

export interface EventRealtimeEvent extends RealtimeEvent<DatabaseEvent> {}
export interface EventResponseRealtimeEvent extends RealtimeEvent<EventResponse> {}

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
    maxParticipants: { min: 1; max: 10000 };
  };
  user: {
    firstName: { min: 1; max: 50 };
    lastName: { max: 50 };
    bio: { max: 500 };
  };
}

// Таблица event_responses - отклики на мероприятия
export interface EventResponse {
  id: string;
  event_id: string;
  user_telegram_id: number;
  user_first_name: string;
  user_last_name: string | null;
  user_username: string | null;
  response_status: ResponseStatus;
  created_at: string;
  updated_at: string;
}

export interface EventResponseInsert {
  id?: string;
  event_id: string;
  user_telegram_id: number;
  user_first_name: string;
  user_last_name?: string | null;
  user_username?: string | null;
  response_status: ResponseStatus;
  created_at?: string;
  updated_at?: string;
}

export interface EventResponseUpdate {
  response_status?: ResponseStatus;
  updated_at?: string;
}

// Интерфейс для участника мероприятия
export interface EventParticipant {
  telegram_id: number;
  first_name: string;
  last_name: string | null;
  username: string | null;
  response_status: ResponseStatus;
  responded_at: string;
  display_name?: string;
}

// Новые типы для приглашений
export interface EventInvitation {
  id: string;
  event_id: string;
  invited_by_telegram_id: number;
  invited_telegram_id: number;
  invited_first_name: string;
  invited_last_name: string | null;
  invited_username: string | null;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface InvitedUser {
  telegram_id: number;
  first_name: string;
  last_name?: string | null;
  username?: string | null;
}

export interface DatabaseEventResponse {
  id: string;
  event_id: string;
  user_telegram_id: number;
  response_status: ResponseStatus;
  created_at: string;
  updated_at: string;
} 