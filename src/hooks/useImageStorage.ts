import { useEffect, useState } from 'react';
import { ImageService } from '@/services/imageService';

/**
 * Проверка, запущено ли приложение в Telegram WebApp
 */
const isTelegramWebApp = (): boolean => {
  return !!(window as any).Telegram?.WebApp;
};

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

      // В Telegram WebApp пропускаем Storage и сразу переходим в режим файлов
      if (isTelegramWebApp()) {
        setInitializationLog(['📱 Telegram WebApp обнаружен', '⏭️ Пропускаем Storage, используем режим файлов']);
        setIsInitialized(false); // Остаемся в режиме файлов
        return;
      }

      setIsInitializing(true);
      setError(null);
      setInitializationLog(['🚀 Начинаем инициализацию Storage...']);

      // Более короткий таймаут для диагностики
      const timeoutId = setTimeout(() => {
        console.warn('⏰ Storage initialization timeout after 5 seconds');
        setError('Таймаут инициализации (5 сек). Возможно проблема с подключением к Supabase.');
        setInitializationLog(prev => [...prev, '⏰ ТАЙМАУТ! Инициализация зависла на 5+ секунд']);
        setIsInitializing(false);
      }, 5000); // Сократили до 5 секунд

      try {
        setInitializationLog(prev => [...prev, '🔍 Проверяем переменные окружения...']);
        
        // Добавляем задержку для отображения лога
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Сначала проверяем переменные окружения
        const envCheck = ImageService.checkEnvironmentVariables();
        if (!envCheck.isValid) {
          throw new Error(`Отсутствуют переменные окружения: ${envCheck.missing.join(', ')}`);
        }
        
        setInitializationLog(prev => [...prev, '✅ Переменные окружения в порядке']);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setInitializationLog(prev => [...prev, '🔍 Проверяем подключение к Supabase...']);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Проверяем подключение к Supabase с собственным таймаутом
        const connectionPromise = ImageService.checkConnection();
        const connectionTimeout = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Таймаут подключения к Supabase (3 сек)')), 3000)
        );
        
        const connectionCheck = await Promise.race([connectionPromise, connectionTimeout]);
        
        if (!connectionCheck.isConnected) {
          throw new Error(`Ошибка подключения к Supabase: ${connectionCheck.error}`);
        }
        
        setInitializationLog(prev => [...prev, '✅ Подключение к Supabase успешно']);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setInitializationLog(prev => [...prev, '🪣 Проверяем существование bucket...']);
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Проверяем существование bucket с таймаутом
        const bucketPromise = ImageService.checkBucketExists();
        const bucketTimeout = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Таймаут проверки bucket (3 сек)')), 3000)
        );
        
        const bucketExists = await Promise.race([bucketPromise, bucketTimeout]);
        
        if (!bucketExists) {
          setInitializationLog(prev => [...prev, '🪣 Bucket не найден, создаем...']);
          await new Promise(resolve => setTimeout(resolve, 100));
          
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
          if (err.message.includes('Таймаут')) {
            errorMessage = err.message;
          } else if (err.message.includes('JWT')) {
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
    initializationLog,
    isTelegramWebApp: isTelegramWebApp()
  };
}; 