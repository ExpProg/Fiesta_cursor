import { supabase } from '@/hooks/useSupabase';
import type { 
  DatabaseEvent, 
  DatabaseEventInsert, 
  DatabaseEventUpdate,
  ApiResponse,
  PaginatedResponse,
  SearchEventsParams,
  SearchEventResult,
  EventWithHost,
  Event,
  CreateEventData,
  UpdateEventData
} from '@/types/database';

/**
 * Сервис для работы с событиями
 */
export class EventService {
  /**
   * Получить событие по ID
   */
  static async getById(id: string): Promise<ApiResponse<DatabaseEvent>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить событие' } 
      };
    }
  }

  /**
   * Получить событие с информацией о хосте
   */
  static async getByIdWithHost(id: string): Promise<ApiResponse<EventWithHost>> {
    try {
      const { data, error } = await supabase
        .from('events_with_host')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching event with host by ID:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить событие' } 
      };
    }
  }

  /**
   * Создать новое событие
   */
  static async create(eventData: CreateEventData, hostId: string): Promise<ApiResponse<DatabaseEvent>> {
    try {
      const insertData: DatabaseEventInsert = {
        ...eventData,
        host_id: hostId,
      };

      const { data, error } = await supabase
        .from('events')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating event:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось создать событие' } 
      };
    }
  }

  /**
   * Обновить событие
   */
  static async update(id: string, updates: UpdateEventData): Promise<ApiResponse<DatabaseEvent>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating event:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось обновить событие' } 
      };
    }
  }

  /**
   * Удалить событие
   */
  static async delete(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Error deleting event:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось удалить событие' } 
      };
    }
  }

  /**
   * Получить активные события с пагинацией
   */
  static async getActiveEvents(
    page: number = 1, 
    limit: number = 20,
    orderBy: 'date' | 'created_at' | 'price_per_person' = 'date'
  ): Promise<PaginatedResponse<EventWithHost>> {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('events_with_host')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .gte('date', new Date().toISOString().split('T')[0]) // События начиная с сегодня
        .range(offset, offset + limit - 1)
        .order(orderBy, { ascending: true });

      if (error) {
        throw error;
      }

      const totalPages = Math.ceil((count || 0) / limit);

      return { 
        data: data || [], 
        error: null, 
        count: count || 0,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching active events:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить события' },
        count: 0,
        page,
        limit,
        totalPages: 0
      };
    }
  }

  /**
   * Получить события пользователя (хоста)
   */
  static async getUserEvents(hostId: string): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('host_id', hostId)
        .order('date', { ascending: false });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching user events:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить события пользователя' } 
      };
    }
  }

  /**
   * Поиск событий
   */
  static async searchEvents(params: SearchEventsParams): Promise<ApiResponse<SearchEventResult[]>> {
    try {
      const { data, error } = await supabase.rpc('search_events', {
        search_query: params.query || '',
        event_date: params.date || null,
        location_filter: params.location || '',
        category_filter: params.category || '',
        min_price: params.minPrice || 0,
        max_price: params.maxPrice || 999999,
        limit_count: params.limit || 20,
        offset_count: params.offset || 0
      });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error searching events:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось найти события' } 
      };
    }
  }

  /**
   * Получить популярные события
   */
  static async getPopularEvents(limit: number = 10): Promise<ApiResponse<EventWithHost[]>> {
    try {
      const { data, error } = await supabase
        .from('events_with_host')
        .select('*')
        .eq('is_active', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('current_guests', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching popular events:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить популярные события' } 
      };
    }
  }

  /**
   * Получить рекомендуемые события
   */
  static async getFeaturedEvents(limit: number = 10): Promise<ApiResponse<EventWithHost[]>> {
    try {
      const { data, error } = await supabase
        .from('events_with_host')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(limit);

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching featured events:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить рекомендуемые события' } 
      };
    }
  }

  /**
   * Получить события по категории
   */
  static async getEventsByCategory(
    category: string, 
    limit: number = 20
  ): Promise<ApiResponse<EventWithHost[]>> {
    try {
      const { data, error } = await supabase
        .from('events_with_host')
        .select('*')
        .eq('is_active', true)
        .eq('category', category)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(limit);

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching events by category:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить события по категории' } 
      };
    }
  }

  /**
   * Получить события по местоположению
   */
  static async getEventsByLocation(
    location: string, 
    limit: number = 20
  ): Promise<ApiResponse<EventWithHost[]>> {
    try {
      const { data, error } = await supabase
        .from('events_with_host')
        .select('*')
        .eq('is_active', true)
        .ilike('location', `%${location}%`)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(limit);

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching events by location:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить события по местоположению' } 
      };
    }
  }

  /**
   * Получить события в ценовом диапазоне
   */
  static async getEventsByPriceRange(
    minPrice: number, 
    maxPrice: number, 
    limit: number = 20
  ): Promise<ApiResponse<EventWithHost[]>> {
    try {
      const { data, error } = await supabase
        .from('events_with_host')
        .select('*')
        .eq('is_active', true)
        .gte('price_per_person', minPrice)
        .lte('price_per_person', maxPrice)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('price_per_person', { ascending: true })
        .limit(limit);

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching events by price range:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить события по ценовому диапазону' } 
      };
    }
  }

  /**
   * Получить ближайшие события
   */
  static async getUpcomingEvents(limit: number = 20): Promise<ApiResponse<EventWithHost[]>> {
    try {
      const { data, error } = await supabase
        .from('events_with_host')
        .select('*')
        .eq('is_active', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(limit);

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить ближайшие события' } 
      };
    }
  }

  /**
   * Деактивировать событие
   */
  static async deactivate(id: string): Promise<ApiResponse<DatabaseEvent>> {
    return this.update(id, { is_active: false });
  }

  /**
   * Активировать событие
   */
  static async activate(id: string): Promise<ApiResponse<DatabaseEvent>> {
    return this.update(id, { is_active: true });
  }

  /**
   * Отметить событие как рекомендуемое
   */
  static async setFeatured(id: string, featured: boolean): Promise<ApiResponse<DatabaseEvent>> {
    return this.update(id, { is_featured: featured });
  }

  /**
   * Обновить изображение события
   */
  static async updateImage(id: string, imageUrl: string): Promise<ApiResponse<DatabaseEvent>> {
    return this.update(id, { image_url: imageUrl });
  }

  /**
   * Добавить дополнительные изображения
   */
  static async addImages(id: string, imageUrls: string[]): Promise<ApiResponse<DatabaseEvent>> {
    try {
      // Сначала получаем текущие изображения
      const eventResponse = await this.getById(id);
      if (eventResponse.error || !eventResponse.data) {
        return { data: null, error: eventResponse.error };
      }

      const currentImages = eventResponse.data.images || [];
      const updatedImages = [...currentImages, ...imageUrls];

      return this.update(id, { images: updatedImages });
    } catch (error) {
      console.error('Error adding images to event:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось добавить изображения' } 
      };
    }
  }

  /**
   * Получить доступные категории
   */
  static async getCategories(): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('category')
        .not('category', 'is', null)
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      // Получаем уникальные категории
      const categories = [...new Set(data?.map(event => event.category).filter(Boolean))];

      return { data: categories as string[], error: null };
    } catch (error) {
      console.error('Error fetching categories:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить категории' } 
      };
    }
  }

  /**
   * Получить доступные локации
   */
  static async getLocations(): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('location')
        .eq('is_active', true);

      if (error) {
        throw error;
      }

      // Получаем уникальные локации
      const locations = [...new Set(data?.map(event => event.location).filter(Boolean))];

      return { data: locations as string[], error: null };
    } catch (error) {
      console.error('Error fetching locations:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить локации' } 
      };
    }
  }

  /**
   * Проверить доступность мест на событии
   */
  static async checkAvailability(eventId: string, requestedGuests: number): Promise<boolean> {
    try {
      const eventResponse = await this.getById(eventId);
      if (eventResponse.error || !eventResponse.data) {
        return false;
      }

      const event = eventResponse.data;
      const availableSpots = event.max_guests - event.current_guests;
      
      return availableSpots >= requestedGuests;
    } catch (error) {
      console.error('Error checking event availability:', error);
      return false;
    }
  }

  /**
   * Конвертировать DatabaseEvent в Event (с преобразованием дат)
   */
  static convertToEvent(dbEvent: DatabaseEvent): Event {
    return {
      ...dbEvent,
      date: new Date(dbEvent.date),
      created_at: new Date(dbEvent.created_at),
      updated_at: new Date(dbEvent.updated_at),
    };
  }

  /**
   * Конвертировать массив DatabaseEvent в Event[]
   */
  static convertToEvents(dbEvents: DatabaseEvent[]): Event[] {
    return dbEvents.map(this.convertToEvent);
  }

  /**
   * Валидация данных события
   */
  static validateEventData(eventData: CreateEventData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!eventData.title || eventData.title.length < 3) {
      errors.push('Название события должно содержать не менее 3 символов');
    }

    if (!eventData.description || eventData.description.length < 10) {
      errors.push('Описание события должно содержать не менее 10 символов');
    }

    if (!eventData.location || eventData.location.length < 3) {
      errors.push('Местоположение должно содержать не менее 3 символов');
    }

    if (eventData.max_guests < 1 || eventData.max_guests > 10000) {
      errors.push('Количество гостей должно быть от 1 до 10000');
    }

    if (eventData.price_per_person < 0) {
      errors.push('Цена не может быть отрицательной');
    }

    const eventDate = new Date(eventData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      errors.push('Дата события не может быть в прошлом');
    }

    if (eventData.min_age && eventData.max_age && eventData.min_age > eventData.max_age) {
      errors.push('Минимальный возраст не может быть больше максимального');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Экспортируем экземпляр для удобства
export const eventService = EventService; 