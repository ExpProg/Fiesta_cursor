import { supabase } from '@/hooks/useSupabase';
import type { ApiResponse } from '@/types/database';

/**
 * Сервис для работы с изображениями в Supabase Storage
 */
export class ImageService {
  private static readonly BUCKET_NAME = 'event-images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  /**
   * Проверка валидности файла
   */
  private static validateFile(file: File): { isValid: boolean; error?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Поддерживаются только изображения форматов: JPEG, PNG, WebP'
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: 'Размер файла не должен превышать 5MB'
      };
    }

    return { isValid: true };
  }

  /**
   * Генерация уникального имени файла
   */
  private static generateFileName(file: File, userId: number): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop() || 'jpg';
    return `${userId}/${timestamp}_${randomString}.${extension}`;
  }

  /**
   * Загрузка изображения в Supabase Storage
   */
  static async uploadImage(file: File, userId: number): Promise<ApiResponse<string>> {
    try {
      console.log('📤 ImageService.uploadImage uploading file:', file.name);

      // Валидация файла
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          data: null,
          error: { message: validation.error! }
        };
      }

      // Генерируем уникальное имя файла
      const fileName = this.generateFileName(file, userId);
      console.log('📝 Generated file name:', fileName);

      // Загружаем файл в Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Supabase storage error:', error);
        throw error;
      }

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('Не удалось получить URL изображения');
      }

      console.log('✅ Image uploaded successfully:', urlData.publicUrl);
      return {
        data: urlData.publicUrl,
        error: null
      };

    } catch (error) {
      console.error('❌ Error uploading image:', error);
      return {
        data: null,
        error: { 
          message: error instanceof Error ? error.message : 'Не удалось загрузить изображение'
        }
      };
    }
  }

  /**
   * Удаление изображения из Storage
   */
  static async deleteImage(imageUrl: string): Promise<ApiResponse<null>> {
    try {
      console.log('🗑️ ImageService.deleteImage deleting image:', imageUrl);

      // Извлекаем путь к файлу из URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const userFolder = pathParts[pathParts.length - 2];
      const filePath = `${userFolder}/${fileName}`;

      console.log('📝 Extracted file path:', filePath);

      // Удаляем файл из Storage
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('❌ Supabase storage delete error:', error);
        throw error;
      }

      console.log('✅ Image deleted successfully');
      return {
        data: null,
        error: null
      };

    } catch (error) {
      console.error('❌ Error deleting image:', error);
      return {
        data: null,
        error: { 
          message: error instanceof Error ? error.message : 'Не удалось удалить изображение'
        }
      };
    }
  }

  /**
   * Проверка подключения к Supabase
   */
  static async checkConnection(): Promise<{ isConnected: boolean; error?: string }> {
    try {
      console.log('🔍 Checking Supabase connection...');
      
      // Простая проверка подключения
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection error:', error);
        return {
          isConnected: false,
          error: error.message
        };
      }
      
      console.log('✅ Supabase connection successful');
      return { isConnected: true };
      
    } catch (error) {
      console.error('❌ Supabase connection failed:', error);
      return {
        isConnected: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  /**
   * Проверка существования bucket (для проверки настройки)
   */
  static async checkBucketExists(): Promise<boolean> {
    try {
      // Сначала проверяем подключение
      const connectionCheck = await this.checkConnection();
      if (!connectionCheck.isConnected) {
        console.error('❌ Cannot check bucket: no connection to Supabase');
        return false;
      }
      
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('❌ Error checking buckets:', error);
        return false;
      }

      const bucketExists = data?.some(bucket => bucket.name === this.BUCKET_NAME);
      console.log(`🪣 Bucket '${this.BUCKET_NAME}' exists:`, bucketExists);
      
      return bucketExists || false;
    } catch (error) {
      console.error('❌ Error checking bucket existence:', error);
      return false;
    }
  }

  /**
   * Создание bucket (если не существует)
   */
  static async createBucket(): Promise<ApiResponse<null>> {
    try {
      console.log(`🪣 Creating bucket '${this.BUCKET_NAME}'`);

      const { error } = await supabase.storage.createBucket(this.BUCKET_NAME, {
        public: true,
        allowedMimeTypes: this.ALLOWED_TYPES,
        fileSizeLimit: this.MAX_FILE_SIZE
      });

      if (error) {
        console.error('❌ Error creating bucket:', error);
        throw error;
      }

      console.log('✅ Bucket created successfully');
      return {
        data: null,
        error: null
      };

    } catch (error) {
      console.error('❌ Error creating bucket:', error);
      return {
        data: null,
        error: { 
          message: error instanceof Error ? error.message : 'Не удалось создать bucket'
        }
      };
    }
  }
}

export const imageService = ImageService; 