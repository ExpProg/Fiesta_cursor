import { useEffect, useState } from 'react';
import { ImageService } from '@/services/imageService';

/**
 * Хук для работы с Supabase Storage для изображений
 */
export const useImageStorage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializationLog, setInitializationLog] = useState<string[]>([]);

  useEffect(() => {
    const initializeStorage = async () => {
      if (isInitialized || isInitializing) return;

      setIsInitializing(true);
      setError(null);
      setInitializationLog(['🚀 Начинаем инициализацию Storage...']);

      // Добавляем таймаут для инициализации
      const timeoutId = setTimeout(() => {
        console.warn('⏰ Storage initialization timeout');
        setError('Таймаут инициализации хранилища. Попробуйте перезагрузить страницу.');
        setInitializationLog(prev => [...prev, '⏰ Таймаут инициализации (10 сек)']);
        setIsInitializing(false);
      }, 10000); // 10 секунд

      try {
        setInitializationLog(prev => [...prev, '🔍 Проверяем переменные окружения...']);
        
        // Сначала проверяем переменные окружения
        const envCheck = ImageService.checkEnvironmentVariables();
        if (!envCheck.isValid) {
          throw new Error(`Отсутствуют переменные окружения: ${envCheck.missing.join(', ')}`);
        }
        
        setInitializationLog(prev => [...prev, '✅ Переменные окружения в порядке']);
        setInitializationLog(prev => [...prev, '🔍 Проверяем подключение к Supabase...']);
        
        // Проверяем подключение к Supabase
        const connectionCheck = await ImageService.checkConnection();
        if (!connectionCheck.isConnected) {
          throw new Error(`Ошибка подключения к Supabase: ${connectionCheck.error}`);
        }
        
        setInitializationLog(prev => [...prev, '✅ Подключение к Supabase успешно']);
        setInitializationLog(prev => [...prev, '🪣 Проверяем существование bucket...']);
        
        // Проверяем существование bucket
        const bucketExists = await ImageService.checkBucketExists();
        
        if (!bucketExists) {
          setInitializationLog(prev => [...prev, '🪣 Bucket не найден, создаем...']);
          
          // Создаем bucket если не существует
          const createResult = await ImageService.createBucket();
          
          if (createResult.error) {
            throw new Error(createResult.error.message);
          }
          
          setInitializationLog(prev => [...prev, '✅ Bucket создан успешно']);
        } else {
          setInitializationLog(prev => [...prev, '✅ Bucket уже существует']);
        }

        clearTimeout(timeoutId);
        setInitializationLog(prev => [...prev, '🎉 Инициализация завершена успешно!']);
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
          } else if (err.message.includes('переменные окружения')) {
            errorMessage = err.message;
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
        setInitializationLog(prev => [...prev, `❌ Ошибка: ${errorMessage}`]);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeStorage();
  }, [isInitialized, isInitializing]);

  return {
    isInitialized,
    isInitializing,
    error,
    initializationLog
  };
}; 