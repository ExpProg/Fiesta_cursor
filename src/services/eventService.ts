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
      
      const newEvent: DatabaseEventInsert = {
        title: eventData.title,
        description: eventData.description || null,
        image_url: eventData.image_url || null,
        gradient_background: eventData.image_url ? null : generateRandomGradient(),
        date: eventData.date,
        event_time: eventTime, // добавляем время из даты
        location: eventData.location || null, // обеспечиваем null вместо undefined
        map_url: eventData.map_url || null, // добавляем ссылку на карту
        max_participants: eventData.max_participants || null,
        created_by: createdBy,
        host_id: eventData.host_id || null,
        status: 'active',
        is_private: eventData.is_private || false
      };

      console.log('📝 Event data prepared with event_time:', { eventTime, newEvent });

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

    // Валидация для частных мероприятий
    if (eventData.is_private) {
      if (!eventData.invited_users || eventData.invited_users.length === 0) {
        errors.push('Для частного мероприятия необходимо добавить хотя бы одного приглашенного пользователя');
      } else {
        // Проверяем каждого приглашенного пользователя
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
  static async getAll(limit: number = 20): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log('🔍 EventService.getAll fetching all events');
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
        .limit(limit);

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
   */
  static async getAvailable(limit: number = 20): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log('🔍 EventService.getAvailable fetching available events');
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('❌ Supabase error in getAvailable:', error);
        throw error;
      }

      // Фильтруем мероприятия с доступными местами
      const availableEvents = (data || []).filter(event => {
        if (event.max_participants === null) return true; // Неограниченное количество
        return event.current_participants < event.max_participants;
      });

      console.log(`✅ Found ${availableEvents.length} available events`);
      return { data: availableEvents, error: null };
    } catch (error) {
      console.error('❌ Error fetching available events:', error);
      return { 
        data: null, 
        error: { message: `Не удалось получить доступные мероприятия: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Получить мероприятия пользователя (на которые он откликнулся и которые еще не прошли)
   */
  static async getUserEvents(telegramId: number, limit: number = 20): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log('🔍 EventService.getUserEvents fetching user events for:', telegramId);
      
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

      if (!responses || responses.length === 0) {
        console.log('ℹ️ No user responses found');
        return { data: [], error: null };
      }

      const eventIds = responses.map(r => r.event_id);

      // Получаем сами события
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .gte('date', new Date().toISOString()) // Только будущие события
        .order('date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('❌ Supabase error in getUserEvents:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} user events`);
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
   * Получить архивные мероприятия пользователя (прошедшие, на которые он откликнулся)
   */
  static async getUserArchive(telegramId: number, limit: number = 20): Promise<ApiResponse<DatabaseEvent[]>> {
    try {
      console.log('🔍 EventService.getUserArchive fetching archive events for:', telegramId);
      
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

      if (!responses || responses.length === 0) {
        console.log('ℹ️ No user responses found for archive');
        return { data: [], error: null };
      }

      const eventIds = responses.map(r => r.event_id);

      // Получаем прошедшие события
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds)
        .lt('date', new Date().toISOString()) // Только прошедшие события
        .order('date', { ascending: false }) // Сначала более свежие
        .limit(limit);

      if (error) {
        console.error('❌ Supabase error in getUserArchive:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} archive events`);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error fetching archive events:', error);
      return { 
        data: null, 
        error: { message: `Не удалось получить архив мероприятий: ${this.getErrorMessage(error)}` } 
      };
    }
  }
}

// Экспортируем экземпляр для удобства
export const eventService = EventService; 