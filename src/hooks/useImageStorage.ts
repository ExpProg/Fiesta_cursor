import { useEffect, useState } from 'react';
import { ImageService } from '@/services/imageService';

/**
 * Хук для работы с Supabase Storage для изображений
 */
export const useImageStorage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStorage = async () => {
      if (isInitialized || isInitializing) return;

      setIsInitializing(true);
      setError(null);

      // Добавляем таймаут для инициализации
      const timeoutId = setTimeout(() => {
        console.warn('⏰ Storage initialization timeout');
        setError('Таймаут инициализации хранилища. Попробуйте перезагрузить страницу.');
        setIsInitializing(false);
      }, 10000); // 10 секунд

      try {
        console.log('🔍 Checking if storage bucket exists...');
        
        // Проверяем существование bucket
        const bucketExists = await ImageService.checkBucketExists();
        
        if (!bucketExists) {
          console.log('🪣 Creating storage bucket...');
          
          // Создаем bucket если не существует
          const createResult = await ImageService.createBucket();
          
          if (createResult.error) {
            throw new Error(createResult.error.message);
          }
          
          console.log('✅ Storage bucket created successfully');
        } else {
          console.log('✅ Storage bucket already exists');
        }

        clearTimeout(timeoutId);
        setIsInitialized(true);
      } catch (err) {
        console.error('❌ Error initializing storage:', err);
        clearTimeout(timeoutId);
        
        // Более детальная обработка ошибок
        let errorMessage = 'Ошибка инициализации хранилища';
        
        if (err instanceof Error) {
          if (err.message.includes('JWT')) {
            errorMessage = 'Ошибка авторизации. Попробуйте перезагрузить страницу.';
          } else if (err.message.includes('network') || err.message.includes('fetch')) {
            errorMessage = 'Проблемы с сетью. Проверьте интернет-соединение.';
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeStorage();
  }, [isInitialized, isInitializing]);

  return {
    isInitialized,
    isInitializing,
    error
  };
}; 