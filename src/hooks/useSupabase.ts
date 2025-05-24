import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Database, RealtimeEvent, SubscriptionOptions } from '@/types/database';
import { useTelegram } from '@/components/TelegramProvider';

// Получаем переменные окружения
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL и Anon Key должны быть определены в переменных окружения');
}

// Создаем клиент Supabase
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Не используем сессии, так как аутентификация через Telegram
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface UseSupabaseOptions {
  enableRealtime?: boolean;
  autoSetUserId?: boolean;
}

export interface UseSupabaseReturn {
  // Клиент Supabase
  client: SupabaseClient<Database>;
  
  // Состояние подключения
  isConnected: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Real-time подписки
  subscribe: <T = any>(
    table: string,
    callback: (event: RealtimeEvent<T>) => void,
    options?: SubscriptionOptions
  ) => (() => void) | null;
  
  unsubscribe: (subscription: RealtimeChannel) => void;
  unsubscribeAll: () => void;
  
  // Утилиты для аутентификации
  setUserContext: (telegramId: number) => Promise<void>;
  clearUserContext: () => Promise<void>;
  
  // Обработка ошибок
  handleError: (error: any) => string;
  
  // Информация о соединении
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastError: string | null;
  retryCount: number;
  
  // Утилиты
  executeRPC: <T = any>(functionName: string, params?: Record<string, any>) => Promise<T>;
  ping: () => Promise<boolean>;
  
  // Метрики
  metrics: {
    queriesExecuted: number;
    errorsEncountered: number;
    lastQueryTime: number | null;
    averageResponseTime: number;
  };
}

/**
 * Хук для работы с Supabase клиентом
 */
