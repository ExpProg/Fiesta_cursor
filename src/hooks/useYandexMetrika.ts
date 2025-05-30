import { useCallback } from 'react';

// Типы для Яндекс.Метрики
declare global {
  interface Window {
    ym: (
      counterId: number,
      method: string,
      ...params: any[]
    ) => void;
  }
}

const METRIKA_COUNTER_ID = 102291721;

/**
 * Хук для работы с Яндекс.Метрикой
 */
export const useYandexMetrika = () => {
  // Проверка доступности Яндекс.Метрики
  const isAvailable = useCallback((): boolean => {
    return typeof window !== 'undefined' && typeof window.ym === 'function';
  }, []);

  // Отправка цели (goal)
  const reachGoal = useCallback((target: string, params?: Record<string, any>) => {
    if (!isAvailable()) {
      console.log('🔍 YM Goal (dev):', target, params);
      return;
    }

    try {
      if (params) {
        window.ym(METRIKA_COUNTER_ID, 'reachGoal', target, params);
      } else {
        window.ym(METRIKA_COUNTER_ID, 'reachGoal', target);
      }
      console.log('📊 YM Goal sent:', target, params);
    } catch (error) {
      console.error('❌ YM Goal error:', error);
    }
  }, [isAvailable]);

  // Отправка события
  const hit = useCallback((url?: string, options?: Record<string, any>) => {
    if (!isAvailable()) {
      console.log('🔍 YM Hit (dev):', url, options);
      return;
    }

    try {
      if (url) {
        window.ym(METRIKA_COUNTER_ID, 'hit', url, options);
      } else {
        window.ym(METRIKA_COUNTER_ID, 'hit', window.location.href, options);
      }
      console.log('📊 YM Hit sent:', url || window.location.href, options);
    } catch (error) {
      console.error('❌ YM Hit error:', error);
    }
  }, [isAvailable]);

  // Отправка пользовательских параметров
  const userParams = useCallback((params: Record<string, any>) => {
    if (!isAvailable()) {
      console.log('🔍 YM UserParams (dev):', params);
      return;
    }

    try {
      window.ym(METRIKA_COUNTER_ID, 'userParams', params);
      console.log('📊 YM UserParams sent:', params);
    } catch (error) {
      console.error('❌ YM UserParams error:', error);
    }
  }, [isAvailable]);

  return {
    isAvailable: isAvailable(),
    reachGoal,
    hit,
    userParams
  };
}; 