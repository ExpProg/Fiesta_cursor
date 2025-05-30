import { supabase } from '@/hooks/useSupabase';
import type { EventInvitation, InvitedUser } from '@/types/database';

export class InvitationService {
  /**
   * Создает приглашения для частного мероприятия
   */
  static async createInvitations(
    eventId: string,
    invitedBy: number,
    invitedUsers: InvitedUser[]
  ) {
    try {
      console.log('📧 Creating invitations for event:', eventId, 'Users:', invitedUsers.length);

      const invitations = invitedUsers.map(user => ({
        event_id: eventId,
        invited_by_telegram_id: invitedBy,
        invited_telegram_id: user.telegram_id,
        invited_first_name: user.first_name,
        invited_last_name: user.last_name || null,
        invited_username: user.username || null,
        status: 'pending' as const
      }));

      const { data, error } = await supabase
        .from('event_invitations')
        .insert(invitations)
        .select();

      if (error) {
        console.error('❌ Error creating invitations:', error);
        
        // Если таблица не существует
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('⚠️ Table event_invitations does not exist yet. Please run the migration.');
          return { 
            data: null, 
            error: { 
              message: 'Функция приглашений пока недоступна. Требуется обновление базы данных.' 
            } 
          };
        }
        
        return { data: null, error };
      }

      console.log('✅ Invitations created successfully:', data?.length);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Exception creating invitations:', error);
      
      // Если это ошибка отсутствия таблицы
      if (error instanceof Error && error.message.includes('does not exist')) {
        return { 
          data: null, 
          error: { 
            message: 'Функция приглашений пока недоступна. Требуется обновление базы данных.' 
          } 
        };
      }
      
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Получает приглашения для мероприятия
   */
  static async getEventInvitations(eventId: string) {
    try {
      const { data, error } = await supabase
        .from('event_invitations')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Error fetching invitations:', error);
        return { data: null, error };
      }

      return { data: data as EventInvitation[], error: null };
    } catch (error) {
      console.error('❌ Exception fetching invitations:', error);
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Получает приглашения пользователя
   */
  static async getUserInvitations(telegramId: number, status?: 'pending' | 'accepted' | 'declined') {
    try {
      let query = supabase
        .from('event_invitations')
        .select(`
          *,
          events (
            id,
            title,
            description,
            date,
            event_time,
            location,
            image_url,
            gradient_background,
            created_by,
            max_participants,
            current_participants
          )
        `)
        .eq('invited_telegram_id', telegramId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching user invitations:', error);
        
        // Если таблица не существует, возвращаем пустой массив вместо ошибки
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          console.warn('⚠️ Table event_invitations does not exist yet. Please run the migration.');
          return { 
            data: [], 
            error: { 
              message: 'Функция приглашений пока недоступна. Требуется обновление базы данных.' 
            } 
          };
        }
        
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Exception fetching user invitations:', error);
      
      // Если это ошибка отсутствия таблицы
      if (error instanceof Error && error.message.includes('does not exist')) {
        return { 
          data: [], 
          error: { 
            message: 'Функция приглашений пока недоступна. Требуется обновление базы данных.' 
          } 
        };
      }
      
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Обновляет статус приглашения
   */
  static async updateInvitationStatus(
    invitationId: string, 
    status: 'accepted' | 'declined'
  ) {
    try {
      console.log('📧 Updating invitation status:', invitationId, status);

      const { data, error } = await supabase
        .from('event_invitations')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating invitation status:', error);
        return { data: null, error };
      }

      console.log('✅ Invitation status updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('❌ Exception updating invitation status:', error);
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Удаляет приглашение (только создатель мероприятия)
   */
  static async deleteInvitation(invitationId: string) {
    try {
      console.log('🗑️ Deleting invitation:', invitationId);

      const { error } = await supabase
        .from('event_invitations')
        .delete()
        .eq('id', invitationId);

      if (error) {
        console.error('❌ Error deleting invitation:', error);
        return { error };
      }

      console.log('✅ Invitation deleted successfully');
      return { error: null };
    } catch (error) {
      console.error('❌ Exception deleting invitation:', error);
      return { 
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Проверяет, приглашен ли пользователь на мероприятие
   */
  static async checkUserInvitation(eventId: string, telegramId: number) {
    try {
      const { data, error } = await supabase
        .from('event_invitations')
        .select('status')
        .eq('event_id', eventId)
        .eq('invited_telegram_id', telegramId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error checking invitation:', error);
        return { data: null, error };
      }

      return { data: data?.status || null, error: null };
    } catch (error) {
      console.error('❌ Exception checking invitation:', error);
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Добавляет новое приглашение к существующему мероприятию
   */
  static async addInvitation(
    eventId: string,
    invitedBy: number,
    invitedUser: InvitedUser
  ) {
    try {
      console.log('📧 Adding invitation for event:', eventId, 'User:', invitedUser.telegram_id);

      const invitation = {
        event_id: eventId,
        invited_by_telegram_id: invitedBy,
        invited_telegram_id: invitedUser.telegram_id,
        invited_first_name: invitedUser.first_name,
        invited_last_name: invitedUser.last_name || null,
        invited_username: invitedUser.username || null,
        status: 'pending' as const
      };

      const { data, error } = await supabase
        .from('event_invitations')
        .insert([invitation])
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding invitation:', error);
        return { data: null, error };
      }

      console.log('✅ Invitation added successfully');
      return { data, error: null };
    } catch (error) {
      console.error('❌ Exception adding invitation:', error);
      return { 
        data: null, 
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Проверяет, может ли пользователь просматривать мероприятие
   */
  static async canUserViewEvent(eventId: string, telegramId: number) {
    try {
      // Проверяем, является ли мероприятие публичным
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('is_private, created_by')
        .eq('id', eventId)
        .single();

      if (eventError) {
        return { canView: false, reason: 'event_not_found' };
      }

      // Если мероприятие публичное, разрешаем просмотр
      if (!event.is_private) {
        return { canView: true, reason: 'public_event' };
      }

      // Если пользователь создатель мероприятия
      if (event.created_by === telegramId) {
        return { canView: true, reason: 'event_creator' };
      }

      // Проверяем приглашение
      const { data: invitationStatus } = await this.checkUserInvitation(eventId, telegramId);
      
      if (invitationStatus) {
        return { canView: true, reason: 'invited' };
      }

      return { canView: false, reason: 'not_invited' };
    } catch (error) {
      console.error('❌ Exception checking user access:', error);
      return { canView: false, reason: 'error' };
    }
  }
} 