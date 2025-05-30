import { useCallback, useEffect } from 'react';

// Типы для Яндекс.Метрики и Telegram WebApp
declare global {
  interface Window {
    ym: (
      counterId: number,
      method: string,
      ...params: any[]
    ) => void;
    Telegram?: {
      WebApp?: {
        platform: string;
        version: string;
        viewportHeight: number;
        initDataUnsafe?: {
          user?: {
            id: number;
          };
        };
      };
    };
  }
}

const METRIKA_COUNTER_ID = 102291721;

/**
 * Хук для работы с Яндекс.Метрикой
 */
export const useYandexMetrika = () => {
  // Проверка доступности Яндекс.Метрики
  const isAvailable = useCallback((): boolean => {
    const available = typeof window !== 'undefined' && typeof window.ym === 'function';
    
    // Логируем состояние только в development или если это Telegram
    if (import.meta.env.MODE === 'development' || typeof window !== 'undefined' && 'Telegram' in window) {
      console.log('🔍 YM availability check:', {
        available,
        hasWindow: typeof window !== 'undefined',
        hasYM: typeof window?.ym === 'function',
        isTelegram: typeof window !== 'undefined' && 'Telegram' in window,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'N/A'
      });
    }
    
    return available;
  }, []);

  // Инициализация и диагностика при монтировании
  useEffect(() => {
    const checkMetrika = () => {
      const available = isAvailable();
      const isTelegram = typeof window !== 'undefined' && 'Telegram' in window;
      
      console.log('📊 Yandex Metrika initialization check:', {
        available,
        isTelegram,
        counterId: METRIKA_COUNTER_ID,
        timestamp: new Date().toISOString()
      });

      if (available && isTelegram) {
        // Отправляем событие успешной инициализации в Telegram
        try {
          window.ym(METRIKA_COUNTER_ID, 'reachGoal', 'telegram_webapp_init', {
            platform: window.Telegram?.WebApp?.platform || 'unknown',
            version: window.Telegram?.WebApp?.version || 'unknown'
          });
          console.log('📊 Telegram WebApp init event sent');
        } catch (error) {
          console.error('❌ Failed to send Telegram init event:', error);
        }
      }
    };

    // Даем время на загрузку скриптов
    const timer = setTimeout(checkMetrika, 2000);
    return () => clearTimeout(timer);
  }, [isAvailable]);

  // Отправка цели (goal)
  const reachGoal = useCallback((target: string, params?: Record<string, any>) => {
    const available = isAvailable();
    const isTelegram = typeof window !== 'undefined' && 'Telegram' in window;
    
    if (!available) {
      console.log('🔍 YM Goal (unavailable):', target, params, {
        isTelegram,
        hasYM: typeof window?.ym === 'function'
      });
      return;
    }

    try {
      // Добавляем информацию о Telegram если доступно
      const enrichedParams = params ? { ...params } : {};
      if (isTelegram && window.Telegram?.WebApp) {
        enrichedParams.telegram_platform = window.Telegram.WebApp.platform;
        enrichedParams.telegram_version = window.Telegram.WebApp.version;
      }

      if (Object.keys(enrichedParams).length > 0) {
        window.ym(METRIKA_COUNTER_ID, 'reachGoal', target, enrichedParams);
      } else {
        window.ym(METRIKA_COUNTER_ID, 'reachGoal', target);
      }
      
      console.log('📊 YM Goal sent:', target, enrichedParams);
    } catch (error) {
      console.error('❌ YM Goal error:', error, { target, params });
    }
  }, [isAvailable]);

  // Отправка события
  const hit = useCallback((url?: string, options?: Record<string, any>) => {
    const available = isAvailable();
    
    if (!available) {
      console.log('🔍 YM Hit (unavailable):', url, options);
      return;
    }

    try {
      const targetUrl = url || window.location.href;
      const enrichedOptions = options ? { ...options } : {};
      
      // Добавляем информацию о Telegram если доступно
      if (typeof window !== 'undefined' && 'Telegram' in window && window.Telegram?.WebApp) {
        enrichedOptions.telegram_referrer = 'telegram_webapp';
      }

      if (Object.keys(enrichedOptions).length > 0) {
        window.ym(METRIKA_COUNTER_ID, 'hit', targetUrl, enrichedOptions);
      } else {
        window.ym(METRIKA_COUNTER_ID, 'hit', targetUrl);
      }
      
      console.log('📊 YM Hit sent:', targetUrl, enrichedOptions);
    } catch (error) {
      console.error('❌ YM Hit error:', error, { url, options });
    }
  }, [isAvailable]);

  // Отправка пользовательских параметров
  const userParams = useCallback((params: Record<string, any>) => {
    const available = isAvailable();
    
    if (!available) {
      console.log('🔍 YM UserParams (unavailable):', params);
      return;
    }

    try {
      // Добавляем информацию о Telegram если доступно
      const enrichedParams = { ...params };
      if (typeof window !== 'undefined' && 'Telegram' in window && window.Telegram?.WebApp) {
        enrichedParams.is_telegram_webapp = true;
        enrichedParams.telegram_platform = window.Telegram.WebApp.platform;
        enrichedParams.telegram_version = window.Telegram.WebApp.version;
        enrichedParams.telegram_viewport_height = window.Telegram.WebApp.viewportHeight;
      }

      window.ym(METRIKA_COUNTER_ID, 'userParams', enrichedParams);
      console.log('📊 YM UserParams sent:', enrichedParams);
    } catch (error) {
      console.error('❌ YM UserParams error:', error, { params });
    }
  }, [isAvailable]);

  return {
    isAvailable: isAvailable(),
    reachGoal,
    hit,
    userParams
  };
}; 