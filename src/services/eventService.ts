import { supabase } from '@/hooks/useSupabase';
import { generateRandomGradient } from '@/utils/gradients';
import { InvitationService } from './invitationService';
import type { 
  DatabaseEvent, 
  DatabaseEventInsert, 
  DatabaseEventUpdate,
  ApiResponse,
  Event,
  CreateEventData 
} from '@/types/database';

/**
 * Сервис для работы с мероприятиями
 */
export class EventService {
  /**
   * Получить мероприятие по ID
   */
  static async getById(id: string): Promise<ApiResponse<DatabaseEvent>> {
    try {
      console.log(`🔍 EventService.getById searching for ID: ${id}`);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Supabase error in getById:', error);
        throw error;
      }

      if (error && error.code === 'PGRST116') {
        console.log(`ℹ️ No event found with id: ${id}`);
        return { data: null, error: null };
      }

      console.log(`✅ Found event with id: ${id}`);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error fetching event by ID:', error);
      return { 
        data: null, 
        error: { message: `Не удалось получить мероприятие: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Создать новое мероприятие
   */
  static async create(eventData: CreateEventData, createdBy: number): Promise<ApiResponse<DatabaseEvent>> {
    try {
      console.log('📝 EventService.create attempting to create event:', eventData);
      
      // Извлекаем время из даты для поля event_time
      const eventDate = new Date(eventData.date);
      const hours = eventDate.getHours().toString().padStart(2, '0');
      const minutes = eventDate.getMinutes().toString().padStart(2, '0');
      const seconds = eventDate.getSeconds().toString().padStart(2, '0');
      const eventTime = `${hours}:${minutes}:${seconds}`; // формат HH:MM:SS для TIME поля
      
      // Обработка времени окончания
      let endDate = null;
      let endTime = null;
      
      if (eventData.end_date) {
        endDate = eventData.end_date;
      }
      
      if (eventData.end_time) {
        endTime = `${eventData.end_time}:00`; // добавляем секунды для формата HH:MM:SS
      }
      
      const newEvent: DatabaseEventInsert = {
        title: eventData.title,
        description: eventData.description || null,
        image_url: eventData.image_url || null,
        gradient_background: eventData.image_url ? null : generateRandomGradient(),
        date: eventData.date,
        event_time: eventTime, // добавляем время из даты
        end_date: endDate,
        end_time: endTime,
        location: eventData.location || null, // обеспечиваем null вместо undefined
        map_url: eventData.map_url || null, // добавляем ссылку на карту
        max_participants: eventData.max_participants || null,
        created_by: createdBy,
        host_id: eventData.host_id || null,
        status: 'active',
        is_private: eventData.is_private || false
      };

      console.log('📝 Event data prepared with times:', { eventTime, endDate, endTime, newEvent });

      const { data, error } = await supabase
        .from('events')
        .insert(newEvent)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error in create:', error);
        throw error;
      }

      // Если это частное мероприятие и есть приглашенные, создаем приглашения
      if (eventData.is_private && eventData.invited_users && eventData.invited_users.length > 0) {
        console.log('📧 Creating invitations for private event:', eventData.invited_users.length);
        
        const invitationResult = await InvitationService.createInvitations(
          data.id,
          createdBy,
          eventData.invited_users
        );

        if (invitationResult.error) {
          console.warn('⚠️ Error creating invitations:', invitationResult.error);
          // Не останавливаем процесс создания мероприятия из-за ошибки приглашений
        }
      }

      console.log('✅ Event created successfully:', data?.id);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error creating event:', error);
      return { 
        data: null, 
        error: { message: `Не удалось создать мероприятие: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Обновить мероприятие
   */
  static async update(id: string, updates: DatabaseEventUpdate): Promise<ApiResponse<DatabaseEvent>> {
    try {
      console.log('🔄 EventService.update updating event:', { id, updates });
      
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error in update:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ No data returned from update');
        throw new Error('Мероприятие не найдено или не может быть обновлено');
      }

      console.log('✅ Event updated successfully:', data.id);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error updating event:', error);
      return { 
        data: null, 
        error: { message: `Не удалось обновить мероприятие: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Удалить мероприятие
   */
  static async delete(id: string): Promise<ApiResponse<null>> {
    try {
      console.log('🗑️ EventService.delete deleting event:', id);
      
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Supabase error in delete:', error);
        throw error;
      }

      console.log('✅ Event deleted successfully');
      return { data: null, error: null };
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      return { 
        data: null, 
        error: { message: `Не удалось удалить мероприятие: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Получить предстоящие мероприятия
   */
  static async getUpcoming(limit: number = 10): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log('🔍 EventService.getUpcoming fetching upcoming events');
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('❌ Supabase error in getUpcoming:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} upcoming events`);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error fetching upcoming events:', error);
      return { 
        data: null, 
        error: { message: `Не удалось получить предстоящие мероприятия: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Получить популярные мероприятия
   */
  static async getPopular(limit: number = 10): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log('🔍 EventService.getPopular fetching popular events');
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .gte('date', new Date().toISOString())
        .order('current_participants', { ascending: false })
        .order('date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('❌ Supabase error in getPopular:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} popular events`);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error fetching popular events:', error);
      return { 
        data: null, 
        error: { message: `Не удалось получить популярные мероприятия: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Поиск мероприятий
   */
  static async search(query: string, limit: number = 20): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log('🔍 EventService.search searching for:', query);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .gte('date', new Date().toISOString())
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`)
        .order('date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('❌ Supabase error in search:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} events matching query: ${query}`);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error searching events:', error);
      return { 
        data: null, 
        error: { message: `Не удалось найти мероприятия: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Получить мероприятия, созданные пользователем
   */
  static async getByCreator(telegramId: number, limit: number = 20): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log('🔍 EventService.getByCreator fetching events for user:', telegramId);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', telegramId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Supabase error in getByCreator:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} events created by user: ${telegramId}`);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error fetching user events:', error);
      return { 
        data: null, 
        error: { message: `Не удалось получить мероприятия пользователя: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Валидация данных мероприятия
   */
  static validateEventData(eventData: CreateEventData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!eventData.title || eventData.title.trim().length < 3) {
      errors.push('Название мероприятия должно содержать минимум 3 символа');
    }

    if (eventData.title && eventData.title.length > 255) {
      errors.push('Название мероприятия не должно превышать 255 символов');
    }

    if (eventData.description && eventData.description.length > 2000) {
      errors.push('Описание не должно превышать 2000 символов');
    }

    if (!eventData.date) {
      errors.push('Дата мероприятия обязательна');
    } else {
      const eventDate = new Date(eventData.date);
      const now = new Date();
      if (eventDate <= now) {
        errors.push('Дата мероприятия должна быть в будущем');
      }
    }

    if (eventData.max_participants !== undefined && eventData.max_participants < 1) {
      errors.push('Максимальное количество участников должно быть больше 0');
    }

    // Валидация времени окончания
    if (eventData.end_date) {
      const startDate = new Date(eventData.date);
      const endDate = new Date(eventData.end_date);
      
      if (endDate < startDate) {
        errors.push('Дата окончания не может быть раньше даты начала');
      }
    }

    if (eventData.end_time && !eventData.end_date) {
      // Если указано только время окончания без даты, проверяем что оно позже времени начала в тот же день
      const startDateTime = new Date(eventData.date);
      const startTime = startDateTime.getHours() * 60 + startDateTime.getMinutes();
      
      const [endHours, endMinutes] = eventData.end_time.split(':').map(Number);
      const endTime = endHours * 60 + endMinutes;
      
      if (endTime <= startTime) {
        errors.push('Время окончания должно быть позже времени начала');
      }
    }

    // Валидация для частных мероприятий
    if (eventData.is_private && eventData.invited_users && eventData.invited_users.length > 0) {
      // Проверяем каждого приглашенного пользователя только если они добавлены
      eventData.invited_users.forEach((user, index) => {
        if (!user.telegram_id || user.telegram_id <= 0) {
          errors.push(`Приглашенный пользователь #${index + 1}: некорректный Telegram ID`);
        }
        if (!user.first_name || user.first_name.trim().length === 0) {
          errors.push(`Приглашенный пользователь #${index + 1}: имя обязательно`);
        }
      });

      // Проверяем на дублирующиеся Telegram ID
      const telegramIds = eventData.invited_users.map(user => user.telegram_id);
      const uniqueIds = new Set(telegramIds);
      if (telegramIds.length !== uniqueIds.size) {
        errors.push('Найдены дублирующиеся Telegram ID в списке приглашенных');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Конвертировать DatabaseEvent в Event (с преобразованием дат)
   */
  static convertToEvent(dbEvent: DatabaseEvent): Event {
    return {
      ...dbEvent,
      created_at: new Date(dbEvent.created_at),
      updated_at: new Date(dbEvent.updated_at),
      date: new Date(dbEvent.date),
    };
  }

  /**
   * Конвертировать массив DatabaseEvent в Event[]
   */
  static convertToEvents(dbEvents: DatabaseEvent[]): Event[] {
    return dbEvents.map(this.convertToEvent);
  }

  /**
   * Получить сообщение об ошибке
   */
  private static getErrorMessage(error: any): string {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object') {
      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      } else if ('error' in error && typeof error.error === 'string') {
        return error.error;
      } else if ('details' in error && typeof error.details === 'string') {
        return error.details;
      }
    }
    
    return 'Неизвестная ошибка';
  }

  /**
   * Получить все мероприятия
   */
  static async getAll(limit: number = 5, offset: number = 0): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log(`🔍 EventService.getAll fetching events (limit: ${limit}, offset: ${offset})`);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false }) // Сортировка по дате создания (новые сначала)
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Supabase error in getAll:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} total events`);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error fetching all events:', error);
      return { 
        data: null, 
        error: { message: `Не удалось получить все мероприятия: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Получить доступные мероприятия (активные, в будущем, есть места)
   * Оптимизированная версия
   */
  static async getAvailable(limit: number = 5, offset: number = 0): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log(`🔍 EventService.getAvailable fetching available events (limit: ${limit}, offset: ${offset})`);
      
      // Используем оптимизированную RPC функцию
      const { data, error } = await supabase.rpc('get_available_events_optimized', {
        events_limit: limit,
        events_offset: offset
      });

      if (error) {
        console.error('❌ Supabase RPC error in getAvailable:', error);
        
        // Fallback к старому методу если RPC функция не существует
        return this.getAvailableLegacy(limit, offset);
      }

      console.log(`✅ Found ${data?.length || 0} available events (optimized)`);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error fetching available events (optimized):', error);
      
      // Fallback к старому методу
      return this.getAvailableLegacy(limit, offset);
    }
  }

