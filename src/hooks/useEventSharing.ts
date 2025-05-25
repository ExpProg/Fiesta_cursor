import { useEffect, useState } from 'react';
import { getEventIdFromUrl, getEventIdFromTelegramStart, clearEventParam } from '@/utils/sharing';
import { EventService } from '@/services/eventService';
import type { DatabaseEvent } from '@/types/database';

interface UseEventSharingReturn {
  sharedEvent: DatabaseEvent | null;
  isLoadingSharedEvent: boolean;
  sharedEventError: string | null;
  clearSharedEvent: () => void;
}

/**
 * Хук для обработки события, переданного через URL или Telegram start parameter
 */
export function useEventSharing(): UseEventSharingReturn {
  const [sharedEvent, setSharedEvent] = useState<DatabaseEvent | null>(null);
  const [isLoadingSharedEvent, setIsLoadingSharedEvent] = useState(false);
  const [sharedEventError, setSharedEventError] = useState<string | null>(null);

  useEffect(() => {
    const handleSharedEvent = async () => {
      // Получаем ID события из URL параметров или Telegram start parameter
      const eventIdFromUrl = getEventIdFromUrl();
      const eventIdFromTelegram = getEventIdFromTelegramStart();
      const eventId = eventIdFromUrl || eventIdFromTelegram;

      if (!eventId) {
        return;
      }

      console.log('🔗 Found shared event ID:', eventId);

      setIsLoadingSharedEvent(true);
      setSharedEventError(null);

      try {
        // Загружаем данные события
        const response = await EventService.getById(eventId);
        
        if (response.error || !response.data) {
          throw new Error(response.error?.message || 'Событие не найдено');
        }

        console.log('✅ Shared event loaded:', response.data);
        setSharedEvent(response.data);

        // Очищаем URL параметр, чтобы он не мешал дальнейшей навигации
        if (eventIdFromUrl) {
          clearEventParam();
        }

      } catch (error) {
        console.error('❌ Failed to load shared event:', error);
        setSharedEventError(error instanceof Error ? error.message : 'Ошибка загрузки события');
      } finally {
        setIsLoadingSharedEvent(false);
      }
    };

    handleSharedEvent();
  }, []); // Выполняется только при монтировании

  const clearSharedEvent = () => {
    setSharedEvent(null);
    setSharedEventError(null);
  };

  return {
    sharedEvent,
    isLoadingSharedEvent,
    sharedEventError,
    clearSharedEvent
  };
} 