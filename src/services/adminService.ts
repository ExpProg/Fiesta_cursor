import { supabase } from '@/hooks/useSupabase';
import type { ApiResponse, DatabaseUser } from '@/types/database';

/**
 * Сервис для работы с администраторскими функциями
 */
export class AdminService {
  /**
   * Проверить, является ли пользователь администратором
   */
  static async isUserAdmin(telegramId: number): Promise<ApiResponse<boolean>> {
    try {
      console.log(`🔍 AdminService.isUserAdmin checking admin status for user: ${telegramId}`);
      
      const { data, error } = await supabase.rpc('is_user_admin', {
        user_telegram_id: telegramId
      });

      if (error) {
        console.error('❌ Supabase error in isUserAdmin:', error);
        throw error;
      }

      console.log(`✅ Admin check result for user ${telegramId}: ${data}`);
      return { data: data || false, error: null };
    } catch (error) {
      console.error('❌ Error checking admin status:', error);
      return { 
        data: null, 
        error: { message: `Не удалось проверить статус администратора: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Установить статус администратора для пользователя
   */
  static async setUserAdmin(telegramId: number, isAdmin: boolean = true): Promise<ApiResponse<boolean>> {
    try {
      console.log(`🔧 AdminService.setUserAdmin setting admin status for user ${telegramId} to: ${isAdmin}`);
      
      const { data, error } = await supabase.rpc('set_user_admin', {
        user_telegram_id: telegramId,
        admin_status: isAdmin
      });

      if (error) {
        console.error('❌ Supabase error in setUserAdmin:', error);
        throw error;
      }

      console.log(`✅ Admin status updated for user ${telegramId}: ${data}`);
      return { data: data || false, error: null };
    } catch (error) {
      console.error('❌ Error setting admin status:', error);
      return { 
        data: null, 
        error: { message: `Не удалось изменить статус администратора: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Получить всех администраторов
   */
  static async getAllAdmins(): Promise<ApiResponse<DatabaseUser[]>> {
    try {
      console.log('🔍 AdminService.getAllAdmins fetching all admin users');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_admin', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase error in getAllAdmins:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} admin users`);
      return { data: data || [], error: null };
    } catch (error) {
      console.error('❌ Error fetching admin users:', error);
      return { 
        data: null, 
        error: { message: `Не удалось получить список администраторов: ${this.getErrorMessage(error)}` } 
      };
    }
  }

  /**
   * Получить статистику для администратора
   */
  static async getAdminStats(): Promise<ApiResponse<{
    totalUsers: number;
    totalEvents: number;
    totalActiveEvents: number;
    totalPrivateEvents: number;
    totalResponses: number;
    totalAdmins: number;
  }>> {
    try {
      console.log('📊 AdminService.getAdminStats fetching admin statistics');
      
      // Параллельные запросы для получения статистики
      const [usersCount, eventsCount, activeEventsCount, privateEventsCount, responsesCount, adminsCount] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('is_private', true),
        supabase.from('event_responses').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_admin', true)
      ]);

      // Проверяем на ошибки
      if (usersCount.error) throw usersCount.error;
      if (eventsCount.error) throw eventsCount.error;
      if (activeEventsCount.error) throw activeEventsCount.error;
      if (privateEventsCount.error) throw privateEventsCount.error;
      if (responsesCount.error) throw responsesCount.error;
      if (adminsCount.error) throw adminsCount.error;

      const stats = {
        totalUsers: usersCount.count || 0,
        totalEvents: eventsCount.count || 0,
        totalActiveEvents: activeEventsCount.count || 0,
        totalPrivateEvents: privateEventsCount.count || 0,
        totalResponses: responsesCount.count || 0,
        totalAdmins: adminsCount.count || 0
      };

      console.log('✅ Admin stats fetched successfully:', stats);
      return { data: stats, error: null };
    } catch (error) {
      console.error('❌ Error fetching admin stats:', error);
      return { 
        data: null, 
        error: { message: `Не удалось получить статистику: ${this.getErrorMessage(error)}` } 
      };
    }
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
}

// Экспортируем экземпляр для удобства
export const adminService = AdminService; 