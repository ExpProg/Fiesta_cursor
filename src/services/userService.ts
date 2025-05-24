import { supabase } from '@/hooks/useSupabase';
import type { 
  DatabaseUser, 
  DatabaseUserInsert, 
  DatabaseUserUpdate,
  ApiResponse,
  User 
} from '@/types/database';
import type { TelegramWebAppUser } from '@/types/telegram';

/**
 * Сервис для работы с пользователями
 */
export class UserService {
  /**
   * Получить пользователя по Telegram ID
   */
  static async getByTelegramId(telegramId: number): Promise<ApiResponse<DatabaseUser>> {
    try {
      console.log(`🔍 UserService.getByTelegramId searching for ID: ${telegramId}`);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', telegramId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Supabase error in getByTelegramId:', error);
        throw error;
      }

      if (error && error.code === 'PGRST116') {
        console.log(`ℹ️ No user found with telegram_id: ${telegramId}`);
      } else if (data) {
        console.log(`✅ Found user with telegram_id: ${telegramId}, user_id: ${data.id}`);
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Error fetching user by Telegram ID:', error);
      
      // Детальная обработка ошибки Supabase
      let errorMessage = 'Неизвестная ошибка при поиске пользователя';
      
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('error' in error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if ('details' in error && typeof error.details === 'string') {
          errorMessage = error.details;
        } else {
          errorMessage = JSON.stringify(error);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      return { 
        data: null, 
        error: { message: `Не удалось получить пользователя: ${errorMessage}` } 
      };
    }
  }

  /**
   * Получить пользователя по ID
   */
  static async getById(id: string): Promise<ApiResponse<DatabaseUser>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить пользователя' } 
      };
    }
  }

  /**
   * Создать нового пользователя
   */
  static async create(userData: DatabaseUserInsert): Promise<ApiResponse<DatabaseUser>> {
    try {
      console.log('📝 UserService.create attempting to create user:', userData);
      
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error in create:', error);
        throw error;
      }

      console.log('✅ User created successfully in database:', data?.id);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error creating user:', error);
      
      // Детальная обработка ошибки Supabase
      let errorMessage = 'Неизвестная ошибка при создании пользователя';
      
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('error' in error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if ('details' in error && typeof error.details === 'string') {
          errorMessage = error.details;
        } else {
          errorMessage = JSON.stringify(error);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      return { 
        data: null, 
        error: { message: `Не удалось создать пользователя: ${errorMessage}` } 
      };
    }
  }

  /**
   * Обновить пользователя
   */
  static async update(id: string, updates: DatabaseUserUpdate): Promise<ApiResponse<DatabaseUser>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating user:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось обновить пользователя' } 
      };
    }
  }

  /**
   * Обновить пользователя по Telegram ID
   */
  static async updateByTelegramId(
    telegramId: number, 
    updates: DatabaseUserUpdate
  ): Promise<ApiResponse<DatabaseUser>> {
    try {
      console.log('🔄 UserService.updateByTelegramId updating user:', { telegramId, updates });
      
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('telegram_id', telegramId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error in updateByTelegramId:', error);
        throw error;
      }

      if (!data) {
        console.error('❌ No data returned from updateByTelegramId');
        throw new Error('Пользователь не найден или не может быть обновлен');
      }

      console.log('✅ User updated successfully:', data.id);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Error updating user by Telegram ID:', error);
      
      // Детальная обработка ошибки Supabase
      let errorMessage = 'Неизвестная ошибка при обновлении пользователя';
      
      if (error && typeof error === 'object') {
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        } else if ('error' in error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if ('details' in error && typeof error.details === 'string') {
          errorMessage = error.details;
        } else if ('hint' in error && typeof error.hint === 'string') {
          const errorObj = error as any;
          errorMessage = `${errorObj.message || 'Ошибка базы данных'} (${error.hint})`;
        } else {
          errorMessage = JSON.stringify(error);
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Проверяем, если это ошибка RLS
      if (errorMessage.includes('row-level security') || errorMessage.includes('RLS') || errorMessage.includes('policy')) {
        errorMessage = `Ошибка доступа: ${errorMessage}. Возможно, нужно обновить политики безопасности.`;
      }
      
      return { 
        data: null, 
        error: { message: `Не удалось обновить пользователя: ${errorMessage}` } 
      };
    }
  }

  /**
   * Удалить пользователя
   */
  static async delete(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось удалить пользователя' } 
      };
    }
  }

  /**
   * Получить или создать пользователя на основе данных Telegram
   */
  static async getOrCreateUser(telegramUser: TelegramWebAppUser): Promise<DatabaseUser> {
    try {
      console.log('🔄 UserService.getOrCreateUser started with:', {
        telegram_id: telegramUser.id,
        first_name: telegramUser.first_name,
        username: telegramUser.username,
        language_code: telegramUser.language_code,
        is_premium: telegramUser.is_premium
      });

      // Сначала пытаемся найти существующего пользователя
      console.log('🔍 Searching for existing user...');
      const existingUserResponse = await this.getByTelegramId(telegramUser.id);
      
      if (existingUserResponse.error && existingUserResponse.error.message) {
        console.error('❌ Error searching for existing user:', existingUserResponse.error);
        throw new Error(`Ошибка поиска пользователя: ${existingUserResponse.error.message}`);
      }
      
      if (existingUserResponse.data) {
        console.log('✅ Found existing user:', existingUserResponse.data.id);
        
        // Обновляем данные пользователя, если что-то изменилось
        const updates: DatabaseUserUpdate = {};
        let needsUpdate = false;

        if (existingUserResponse.data.first_name !== telegramUser.first_name) {
          updates.first_name = telegramUser.first_name;
          needsUpdate = true;
        }

        if (existingUserResponse.data.last_name !== telegramUser.last_name) {
          updates.last_name = telegramUser.last_name;
          needsUpdate = true;
        }

        if (existingUserResponse.data.username !== telegramUser.username) {
          updates.username = telegramUser.username;
          needsUpdate = true;
        }

        if (existingUserResponse.data.language_code !== telegramUser.language_code) {
          updates.language_code = telegramUser.language_code;
          needsUpdate = true;
        }

        if (existingUserResponse.data.is_premium !== telegramUser.is_premium) {
          updates.is_premium = telegramUser.is_premium || false;
          needsUpdate = true;
        }

        if (needsUpdate) {
          console.log('🔄 Updating user data:', updates);
          const updateResponse = await this.updateByTelegramId(telegramUser.id, updates);
          if (updateResponse.error) {
            console.error('❌ Error updating user:', updateResponse.error);
            throw new Error(`Ошибка обновления пользователя: ${updateResponse.error.message}`);
          }
          if (updateResponse.data) {
            console.log('✅ User updated successfully');
            return updateResponse.data;
          }
        }

        console.log('✅ Returning existing user without updates');
        return existingUserResponse.data;
      }

      // Создаем нового пользователя
      console.log('🔄 Creating new user...');
      const newUser: DatabaseUserInsert = {
        telegram_id: telegramUser.id,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name || null,
        username: telegramUser.username || null,
        language_code: telegramUser.language_code || 'en',
        is_premium: telegramUser.is_premium || false,
      };

      console.log('📝 New user data:', newUser);
      const createResponse = await this.create(newUser);
      
      if (createResponse.error || !createResponse.data) {
        console.error('❌ Error creating user:', createResponse.error);
        throw new Error(`Ошибка создания пользователя: ${createResponse.error?.message || 'Неизвестная ошибка'}`);
      }

      console.log('✅ User created successfully:', createResponse.data.id);
      return createResponse.data;

    } catch (error) {
      console.error('❌ Error in getOrCreateUser:', error);
      
      // Детальная информация об ошибке
      if (error instanceof Error) {
        throw new Error(`Ошибка инициализации пользователя: ${error.message}`);
      } else {
        throw new Error(`Неизвестная ошибка инициализации пользователя: ${String(error)}`);
      }
    }
  }

  /**
   * Поиск пользователей по имени или username
   */
  static async search(query: string, limit: number = 20): Promise<ApiResponse<DatabaseUser[]>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error searching users:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось найти пользователей' } 
      };
    }
  }

  /**
   * Получить список пользователей с пагинацией
   */
  static async getUsers(
    page: number = 1, 
    limit: number = 20
  ): Promise<ApiResponse<DatabaseUser[]> & { count: number }> {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null, count: count || 0 };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить список пользователей' },
        count: 0
      };
    }
  }

  /**
   * Получить премиум пользователей
   */
  static async getPremiumUsers(): Promise<ApiResponse<DatabaseUser[]>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_premium', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching premium users:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить премиум пользователей' } 
      };
    }
  }

  /**
   * Получить верифицированных пользователей
   */
  static async getVerifiedUsers(): Promise<ApiResponse<DatabaseUser[]>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_verified', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { data: data || [], error: null };
    } catch (error) {
      console.error('Error fetching verified users:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить верифицированных пользователей' } 
      };
    }
  }

  /**
   * Обновить аватар пользователя
   */
  static async updateAvatar(userId: string, avatarUrl: string): Promise<ApiResponse<DatabaseUser>> {
    return this.update(userId, { avatar_url: avatarUrl });
  }

  /**
   * Обновить профиль пользователя
   */
  static async updateProfile(
    userId: string, 
    profile: {
      first_name?: string;
      last_name?: string;
      bio?: string;
      phone?: string;
      email?: string;
    }
  ): Promise<ApiResponse<DatabaseUser>> {
    return this.update(userId, profile);
  }

  /**
   * Получить статистику пользователя
   */
  static async getUserStats(telegramId: number): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await supabase.rpc('get_user_stats', {
        user_telegram_id: telegramId
      });

      if (error) {
        throw error;
      }

      return { data: data?.[0] || null, error: null };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return { 
        data: null, 
        error: { message: 'Не удалось получить статистику пользователя' } 
      };
    }
  }

  /**
   * Проверить существование пользователя
   */
  static async exists(telegramId: number): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_id', telegramId)
        .single();

      return !!data;
    } catch {
      return false;
    }
  }

  /**
   * Конвертировать DatabaseUser в User (с преобразованием дат)
   */
  static convertToUser(dbUser: DatabaseUser): User {
    return {
      ...dbUser,
      created_at: new Date(dbUser.created_at),
      updated_at: new Date(dbUser.updated_at),
    };
  }

  /**
   * Конвертировать массив DatabaseUser в User[]
   */
  static convertToUsers(dbUsers: DatabaseUser[]): User[] {
    return dbUsers.map(this.convertToUser);
  }
}

// Экспортируем экземпляр для удобства
export const userService = UserService; 