export const useSupabase = (options: UseSupabaseOptions = {}): UseSupabaseReturn => {
  const { enableRealtime = true, autoSetUserId = true } = options;
  const { user: telegramUser, isInitialized: telegramInitialized } = useTelegram();
  
  // Состояния
  const [isConnected, setIsConnected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const [lastError, setLastError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Метрики
  const [metrics, setMetrics] = useState({
    queriesExecuted: 0,
    errorsEncountered: 0,
    lastQueryTime: null as number | null,
    averageResponseTime: 0,
  });
  
  // Refs для подписок и таймеров
  const subscriptionsRef = useRef<Set<RealtimeChannel>>(new Set());
  const responseTimesRef = useRef<number[]>([]);
  const initializationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Обработка ошибок
  const handleError = useCallback((error: any): string => {
    let errorMessage = 'Неизвестная ошибка';
    
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    } else if (error?.error_description) {
      errorMessage = error.error_description;
    } else if (error?.details) {
      errorMessage = error.details;
    }
    
    setMetrics(prev => ({
      ...prev,
      errorsEncountered: prev.errorsEncountered + 1,
    }));
    
    setLastError(errorMessage);
    console.error('Supabase error:', error);
    
    return errorMessage;
  }, []);
  
  // Установка контекста пользователя для RLS
  const setUserContext = useCallback(async (telegramId: number): Promise<void> => {
    try {
      // Устанавливаем переменную сессии для RLS политик
      const { error } = await supabase.rpc('set_config', {
        setting_name: 'app.current_user_telegram_id',
        setting_value: telegramId.toString(),
        is_local: true
      });
      
      if (error) {
        throw error;
      }
      
      console.log('User context set for Telegram ID:', telegramId);
    } catch (err) {
      console.warn('Failed to set user context:', err);
      // Не блокируем работу приложения из-за этой ошибки
    }
  }, []);
  
  // Очистка контекста пользователя
  const clearUserContext = useCallback(async (): Promise<void> => {
    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.current_user_telegram_id',
        setting_value: '',
        is_local: true
      });
    } catch (err) {
      console.warn('Failed to clear user context:', err);
    }
  }, []);
  
  // Выполнение RPC функций
  const executeRPC = useCallback(async <T = any>(
    functionName: string, 
    params: Record<string, any> = {}
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const { data, error } = await supabase.rpc(functionName, params);
      
      if (error) {
        throw error;
      }
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      // Обновляем метрики
      responseTimesRef.current.push(responseTime);
      if (responseTimesRef.current.length > 100) {
        responseTimesRef.current.shift(); // Храним только последние 100 замеров
      }
      
      setMetrics(prev => ({
        ...prev,
        queriesExecuted: prev.queriesExecuted + 1,
        lastQueryTime: Date.now(),
        averageResponseTime: responseTimesRef.current.reduce((a, b) => a + b, 0) / responseTimesRef.current.length,
      }));
      
      return data as T;
    } catch (err) {
      handleError(err);
      throw err;
    }
  }, [handleError]);
  
  // Ping для проверки соединения
  const ping = useCallback(async (): Promise<boolean> => {
    try {
      const { error } = await supabase.from('users').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }, []);
  
  // Создание Real-time подписки
  const subscribe = useCallback(<T = any>(
    table: string,
    callback: (event: RealtimeEvent<T>) => void,
    options: SubscriptionOptions = {}
  ): (() => void) | null => {
    if (!enableRealtime || !isConnected) {
      console.warn('Real-time subscriptions are disabled or not connected');
      return null;
    }
    
    try {
      const channel = supabase
        .channel(`${table}_changes_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: options.event || '*',
            schema: options.schema || 'public',
            table: table,
            filter: options.filter,
          },
          (payload) => {
            const event: RealtimeEvent<T> = {
              eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              new: payload.new as T | null,
              old: payload.old as T | null,
              table: payload.table,
              schema: payload.schema,
              commit_timestamp: payload.commit_timestamp,
            };
            
            callback(event);
          }
        )
        .subscribe((status) => {
          console.log(`Subscription status for ${table}:`, status);
          
          if (status === 'SUBSCRIBED') {
            subscriptionsRef.current.add(channel);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Subscription error for ${table}`);
            subscriptionsRef.current.delete(channel);
          }
        });
      
      // Возвращаем функцию для отписки
      return () => {
        channel.unsubscribe();
        subscriptionsRef.current.delete(channel);
      };
      
    } catch (err) {
      console.error('Failed to create subscription:', err);
      return null;
    }
  }, [enableRealtime, isConnected]);
  
  // Отписка от конкретной подписки
  const unsubscribe = useCallback((subscription: RealtimeChannel) => {
    subscription.unsubscribe();
    subscriptionsRef.current.delete(subscription);
  }, []);
  
  // Отписка от всех подписок
  const unsubscribeAll = useCallback(() => {
    subscriptionsRef.current.forEach(subscription => {
      subscription.unsubscribe();
    });
    subscriptionsRef.current.clear();
  }, []);
  
  // Инициализация соединения
  const initializeConnection = useCallback(async () => {
    try {
      setConnectionStatus('connecting');
      setError(null);
      
      // Проверяем соединение
      const isHealthy = await ping();
      
      if (isHealthy) {
        setIsConnected(true);
        setConnectionStatus('connected');
        setRetryCount(0);
        
        // Устанавливаем контекст пользователя если есть данные Telegram
        if (autoSetUserId && telegramUser) {
          await setUserContext(telegramUser.id);
        }
        
        setIsInitialized(true);
        console.log('Supabase client initialized successfully');
      } else {
        throw new Error('Health check failed');
      }
    } catch (err) {
      const errorMessage = handleError(err);
      setError(errorMessage);
      setIsConnected(false);
      setConnectionStatus('error');
      setRetryCount(prev => prev + 1);
      
      // Автоматическая переподключение с экспоненциальной задержкой
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
      
      if (retryCount < 5) {
        initializationTimeoutRef.current = setTimeout(initializeConnection, retryDelay);
      }
    }
  }, [autoSetUserId, telegramUser, handleError, ping, setUserContext, retryCount]);
  
  // Инициализация при монтировании и изменении Telegram пользователя
  useEffect(() => {
    if (telegramInitialized) {
      initializeConnection();
    }
    
    return () => {
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
      }
    };
  }, [telegramInitialized, initializeConnection]);
  
  // Обновление контекста пользователя при изменении Telegram пользователя
  useEffect(() => {
    if (isConnected && autoSetUserId && telegramUser) {
      setUserContext(telegramUser.id);
    }
  }, [isConnected, autoSetUserId, telegramUser, setUserContext]);
  
  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      unsubscribeAll();
      if (initializationTimeoutRef.current) {
        clearTimeout(initializationTimeoutRef.current);
      }
    };
  }, [unsubscribeAll]);
  
  // Мониторинг состояния соединения
  useEffect(() => {
    if (!enableRealtime) return;
    
    const connectionMonitor = setInterval(async () => {
      if (isConnected) {
        const isHealthy = await ping();
        if (!isHealthy) {
          setIsConnected(false);
          setConnectionStatus('disconnected');
          initializeConnection();
        }
      }
    }, 30000); // Проверяем каждые 30 секунд
    
    return () => clearInterval(connectionMonitor);
  }, [enableRealtime, isConnected, ping, initializeConnection]);
  
  return {
    client: supabase,
    isConnected,
    isInitialized,
    error,
    subscribe,
    unsubscribe,
    unsubscribeAll,
    setUserContext,
    clearUserContext,
    handleError,
    connectionStatus,
    lastError,
    retryCount,
    executeRPC,
    ping,
    metrics,
  };
};

// Создаем специализированные хуки для конкретных таблиц
export const useSupabaseUsers = () => {
  const { client, handleError } = useSupabase();
  
  return {
    client: client.from('users'),
    handleError,
  };
};

export const useSupabaseEvents = () => {
  const { client, handleError } = useSupabase();
  
  return {
    client: client.from('events'),
    handleError,
  };
};

export const useSupabaseBookings = () => {
  const { client, handleError, subscribe } = useSupabase();
  
  return {
    client: client.from('bookings'),
    handleError,
    subscribe,
  };
};

export const useSupabasePayments = () => {
  const { client, handleError, subscribe } = useSupabase();
  
  return {
    client: client.from('payments'),
    handleError,
    subscribe,
  };
};

// Экспортируем клиент для прямого использования
export { supabase };
export default useSupabase; 