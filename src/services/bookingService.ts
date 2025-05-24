import { supabase } from '@/hooks/useSupabase';
import type { 
  DatabaseBooking, 
  DatabaseBookingInsert, 
  DatabaseBookingUpdate,
  ApiResponse,
  PaginatedResponse,
  BookingWithDetails,
  Booking,
  CreateBookingData,
  UpdateBookingData,
  BookingStatus,
  BookingRealtimeEvent,
  RealtimeEvent
} from '@/types/database';

// Тип для колбэков real-time подписок
export type BookingEventCallback = (event: RealtimeEvent<DatabaseBooking>) => void;

/**
 * Сервис для работы с бронированиями
 */
export class BookingService {
  /**
   * Получить бронирование по ID
   */
  static async getById(id: string): Promise<ApiResponse<DatabaseBooking>> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching booking by ID:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить бронирование' } 
      };
    }
  }

  /**
   * Получить бронирование с деталями
   */
  static async getByIdWithDetails(id: string): Promise<ApiResponse<BookingWithDetails>> {
    try {
      const { data, error } = await supabase
        .from('bookings_with_details')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching booking with details by ID:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить бронирование' } 
      };
    }
  }

  /**
   * Получить бронирование по коду
   */
  static async getByCode(bookingCode: string): Promise<ApiResponse<BookingWithDetails>> {
    try {
      const { data, error } = await supabase
        .from('bookings_with_details')
        .select('*')
        .eq('booking_code', bookingCode)
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching booking by code:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось найти бронирование по коду' } 
      };
    }
  }

  /**
   * Создать новое бронирование
   */
  static async create(
    bookingData: CreateBookingData, 
    userId: string
  ): Promise<ApiResponse<DatabaseBooking>> {
    try {
      // Сначала проверяем доступность места
      const { data: event } = await supabase
        .from('events')
        .select('max_guests, current_guests, price_per_person')
        .eq('id', bookingData.event_id)
        .single();

      if (!event) {
        return { 
          data: null, 
          error: { message: 'Событие не найдено' } 
        };
      }

      const availableSpots = event.max_guests - event.current_guests;
      if (availableSpots < bookingData.guests_count) {
        return { 
          data: null, 
          error: { message: 'Недостаточно свободных мест' } 
        };
      }

      // Рассчитываем общую стоимость
      const totalAmount = event.price_per_person * bookingData.guests_count;

      const insertData: DatabaseBookingInsert = {
        ...bookingData,
        user_id: userId,
        total_amount: totalAmount,
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating booking:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось создать бронирование' } 
      };
    }
  }

  /**
   * Обновить бронирование
   */
  static async update(id: string, updates: UpdateBookingData): Promise<ApiResponse<DatabaseBooking>> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating booking:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось обновить бронирование' } 
      };
    }
  }

  /**
   * Удалить бронирование
   */
  static async delete(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Error deleting booking:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось удалить бронирование' } 
      };
    }
  }

  /**
   * Получить бронирования пользователя
   */
  static async getUserBookings(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<BookingWithDetails>> {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('bookings_with_details')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

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
      console.error('Error fetching user bookings:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить бронирования пользователя' },
        count: 0,
        page,
        limit,
        totalPages: 0
      };
    }
  }

  /**
   * Получить бронирования события
   */
  static async getEventBookings(
    eventId: string,
    status?: BookingStatus,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<BookingWithDetails>> {
    try {
      const offset = (page - 1) * limit;
      
      let query = supabase
        .from('bookings_with_details')
        .select('*', { count: 'exact' })
        .eq('event_id', eventId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error, count } = await query
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

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
      console.error('Error fetching event bookings:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить бронирования события' },
        count: 0,
        page,
        limit,
        totalPages: 0
      };
    }
  }

  /**
   * Подтвердить бронирование
   */
  static async confirm(id: string): Promise<ApiResponse<DatabaseBooking>> {
    return this.update(id, { status: 'confirmed' });
  }

  /**
   * Отменить бронирование
   */
  static async cancel(
    id: string, 
    cancellationReason?: string
  ): Promise<ApiResponse<DatabaseBooking>> {
    return this.update(id, { 
      status: 'cancelled',
      cancellation_reason: cancellationReason 
    });
  }

  /**
   * Завершить бронирование
   */
  static async complete(id: string): Promise<ApiResponse<DatabaseBooking>> {
    return this.update(id, { status: 'completed' });
  }

  /**
   * Изменить количество гостей
   */
  static async updateGuestCount(
    id: string, 
    newGuestCount: number
  ): Promise<ApiResponse<DatabaseBooking>> {
    try {
      // Получаем данные бронирования
      const bookingResponse = await this.getById(id);
      if (bookingResponse.error || !bookingResponse.data) {
        return { data: null, error: bookingResponse.error };
      }

      const booking = bookingResponse.data;

      // Получаем данные события для расчета новой стоимости
      const { data: event } = await supabase
        .from('events')
        .select('price_per_person, max_guests, current_guests')
        .eq('id', booking.event_id)
        .single();

      if (!event) {
        return { 
          data: null, 
          error: { message: 'Событие не найдено' } 
        };
      }

      // Проверяем доступность мест с учетом текущего бронирования
      const availableSpots = event.max_guests - event.current_guests + booking.guests_count;
      if (availableSpots < newGuestCount) {
        return { 
          data: null, 
          error: { message: 'Недостаточно свободных мест' } 
        };
      }

      // Рассчитываем новую стоимость
      const newTotalAmount = event.price_per_person * newGuestCount;

      return this.update(id, { 
        guests_count: newGuestCount,
        total_amount: newTotalAmount
      });
    } catch (error) {
      console.error('Error updating guest count:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось обновить количество гостей' } 
      };
    }
  }

  /**
   * Получить активные бронирования пользователя
   */
  static async getUserActiveBookings(userId: string): Promise<ApiResponse<BookingWithDetails[]>> {
    try {
      const { data, error } = await supabase
        .from('bookings_with_details')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'confirmed'])
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date', { ascending: true });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching user active bookings:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить активные бронирования' } 
      };
    }
  }

  /**
   * Получить историю бронирований пользователя
   */
  static async getUserBookingHistory(userId: string): Promise<ApiResponse<BookingWithDetails[]>> {
    try {
      const { data, error } = await supabase
        .from('bookings_with_details')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching user booking history:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить историю бронирований' } 
      };
    }
  }

  /**
   * Получить статистику бронирований по событию
   */
  static async getEventBookingStats(eventId: string): Promise<ApiResponse<{
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    totalRevenue: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('status, total_amount')
        .eq('event_id', eventId);

      if (error) {
        throw error;
      }

      const stats = {
        total: data?.length || 0,
        pending: 0,
        confirmed: 0,
        cancelled: 0,
        completed: 0,
        totalRevenue: 0,
      };

      data?.forEach(booking => {
        stats[booking.status as keyof typeof stats]++;
        if (booking.status === 'confirmed' || booking.status === 'completed') {
          stats.totalRevenue += Number(booking.total_amount);
        }
      });

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching event booking stats:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить статистику бронирований' } 
      };
    }
  }

  /**
   * Проверить существование бронирования
   */
  static async checkUserBookingExists(
    userId: string, 
    eventId: string
  ): Promise<{ exists: boolean; booking?: DatabaseBooking }> {
    try {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .single();

      return { 
        exists: !!data, 
        booking: data || undefined 
      };
    } catch {
      return { exists: false };
    }
  }

  /**
   * Real-time подписка на изменения бронирований пользователя
   */
  static subscribeToUserBookings(
    userId: string,
    callback: BookingEventCallback
  ): (() => void) | null {
    try {
      const channel = supabase
        .channel(`user_bookings_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `user_id=eq.${userId}`,
          },
          callback
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    } catch (error) {
      console.error('Error creating user bookings subscription:', error);
      return null;
    }
  }

  /**
   * Real-time подписка на изменения бронирований события
   */
  static subscribeToEventBookings(
    eventId: string,
    callback: BookingEventCallback
  ): (() => void) | null {
    try {
      const channel = supabase
        .channel(`event_bookings_${eventId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `event_id=eq.${eventId}`,
          },
          callback
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    } catch (error) {
      console.error('Error creating event bookings subscription:', error);
      return null;
    }
  }

  /**
   * Real-time подписка на конкретное бронирование
   */
  static subscribeToBooking(
    bookingId: string,
    callback: BookingEventCallback
  ): (() => void) | null {
    try {
      const channel = supabase
        .channel(`booking_${bookingId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `id=eq.${bookingId}`,
          },
          callback
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    } catch (error) {
      console.error('Error creating booking subscription:', error);
      return null;
    }
  }

  /**
   * Конвертировать DatabaseBooking в Booking (с преобразованием дат)
   */
  static convertToBooking(dbBooking: DatabaseBooking): Booking {
    return {
      ...dbBooking,
      created_at: new Date(dbBooking.created_at),
      updated_at: new Date(dbBooking.updated_at),
      confirmed_at: dbBooking.confirmed_at ? new Date(dbBooking.confirmed_at) : null,
      cancelled_at: dbBooking.cancelled_at ? new Date(dbBooking.cancelled_at) : null,
    };
  }

  /**
   * Конвертировать массив DatabaseBooking в Booking[]
   */
  static convertToBookings(dbBookings: DatabaseBooking[]): Booking[] {
    return dbBookings.map(this.convertToBooking);
  }

  /**
   * Валидация данных бронирования
   */
  static validateBookingData(bookingData: CreateBookingData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!bookingData.event_id) {
      errors.push('ID события обязательно');
    }

    if (bookingData.guests_count < 1 || bookingData.guests_count > 50) {
      errors.push('Количество гостей должно быть от 1 до 50');
    }

    if (bookingData.special_requests && bookingData.special_requests.length > 500) {
      errors.push('Особые пожелания не должны превышать 500 символов');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Получить количество доступных мест для события
   */
  static async getAvailableSpots(eventId: string): Promise<number> {
    try {
      const { data: event } = await supabase
        .from('events')
        .select('max_guests, current_guests')
        .eq('id', eventId)
        .single();

      if (!event) return 0;

      return Math.max(0, event.max_guests - event.current_guests);
    } catch (error) {
      console.error('Error getting available spots:', error);
      return 0;
    }
  }

  /**
   * Отправить уведомление о изменении статуса бронирования
   */
  static async notifyStatusChange(
    bookingId: string, 
    newStatus: BookingStatus,
    message?: string
  ): Promise<void> {
    try {
      // Здесь можно добавить логику отправки уведомлений
      // например, через Telegram Bot API или push-уведомления
      console.log(`Booking ${bookingId} status changed to ${newStatus}${message ? `: ${message}` : ''}`);
    } catch (error) {
      console.error('Error sending status change notification:', error);
    }
  }
}

// Экспортируем экземпляр для удобства
export const bookingService = BookingService; 