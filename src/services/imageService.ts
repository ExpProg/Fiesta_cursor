import { supabase } from '@/hooks/useSupabase';
import type { ApiResponse } from '@/types/database';

/**
 * Сервис для работы с изображениями в Supabase Storage
 */
export class ImageService {
  private static readonly BUCKET_NAME = 'event-images';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  private static readonly UPLOAD_TIMEOUT = 30000; // 30 секунд таймаут для загрузки
  private static readonly COMPRESSION_QUALITY = 0.8; // Качество сжатия
  private static readonly MAX_DIMENSION = 1920; // Максимальное разрешение

  /**
   * Проверка переменных окружения
   */
  static checkEnvironmentVariables(): { isValid: boolean; missing: string[] } {
    const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    const missing: string[] = [];
    
    for (const variable of required) {
      if (!import.meta.env[variable]) {
        missing.push(variable);
      }
    }
    
    console.log('🔍 Environment variables check:', {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
      VITE_TELEGRAM_BOT_USERNAME: import.meta.env.VITE_TELEGRAM_BOT_USERNAME ? '✅ Set' : '⚠️ Optional',
      missing
    });
    
    return {
      isValid: missing.length === 0,
      missing
    };
  }

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
   * Сжатие изображения с помощью Canvas
   */
  private static async compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        try {
          // Вычисляем новые размеры с сохранением пропорций
          let { width, height } = img;
          
          if (width > this.MAX_DIMENSION || height > this.MAX_DIMENSION) {
            if (width > height) {
              height = (height * this.MAX_DIMENSION) / width;
              width = this.MAX_DIMENSION;
            } else {
              width = (width * this.MAX_DIMENSION) / height;
              height = this.MAX_DIMENSION;
            }
          }

          // Устанавливаем размеры canvas
          canvas.width = width;
          canvas.height = height;

          // Рисуем изображение на canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Конвертируем canvas в blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              // Создаем новый File объект
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });

              console.log('🗜️ Image compressed:', {
                originalSize: (file.size / 1024).toFixed(1) + 'KB',
                compressedSize: (compressedFile.size / 1024).toFixed(1) + 'KB',
                originalDimensions: `${img.naturalWidth}x${img.naturalHeight}`,
                newDimensions: `${width}x${height}`,
                compressionRatio: ((1 - compressedFile.size / file.size) * 100).toFixed(1) + '%'
              });

              resolve(compressedFile);
            },
            file.type,
            this.COMPRESSION_QUALITY
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Загрузка изображения с таймаутом
   */
  private static async uploadWithTimeout(file: File, fileName: string): Promise<any> {
    return Promise.race([
      supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Таймаут загрузки изображения')), this.UPLOAD_TIMEOUT)
      )
    ]);
  }

  /**
   * Загрузка изображения в Supabase Storage
   */
  static async uploadImage(file: File, userId: number): Promise<ApiResponse<string>> {
    const startTime = performance.now();
    
    try {
      console.log('📤 ImageService.uploadImage uploading file:', file.name, `(${(file.size / 1024).toFixed(1)}KB)`);

      // Валидация файла
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          data: null,
          error: { message: validation.error! }
        };
      }

      // Сжимаем изображение для ускорения загрузки
      let processedFile = file;
      try {
        if (file.size > 500 * 1024) { // Сжимаем файлы больше 500KB
          console.log('🗜️ Compressing large image...');
          processedFile = await this.compressImage(file);
        }
      } catch (compressionError) {
        console.warn('⚠️ Image compression failed, using original file:', compressionError);
        // Продолжаем с оригинальным файлом
      }

      // Генерируем уникальное имя файла
      const fileName = this.generateFileName(processedFile, userId);
      console.log('📝 Generated file name:', fileName);

      // Загружаем файл в Storage с таймаутом
      const { data, error } = await this.uploadWithTimeout(processedFile, fileName);

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

      const uploadTime = performance.now() - startTime;
      console.log('✅ Image uploaded successfully:', {
        url: urlData.publicUrl,
        uploadTime: `${uploadTime.toFixed(0)}ms`,
        finalSize: `${(processedFile.size / 1024).toFixed(1)}KB`
      });

      return {
        data: urlData.publicUrl,
        error: null
      };

    } catch (error) {
      const uploadTime = performance.now() - startTime;
      console.error('❌ Error uploading image:', {
        error: error instanceof Error ? error.message : 'unknown_error',
        uploadTime: `${uploadTime.toFixed(0)}ms`,
        fileSize: `${(file.size / 1024).toFixed(1)}KB`
      });

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