  /**
   * Legacy метод getAvailable (для fallback)
   */
  private static async getAvailableLegacy(limit: number = 5, offset: number = 0): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log(`🔍 EventService.getAvailableLegacy (fallback) (limit: ${limit}, offset: ${offset})`);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .gte('date', new Date().toISOString())
        .order('created_at', { ascending: false }) // Сортировка по дате создания
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Supabase error in getAvailable:', error);
        throw error;
      }

      // Фильтруем мероприятия с доступными местами
      const availableEvents = (data || []).filter(event => {
        if (event.max_participants === null) return true; // Неограниченное количество
        return event.current_participants < event.max_participants;
      });

      console.log(`✅ Found ${availableEvents.length} available events (legacy)`);
      return { data: availableEvents, error: null };
    } catch (error) {
      console.error('❌ Error fetching available events (legacy):', error);
      return { 
        data: null, 
        error: { message: `Не удалось получить доступные мероприятия: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Получить мероприятия пользователя (на которые он откликнулся и которые еще не прошли + созданные им частные мероприятия)
   * Оптимизированная версия с одним запросом
   */
  static async getUserEvents(telegramId: number, limit: number = 5, offset: number = 0): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log(`🔍 EventService.getUserEvents fetching user events for: ${telegramId} (limit: ${limit}, offset: ${offset})`);
      
      // Используем один оптимизированный запрос с UNION для объединения результатов
      const { data, error } = await supabase.rpc('get_user_events_optimized', {
        user_telegram_id: telegramId,
        events_limit: limit,
        events_offset: offset
      });

      if (error) {
        console.error('❌ Supabase RPC error in getUserEvents:', error);
        
        // Fallback к старому методу если RPC функция не существует
        return this.getUserEventsLegacy(telegramId, limit, offset);
      }

      console.log(`✅ Found ${data?.length || 0} user events (optimized)`);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error fetching user events (optimized):', error);
      
      // Fallback к старому методу
      return this.getUserEventsLegacy(telegramId, limit, offset);
    }
  }

  /**
   * Получить архивные мероприятия пользователя (оптимизированная версия)
   */
  static async getUserArchive(telegramId: number, limit: number = 5, offset: number = 0): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log(`🔍 EventService.getUserArchive fetching archive events for: ${telegramId} (limit: ${limit}, offset: ${offset})`);
      
      // Используем один оптимизированный запрос с UNION
      const { data, error } = await supabase.rpc('get_user_archive_optimized', {
        user_telegram_id: telegramId,
        events_limit: limit,
        events_offset: offset
      });

      if (error) {
        console.error('❌ Supabase RPC error in getUserArchive:', error);
        
        // Fallback к старому методу если RPC функция не существует
        return this.getUserArchiveLegacy(telegramId, limit, offset);
      }

      console.log(`✅ Found ${data?.length || 0} archive events (optimized)`);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error fetching archive events (optimized):', error);
      
      // Fallback к старому методу
      return this.getUserArchiveLegacy(telegramId, limit, offset);
    }
  }

  /**
   * Legacy метод getUserEvents (для fallback)
   */
  private static async getUserEventsLegacy(telegramId: number, limit: number = 5, offset: number = 0): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log(`🔍 EventService.getUserEventsLegacy (fallback) for: ${telegramId} (limit: ${limit}, offset: ${offset})`);
      
      // Получаем ID событий, на которые пользователь откликнулся
      const { data: responses, error: responsesError } = await supabase
        .from('event_responses')
        .select('event_id')
        .eq('user_telegram_id', telegramId)
        .eq('response_status', 'attending');

      if (responsesError) {
        console.error('❌ Supabase error getting user responses:', responsesError);
        throw responsesError;
      }

      const eventIds = responses?.map(r => r.event_id) || [];
      console.log('📋 User responded to events:', eventIds);

      if (eventIds.length === 0) {
        // Если пользователь не откликнулся ни на одно мероприятие, 
        // показываем только созданные им частные мероприятия
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('created_by', telegramId)
          .eq('is_private', true)
          .gte('date', new Date().toISOString())
          .order('created_at', { ascending: false }) // Сортировка по дате создания
          .range(offset, offset + limit - 1);

        if (error) {
          console.error('❌ Supabase error in getUserEvents (no responses):', error);
          throw error;
        }

        console.log(`✅ Found ${data?.length || 0} user events (only created private)`);
        return { data: data || [], error: null };
      }

      // Получаем все мероприятия, на которые пользователь откликнулся
      const { data: respondedEvents, error: respondedError } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .gte('date', new Date().toISOString())
        .order('created_at', { ascending: false }); // Сортировка по дате создания

      if (respondedError) {
        console.error('❌ Supabase error getting responded events:', respondedError);
        throw respondedError;
      }

      // Получаем созданные пользователем частные мероприятия
      const { data: createdPrivateEvents, error: createdError } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', telegramId)
        .eq('is_private', true)
        .gte('date', new Date().toISOString())
        .order('created_at', { ascending: false }); // Сортировка по дате создания

      if (createdError) {
        console.error('❌ Supabase error getting created private events:', createdError);
        throw createdError;
      }

      // Объединяем результаты и убираем дубликаты
      const allEvents = [...(respondedEvents || []), ...(createdPrivateEvents || [])];
      const uniqueEvents = allEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
      );

      // Сортируем по дате создания и применяем пагинацию
      const sortedEvents = uniqueEvents
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(offset, offset + limit);

      console.log(`✅ Found ${sortedEvents.length} user events (legacy: ${respondedEvents?.length || 0} responded + ${createdPrivateEvents?.length || 0} created private, ${uniqueEvents.length} unique)`);
      return { data: sortedEvents, error: null };
    } catch (error) {
      console.error('❌ Error fetching user events (legacy):', error);
      return { 
        data: null, 
        error: { message: `Не удалось получить мероприятия пользователя: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Legacy метод getUserArchive (для fallback)
   */
  private static async getUserArchiveLegacy(telegramId: number, limit: number = 5, offset: number = 0): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log(`🔍 EventService.getUserArchiveLegacy (fallback) for: ${telegramId} (limit: ${limit}, offset: ${offset})`);
      
      // Получаем ID событий, на которые пользователь откликнулся
      const { data: responses, error: responsesError } = await supabase
        .from('event_responses')
        .select('event_id')
        .eq('user_telegram_id', telegramId)
        .eq('response_status', 'attending');

      if (responsesError) {
        console.error('❌ Supabase error getting user responses:', responsesError);
        throw responsesError;
      }

      const eventIds = responses?.map(r => r.event_id) || [];
      console.log('📋 User responded to archived events:', eventIds);

      if (eventIds.length === 0) {
        // Если пользователь не откликнулся ни на одно мероприятие, 
        // показываем только созданные им частные мероприятия
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('created_by', telegramId)
          .eq('is_private', true)
          .lt('date', new Date().toISOString())
          .order('created_at', { ascending: false }) // Сортировка по дате создания
          .range(offset, offset + limit - 1);

        if (error) {
          console.error('❌ Supabase error in getUserArchive (no responses):', error);
          throw error;
        }

        console.log(`✅ Found ${data?.length || 0} archive events (only created private)`);
        return { data: data || [], error: null };
      }

      // Получаем все прошедшие мероприятия, на которые пользователь откликнулся
      const { data: respondedEvents, error: respondedError } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .lt('date', new Date().toISOString())
        .order('created_at', { ascending: false }); // Сортировка по дате создания

      if (respondedError) {
        console.error('❌ Supabase error getting responded archive events:', respondedError);
        throw respondedError;
      }

      // Получаем созданные пользователем частные мероприятия
      const { data: createdPrivateEvents, error: createdError } = await supabase
        .from('events')
        .select('*')
        .eq('created_by', telegramId)
        .eq('is_private', true)
        .lt('date', new Date().toISOString())
        .order('created_at', { ascending: false }); // Сортировка по дате создания

      if (createdError) {
        console.error('❌ Supabase error getting created private archive events:', createdError);
        throw createdError;
      }

      // Объединяем результаты и убираем дубликаты
      const allEvents = [...(respondedEvents || []), ...(createdPrivateEvents || [])];
      const uniqueEvents = allEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
      );

      // Сортируем по дате создания и применяем пагинацию
      const sortedEvents = uniqueEvents
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(offset, offset + limit);

      console.log(`✅ Found ${sortedEvents.length} archive events (legacy: ${respondedEvents?.length || 0} responded + ${createdPrivateEvents?.length || 0} created private, ${uniqueEvents.length} unique)`);
      return { data: sortedEvents, error: null };
    } catch (error) {
      console.error('❌ Error fetching archive events (legacy):', error);
      return { 
        data: null, 
        error: { message: `Не удалось получить архив мероприятий: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Получить общее количество всех мероприятий
   */
  static async getTotalCount(): Promise<ApiResponse<number>> {
    try {
      console.log('🔍 EventService.getTotalCount counting all events');
      
      // Уменьшаем таймаут до 3 секунд для count запроса
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 секунды таймаут для count запроса
      
      try {
        const { count, error } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active') // Только активные события для быстрого подсчета
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          console.error('❌ Supabase error in getTotalCount:', error);
          throw error;
        }

        console.log(`✅ Total events count: ${count}`);
        return { data: count || 0, error: null };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error('❌ Error counting all events:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('⚠️ Count request timed out (3s), using estimated count');
        // Возвращаем приблизительное количество вместо ошибки
        return { data: 50, error: null }; // Уменьшаем оценку для реалистичности
      }
      
      return { 
        data: null, 
        error: { message: `Не удалось получить количество мероприятий: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Получить общее количество доступных мероприятий
   */
  static async getAvailableTotalCount(): Promise<ApiResponse<number>> {
    try {
      console.log('🔍 EventService.getAvailableTotalCount counting available events');
      
      // Уменьшаем таймаут до 3 секунд
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 секунды таймаут
      
      try {
        const { count, error } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
          .eq('is_private', false)
          .gte('date', new Date().toISOString().split('T')[0]) // Используем только дату без времени для быстроты
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          console.error('❌ Supabase error in getAvailableTotalCount:', error);
          throw error;
        }

        console.log(`✅ Available events count: ${count}`);
        return { data: count || 0, error: null };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }
    } catch (error) {
      console.error('❌ Error counting available events:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('⚠️ Available count request timed out (3s), using estimated count');
        return { data: 30, error: null }; // Примерное количество
      }
      
      return { 
        data: null, 
        error: { message: `Не удалось получить количество доступных мероприятий: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Получить общее количество мероприятий пользователя
   */
  static async getUserEventsTotalCount(telegramId: number): Promise<ApiResponse<number>> {
    try {
      console.log(`🔍 EventService.getUserEventsTotalCount counting user events for: ${telegramId}`);
      
      // Получаем ID событий, на которые пользователь откликнулся
      const { data: responses, error: responsesError } = await supabase
        .from('event_responses')
        .select('event_id')
        .eq('user_telegram_id', telegramId)
        .eq('response_status', 'attending');

      if (responsesError) {
        console.error('❌ Supabase error getting user responses:', responsesError);
        throw responsesError;
      }

      const eventIds = responses?.map(r => r.event_id) || [];

      // Считаем события, на которые пользователь откликнулся
      let respondedCount = 0;
      if (eventIds.length > 0) {
        const { count: respondedCountResult, error: respondedError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .in('id', eventIds)
          .gte('date', new Date().toISOString());

        if (respondedError) {
          console.error('❌ Supabase error counting responded events:', respondedError);
          throw respondedError;
        }

        respondedCount = respondedCountResult || 0;
      }

      // Считаем созданные пользователем частные мероприятия
      const { count: createdCount, error: createdError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', telegramId)
        .eq('is_private', true)
        .gte('date', new Date().toISOString());

      if (createdError) {
        console.error('❌ Supabase error counting created private events:', createdError);
        throw createdError;
      }

      const totalCount = respondedCount + (createdCount || 0);
      console.log(`✅ User events count: ${totalCount} (${respondedCount} responded + ${createdCount || 0} created private)`);
      return { data: totalCount, error: null };
    } catch (error) {
      console.error('❌ Error counting user events:', error);
      return { 
        data: null, 
        error: { message: `Не удалось получить количество мероприятий пользователя: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Получить общее количество архивных мероприятий пользователя
   */
  static async getUserArchiveTotalCount(telegramId: number): Promise<ApiResponse<number>> {
    try {
      console.log(`🔍 EventService.getUserArchiveTotalCount counting archive events for: ${telegramId}`);
      
      // Получаем ID событий, на которые пользователь откликнулся
      const { data: responses, error: responsesError } = await supabase
        .from('event_responses')
        .select('event_id')
        .eq('user_telegram_id', telegramId)
        .eq('response_status', 'attending');

      if (responsesError) {
        console.error('❌ Supabase error getting user responses:', responsesError);
        throw responsesError;
      }

      const eventIds = responses?.map(r => r.event_id) || [];

      // Считаем прошедшие события, на которые пользователь откликнулся
      let respondedCount = 0;
      if (eventIds.length > 0) {
        const { count: respondedCountResult, error: respondedError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .in('id', eventIds)
          .lt('date', new Date().toISOString());

        if (respondedError) {
          console.error('❌ Supabase error counting responded archive events:', respondedError);
          throw respondedError;
        }

        respondedCount = respondedCountResult || 0;
      }

      // Считаем созданные пользователем частные мероприятия
      const { count: createdCount, error: createdError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', telegramId)
        .eq('is_private', true)
        .lt('date', new Date().toISOString());

      if (createdError) {
        console.error('❌ Supabase error counting created private archive events:', createdError);
        throw createdError;
      }

      const totalCount = respondedCount + (createdCount || 0);
      console.log(`✅ Archive events count: ${totalCount} (${respondedCount} responded + ${createdCount || 0} created private)`);
      return { data: totalCount, error: null };
    } catch (error) {
      console.error('❌ Error counting archive events:', error);
      return { 
        data: null, 
        error: { message: `Не удалось получить количество архивных мероприятий: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Быстрое получение всех мероприятий (оптимизированная версия)
   * Загружает только необходимые поля для ускорения запроса
   */
  static async getAllFast(limit: number = 5, offset: number = 0): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log(`⚡ EventService.getAllFast fetching events (limit: ${limit}, offset: ${offset})`);
      
      // Уменьшаем таймаут до 5 секунд для быстрого переключения на fallback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут
      
      try {
        // Запрашиваем основные поля, включая image_url для корректного отображения
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            image_url,
            gradient_background,
            date,
            location,
            max_participants,
            current_participants,
            status,
            is_private,
            created_by
          `)
          .eq('status', 'active') // Только активные события
          .order('date', { ascending: true }) // Сортируем по дате для лучшей производительности
          .range(offset, offset + limit - 1)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          console.error('❌ Supabase error in getAllFast:', error);
          throw error;
        }

        // Дополняем недостающие поля значениями по умолчанию, сохраняя основные данные
        const enrichedData = (data || []).map(event => ({
          ...event,
          description: event.description || 'Описание загружается...',
          image_url: event.image_url || '', // Сохраняем исходное значение или пустую строку
          gradient_background: event.gradient_background || null,
          event_time: null, // Это поле может быть опущено для скорости
          end_date: null,
          end_time: null,
          location: event.location || 'Место уточняется',
          map_url: null, // Это поле может быть опущено для скорости
          host_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        console.log(`⚡ Fast loaded ${enrichedData.length} events with images support`);
        return { data: enrichedData, error: null };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // Если основной запрос не удался, сразу пробуем emergency fallback
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.warn('🔄 Main request timed out (5s), trying emergency fallback...');
          return this.getAllEmergencyFallback(limit, offset);
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('❌ Error in getAllFast:', error);
      
      // Если запрос завис или упал, пробуем emergency fallback
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('🔄 Request aborted, trying emergency fallback...');
        return this.getAllEmergencyFallback(limit, offset);
      }
      
      return { 
        data: null, 
        error: { message: `Ошибка быстрой загрузки: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Emergency fallback метод с минимальными данными для экстренно медленных соединений
   */
  private static async getAllEmergencyFallback(limit: number = 5, offset: number = 0): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log(`🆘 EventService.getAllEmergencyFallback - ultra minimal data (limit: ${limit}, offset: ${offset})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 секунды для emergency
      
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            date,
            status
          `)
          .eq('status', 'active')
          .order('date', { ascending: true })
          .range(offset, offset + limit - 1)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          throw error;
        }

        // Обогащаем недостающие поля значениями по умолчанию, но НЕ зануляем image_url
        const enrichedData = (data || []).map(event => ({
          ...event,
          description: 'Загрузка...',
          image_url: '', // Пустая строка вместо null, чтобы LazyImage мог показать градиент
          gradient_background: null,
          event_time: null,
          end_date: null,
          end_time: null,
          location: 'Уточняется',
          map_url: null,
          max_participants: null,
          current_participants: 0,
          created_by: 0,
          host_id: null,
          is_private: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        console.log(`🆘 Emergency loaded ${enrichedData.length} events (ultra minimal)`);
        return { data: enrichedData, error: null };
      } catch (emergencyError) {
        clearTimeout(timeoutId);
        throw emergencyError;
      }
    } catch (error) {
      console.error('❌ Emergency fallback failed:', error);
      return { 
        data: [], 
        error: { message: `Критическая ошибка соединения. Попробуйте позже.` } 
      };
    }
  }

  /**
   * Fallback метод с минимальными данными для медленных соединений
   */
  private static async getAllFallback(limit: number = 5, offset: number = 0): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log(`🔄 EventService.getAllFallback - minimal data (limit: ${limit}, offset: ${offset})`);
      
      // Запрашиваем только самые важные поля
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 секунд для fallback
      
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            image_url,
            gradient_background,
            date,
            location,
            max_participants,
            current_participants,
            status,
            is_private,
            created_by
          `)
          .eq('status', 'active')
          .order('date', { ascending: true })
          .range(offset, offset + limit - 1)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          throw error;
        }

        // Дополняем недостающие поля значениями по умолчанию, сохраняя исходные данные
        const enrichedData = (data || []).map(event => ({
          ...event,
          description: event.description || 'Описание загружается...',
          image_url: event.image_url || '', // Пустая строка вместо null
          gradient_background: event.gradient_background || null,
          event_time: null,
          end_date: null,
          end_time: null,
          location: event.location || 'Место уточняется',
          map_url: null,
          host_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        console.log(`⚡ Fallback loaded ${enrichedData.length} events (minimal data)`);
        return { data: enrichedData, error: null };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // Если и fallback не удался, пробуем emergency
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.warn('🔄 Fallback request timed out, trying emergency...');
          return this.getAllEmergencyFallback(limit, offset);
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('❌ Error in getAllFallback:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return this.getAllEmergencyFallback(limit, offset);
      }
      
      return { 
        data: null, 
        error: { message: `Ошибка fallback загрузки: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Быстрая загрузка доступных мероприятий (оптимизированная версия)
   */
  static async getAvailableFast(limit: number = 5, offset: number = 0): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log(`⚡ EventService.getAvailableFast fetching events (limit: ${limit}, offset: ${offset})`);
      
      // Уменьшаем таймаут до 5 секунд
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 секунд таймаут
      
      try {
        // Сегодняшняя дата в формате YYYY-MM-DD для быстрого сравнения
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            image_url,
            gradient_background,
            date,
            location,
            max_participants,
            current_participants,
            status,
            is_private,
            created_by
          `)
          .eq('status', 'active')
          .eq('is_private', false) // Добавляем фильтр по частным мероприятиям для быстрой работы
          .gte('date', today) // Только будущие события
          .order('date', { ascending: true }) // Сортируем по дате
          .range(offset, offset + limit - 1)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          console.error('❌ Supabase error in getAvailableFast:', error);
          throw error;
        }

        // Дополняем недостающие поля, сохраняя основные данные
        const enrichedData = (data || []).map(event => ({
          ...event,
          description: event.description || 'Описание загружается...',
          image_url: event.image_url || '', // Сохраняем исходное значение или пустую строку
          gradient_background: event.gradient_background || null,
          event_time: null, // Может быть опущено для скорости
          end_date: null,
          end_time: null,
          location: event.location || 'Место уточняется',
          map_url: null, // Может быть опущено для скорости
          host_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        console.log(`⚡ Fast loaded ${enrichedData.length} available events with images support`);
        return { data: enrichedData, error: null };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        // Если основной запрос не удался, пробуем fallback
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.warn('🔄 Available request timed out, trying fallback...');
          return this.getAvailableFallback(limit, offset);
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('❌ Error in getAvailableFast:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return this.getAvailableFallback(limit, offset);
      }
      
      return { 
        data: null, 
        error: { message: `Ошибка быстрой загрузки доступных: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Быстрая загрузка мероприятий пользователя (упрощенная версия)
   */
  static async getUserEventsFast(telegramId: number, limit: number = 5, offset: number = 0): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log(`⚡ EventService.getUserEventsFast for user: ${telegramId} (limit: ${limit}, offset: ${offset})`);
      
      // Увеличиваем таймаут до 30 секунд
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      try {
        // Простой запрос только созданных пользователем мероприятий
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            image_url,
            gradient_background,
            date,
            event_time,
            end_date,
            end_time,
            location,
            map_url,
            max_participants,
            current_participants,
            created_by,
            host_id,
            status,
            is_private,
            created_at,
            updated_at
          `)
          .eq('created_by', telegramId)
          .order('date', { ascending: false }) // Сначала новые
          .range(offset, offset + limit - 1)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          console.error('❌ Supabase error in getUserEventsFast:', error);
          throw error;
        }

        console.log(`⚡ Fast loaded ${data?.length || 0} user events`);
        return { data: data || [], error: null };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.warn('🔄 User events request timed out, trying fallback...');
          return this.getUserEventsFallback(telegramId, limit, offset);
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('❌ Error in getUserEventsFast:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return this.getUserEventsFallback(telegramId, limit, offset);
      }
      
      return { 
        data: null, 
        error: { message: `Ошибка быстрой загрузки пользователя: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Fallback для пользовательских мероприятий
   */
  private static async getUserEventsFallback(telegramId: number, limit: number = 5, offset: number = 0): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log(`🔄 EventService.getUserEventsFallback - minimal data for user: ${telegramId}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            image_url,
            gradient_background,
            date,
            location,
            max_participants,
            current_participants,
            status,
            is_private,
            created_by
          `)
          .eq('created_by', telegramId)
          .order('date', { ascending: false })
          .range(offset, offset + limit - 1)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          throw error;
        }

        const enrichedData = (data || []).map(event => ({
          ...event,
          description: event.description || 'Описание загружается...',
          image_url: event.image_url || '', // Пустая строка вместо null
          gradient_background: event.gradient_background || null,
          event_time: null,
          end_date: null,
          end_time: null,
          location: event.location || 'Место уточняется',
          map_url: null,
          host_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        console.log(`⚡ User events fallback loaded ${enrichedData.length} events`);
        return { data: enrichedData, error: null };
      } catch (fallbackError) {
        clearTimeout(timeoutId);
        throw fallbackError;
      }
    } catch (error) {
      console.error('❌ User events fallback failed:', error);
      return { 
        data: [], 
        error: { message: `Не удалось загрузить мероприятия пользователя.` } 
      };
    }
  }

  /**
   * Быстрая загрузка архива пользователя (упрощенная версия)
   */
  static async getUserArchiveFast(telegramId: number, limit: number = 5, offset: number = 0): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log(`⚡ EventService.getUserArchiveFast for user: ${telegramId} (limit: ${limit}, offset: ${offset})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Простой запрос завершенных мероприятий пользователя
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            image_url,
            gradient_background,
            date,
            event_time,
            end_date,
            end_time,
            location,
            map_url,
            max_participants,
            current_participants,
            created_by,
            host_id,
            status,
            is_private,
            created_at,
            updated_at
          `)
          .eq('created_by', telegramId)
          .lt('date', today) // Только прошедшие события
          .order('date', { ascending: false }) // Сначала новые
          .range(offset, offset + limit - 1)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          console.error('❌ Supabase error in getUserArchiveFast:', error);
          throw error;
        }

        console.log(`⚡ Fast loaded ${data?.length || 0} archive events`);
        return { data: data || [], error: null };
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.warn('🔄 Archive request timed out, trying fallback...');
          return this.getUserArchiveFallback(telegramId, limit, offset);
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('❌ Error in getUserArchiveFast:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        return this.getUserArchiveFallback(telegramId, limit, offset);
      }
      
      return { 
        data: null, 
        error: { message: `Ошибка быстрой загрузки архива: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Fallback для архивных мероприятий пользователя
   */
  private static async getUserArchiveFallback(telegramId: number, limit: number = 5, offset: number = 0): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log(`🔄 EventService.getUserArchiveFallback - minimal data for user: ${telegramId}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      try {
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            image_url,
            gradient_background,
            date,
            location,
            max_participants,
            current_participants,
            status,
            is_private,
            created_by
          `)
          .eq('created_by', telegramId)
          .lt('date', new Date().toISOString())
          .order('date', { ascending: false })
          .range(offset, offset + limit - 1)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          throw error;
        }

        const enrichedData = (data || []).map(event => ({
          ...event,
          description: event.description || 'Описание загружается...',
          image_url: event.image_url || '', // Пустая строка вместо null
          gradient_background: event.gradient_background || null,
          event_time: null,
          end_date: null,
          end_time: null,
          location: event.location || 'Место уточняется',
          map_url: null,
          host_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        console.log(`⚡ User archive fallback loaded ${enrichedData.length} events`);
        return { data: enrichedData, error: null };
      } catch (fallbackError) {
        clearTimeout(timeoutId);
        throw fallbackError;
      }
    } catch (error) {
      console.error('❌ User archive fallback failed:', error);
      return { 
        data: [], 
        error: { message: `Не удалось загрузить архив мероприятий.` } 
      };
    }
  }

  /**
   * Fallback метод для доступных мероприятий
   */
  private static async getAvailableFallback(limit: number = 5, offset: number = 0): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log(`🔄 EventService.getAvailableFallback - minimal data (limit: ${limit}, offset: ${offset})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 секунды для available fallback
      
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from('events')
          .select(`
            id,
            title,
            description,
            image_url,
            gradient_background,
            date,
            location,
            max_participants,
            current_participants,
            status,
            is_private,
            created_by
          `)
          .eq('status', 'active')
          .eq('is_private', false)
          .gte('date', today)
          .order('date', { ascending: true })
          .range(offset, offset + limit - 1)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (error) {
          throw error;
        }

        const enrichedData = (data || []).map(event => ({
          ...event,
          description: event.description || 'Описание загружается...',
          image_url: event.image_url || '', // Пустая строка вместо null
          gradient_background: event.gradient_background || null,
          event_time: null,
          end_date: null,
          end_time: null,
          location: event.location || 'Место уточняется',
          map_url: null,
          host_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        console.log(`⚡ Available fallback loaded ${enrichedData.length} events`);
        return { data: enrichedData, error: null };
      } catch (fallbackError) {
        clearTimeout(timeoutId);
        throw fallbackError;
      }
    } catch (error) {
      console.error('❌ Available fallback failed:', error);
      return { 
        data: [], 
        error: { message: `Соединение слишком медленное для загрузки доступных мероприятий.` } 
      };
    }
  }
}

// Экспортируем экземпляр для удобства
export const eventService = EventService; 