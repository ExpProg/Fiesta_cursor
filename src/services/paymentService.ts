import { supabase } from '@/hooks/useSupabase';
import type { 
  DatabasePayment, 
  DatabasePaymentInsert, 
  DatabasePaymentUpdate,
  ApiResponse,
  PaginatedResponse,
  Payment,
  CreatePaymentData,
  UpdatePaymentData,
  PaymentStatus,
  PaymentMethod,
  PaymentRealtimeEvent,
  RealtimeEvent
} from '@/types/database';

// Тип для колбэков real-time подписок
export type PaymentEventCallback = (event: RealtimeEvent<DatabasePayment>) => void;

/**
 * Сервис для работы с платежами
 */
export class PaymentService {
  /**
   * Получить платеж по ID
   */
  static async getById(id: string): Promise<ApiResponse<DatabasePayment>> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching payment by ID:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить платеж' } 
      };
    }
  }

  /**
   * Получить платежи по бронированию
   */
  static async getByBookingId(bookingId: string): Promise<ApiResponse<DatabasePayment[]>> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching payments by booking ID:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить платежи' } 
      };
    }
  }

  /**
   * Создать новый платеж
   */
  static async create(paymentData: CreatePaymentData): Promise<ApiResponse<DatabasePayment>> {
    try {
      const insertData: DatabasePaymentInsert = {
        ...paymentData,
      };

      const { data, error } = await supabase
        .from('payments')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error creating payment:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось создать платеж' } 
      };
    }
  }

  /**
   * Обновить платеж
   */
  static async update(id: string, updates: UpdatePaymentData): Promise<ApiResponse<DatabasePayment>> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating payment:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось обновить платеж' } 
      };
    }
  }

  /**
   * Удалить платеж
   */
  static async delete(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Error deleting payment:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось удалить платеж' } 
      };
    }
  }

  /**
   * Подтвердить платеж
   */
  static async markAsCompleted(
    id: string, 
    paymentData?: Record<string, any>
  ): Promise<ApiResponse<DatabasePayment>> {
    const updates: UpdatePaymentData = { 
      status: 'completed' 
    };

    if (paymentData) {
      updates.payment_data = paymentData;
    }

    return this.update(id, updates);
  }

  /**
   * Отметить платеж как неудачный
   */
  static async markAsFailed(
    id: string, 
    reason: string
  ): Promise<ApiResponse<DatabasePayment>> {
    return this.update(id, { 
      status: 'failed',
      failure_reason: reason 
    });
  }

  /**
   * Возврат средств
   */
  static async refund(
    id: string, 
    refundAmount: number,
    reason?: string
  ): Promise<ApiResponse<DatabasePayment>> {
    const updates: UpdatePaymentData = {
      status: 'refunded',
      refund_amount: refundAmount,
    };

    if (reason) {
      updates.failure_reason = reason;
    }

    return this.update(id, updates);
  }

  /**
   * Обновить данные Stripe платежа
   */
  static async updateStripeData(
    id: string,
    stripePaymentIntentId: string,
    paymentData?: Record<string, any>
  ): Promise<ApiResponse<DatabasePayment>> {
    const updates: UpdatePaymentData = {
      stripe_payment_intent_id: stripePaymentIntentId,
    };

    if (paymentData) {
      updates.payment_data = paymentData;
    }

    return this.update(id, updates);
  }

  /**
   * Обновить данные Telegram платежа
   */
  static async updateTelegramData(
    id: string,
    telegramChargeId: string,
    paymentData?: Record<string, any>
  ): Promise<ApiResponse<DatabasePayment>> {
    const updates: UpdatePaymentData = {
      telegram_payment_charge_id: telegramChargeId,
    };

    if (paymentData) {
      updates.payment_data = paymentData;
    }

    return this.update(id, updates);
  }

  /**
   * Обновить данные кошелька
   */
  static async updateWalletData(
    id: string,
    transactionHash: string,
    paymentData?: Record<string, any>
  ): Promise<ApiResponse<DatabasePayment>> {
    const updates: UpdatePaymentData = {
      wallet_transaction_hash: transactionHash,
    };

    if (paymentData) {
      updates.payment_data = paymentData;
    }

    return this.update(id, updates);
  }

  /**
   * Получить платежи пользователя
   */
  static async getUserPayments(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<DatabasePayment>> {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('payments')
        .select(`
          *,
          bookings!inner(user_id)
        `, { count: 'exact' })
        .eq('bookings.user_id', userId)
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
      console.error('Error fetching user payments:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить платежи пользователя' },
        count: 0,
        page,
        limit,
        totalPages: 0
      };
    }
  }

  /**
   * Получить платежи события
   */
  static async getEventPayments(
    eventId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<DatabasePayment>> {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('payments')
        .select(`
          *,
          bookings!inner(event_id)
        `, { count: 'exact' })
        .eq('bookings.event_id', eventId)
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
      console.error('Error fetching event payments:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить платежи события' },
        count: 0,
        page,
        limit,
        totalPages: 0
      };
    }
  }

  /**
   * Получить статистику платежей
   */
  static async getPaymentStats(
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<{
    totalAmount: number;
    totalTransactions: number;
    completedAmount: number;
    completedTransactions: number;
    refundedAmount: number;
    refundedTransactions: number;
    failedTransactions: number;
    byMethod: Record<PaymentMethod, { amount: number; count: number }>;
  }>> {
    try {
      let query = supabase
        .from('payments')
        .select('*');

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const stats = {
        totalAmount: 0,
        totalTransactions: data?.length || 0,
        completedAmount: 0,
        completedTransactions: 0,
        refundedAmount: 0,
        refundedTransactions: 0,
        failedTransactions: 0,
        byMethod: {
          card: { amount: 0, count: 0 },
          telegram_stars: { amount: 0, count: 0 },
          wallet: { amount: 0, count: 0 },
        } as Record<PaymentMethod, { amount: number; count: number }>,
      };

      data?.forEach(payment => {
        const amount = Number(payment.amount);
        stats.totalAmount += amount;
        
        stats.byMethod[payment.payment_method].amount += amount;
        stats.byMethod[payment.payment_method].count++;

        switch (payment.status) {
          case 'completed':
            stats.completedAmount += amount;
            stats.completedTransactions++;
            break;
          case 'refunded':
            stats.refundedAmount += Number(payment.refund_amount || 0);
            stats.refundedTransactions++;
            break;
          case 'failed':
            stats.failedTransactions++;
            break;
        }
      });

      return { data: stats, error: null };
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить статистику платежей' } 
      };
    }
  }

  /**
   * Найти платеж по внешнему ID
   */
  static async findByExternalId(
    externalId: string,
    method: PaymentMethod
  ): Promise<ApiResponse<DatabasePayment>> {
    try {
      let query = supabase
        .from('payments')
        .select('*')
        .eq('payment_method', method);

      switch (method) {
        case 'card':
          query = query.eq('stripe_payment_intent_id', externalId);
          break;
        case 'telegram_stars':
          query = query.eq('telegram_payment_charge_id', externalId);
          break;
        case 'wallet':
          query = query.eq('wallet_transaction_hash', externalId);
          break;
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error finding payment by external ID:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось найти платеж' } 
      };
    }
  }

  /**
   * Получить ожидающие платежи
   */
  static async getPendingPayments(): Promise<ApiResponse<DatabasePayment[]>> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить ожидающие платежи' } 
      };
    }
  }

  /**
   * Получить платежи по статусу
   */
  static async getPaymentsByStatus(
    status: PaymentStatus,
    limit: number = 50
  ): Promise<ApiResponse<DatabasePayment[]>> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('status', status)
        .limit(limit)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching payments by status:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить платежи по статусу' } 
      };
    }
  }

  /**
   * Real-time подписка на платежи бронирования
   */
  static subscribeToBookingPayments(
    bookingId: string,
    callback: PaymentEventCallback
  ): (() => void) | null {
    try {
      const channel = supabase
        .channel(`booking_payments_${bookingId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments',
            filter: `booking_id=eq.${bookingId}`,
          },
          callback
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    } catch (error) {
      console.error('Error creating booking payments subscription:', error);
      return null;
    }
  }

  /**
   * Real-time подписка на конкретный платеж
   */
  static subscribeToPayment(
    paymentId: string,
    callback: PaymentEventCallback
  ): (() => void) | null {
    try {
      const channel = supabase
        .channel(`payment_${paymentId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'payments',
            filter: `id=eq.${paymentId}`,
          },
          callback
        )
        .subscribe();

      return () => {
        channel.unsubscribe();
      };
    } catch (error) {
      console.error('Error creating payment subscription:', error);
      return null;
    }
  }

  /**
   * Webhook обработка для Stripe
   */
  static async processStripeWebhook(
    eventType: string,
    paymentIntentId: string,
    eventData: any
  ): Promise<ApiResponse<DatabasePayment | null>> {
    try {
      const paymentResponse = await this.findByExternalId(paymentIntentId, 'card');
      
      if (paymentResponse.error || !paymentResponse.data) {
        console.warn(`Payment not found for Stripe intent: ${paymentIntentId}`);
        return { data: null, error: null };
      }

      const payment = paymentResponse.data;
      let updates: UpdatePaymentData = {
        payment_data: { ...payment.payment_data, stripe_event: eventData }
      };

      switch (eventType) {
        case 'payment_intent.succeeded':
          updates.status = 'completed';
          break;
        case 'payment_intent.payment_failed':
          updates.status = 'failed';
          updates.failure_reason = eventData.last_payment_error?.message || 'Payment failed';
          break;
        case 'payment_intent.canceled':
          updates.status = 'failed';
          updates.failure_reason = 'Payment canceled';
          break;
      }

      return this.update(payment.id, updates);
    } catch (error) {
      console.error('Error processing Stripe webhook:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось обработать webhook Stripe' } 
      };
    }
  }

  /**
   * Webhook обработка для Telegram
   */
  static async processTelegramWebhook(
    chargeId: string,
    eventData: any
  ): Promise<ApiResponse<DatabasePayment | null>> {
    try {
      const paymentResponse = await this.findByExternalId(chargeId, 'telegram_stars');
      
      if (paymentResponse.error || !paymentResponse.data) {
        console.warn(`Payment not found for Telegram charge: ${chargeId}`);
        return { data: null, error: null };
      }

      const payment = paymentResponse.data;
      const updates: UpdatePaymentData = {
        status: 'completed',
        payment_data: { ...payment.payment_data, telegram_event: eventData }
      };

      return this.update(payment.id, updates);
    } catch (error) {
      console.error('Error processing Telegram webhook:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось обработать webhook Telegram' } 
      };
    }
  }

  /**
   * Конвертировать DatabasePayment в Payment (с преобразованием дат)
   */
  static convertToPayment(dbPayment: DatabasePayment): Payment {
    return {
      ...dbPayment,
      created_at: new Date(dbPayment.created_at),
      updated_at: new Date(dbPayment.updated_at),
      refunded_at: dbPayment.refunded_at ? new Date(dbPayment.refunded_at) : null,
    };
  }

  /**
   * Конвертировать массив DatabasePayment в Payment[]
   */
  static convertToPayments(dbPayments: DatabasePayment[]): Payment[] {
    return dbPayments.map(this.convertToPayment);
  }

  /**
   * Валидация данных платежа
   */
  static validatePaymentData(paymentData: CreatePaymentData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!paymentData.booking_id) {
      errors.push('ID бронирования обязательно');
    }

    if (paymentData.amount <= 0) {
      errors.push('Сумма платежа должна быть больше 0');
    }

    if (!['card', 'telegram_stars', 'wallet'].includes(paymentData.payment_method)) {
      errors.push('Неверный способ оплаты');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Проверить возможность возврата
   */
  static canRefund(payment: DatabasePayment): { canRefund: boolean; reason?: string } {
    if (payment.status === 'refunded') {
      return { canRefund: false, reason: 'Платеж уже возвращен' };
    }

    if (payment.status !== 'completed') {
      return { canRefund: false, reason: 'Платеж не завершен' };
    }

    // Проверяем временные ограничения (например, 30 дней)
    const paymentDate = new Date(payment.created_at);
    const now = new Date();
    const daysSincePayment = (now.getTime() - paymentDate.getTime()) / (1000 * 3600 * 24);

    if (daysSincePayment > 30) {
      return { canRefund: false, reason: 'Прошло более 30 дней с момента платежа' };
    }

    return { canRefund: true };
  }

  /**
   * Автоматическая отмена просроченных платежей
   */
  static async cancelExpiredPayments(expirationHours: number = 24): Promise<number> {
    try {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() - expirationHours);

      const { data, error } = await supabase
        .from('payments')
        .update({ 
          status: 'failed',
          failure_reason: 'Payment expired'
        })
        .eq('status', 'pending')
        .lt('created_at', expirationDate.toISOString())
        .select();

      if (error) {
        throw error;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error canceling expired payments:', error);
      return 0;
    }
  }
}

// Экспортируем экземпляр для удобства
export const paymentService = PaymentService; 