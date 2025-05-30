/**
 * Утилиты для шаринга событий
 */

export interface ShareData {
  eventId: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

/**
 * Генерирует URL для шаринга конкретного события
 */
export function generateEventShareUrl(eventId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}?event=${eventId}`;
}

/**
 * Генерирует URL для Telegram Web App с параметром события
 */
export function generateTelegramWebAppUrl(eventId: string): string {
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
  
  // Если имя бота не настроено или равно примеру, возвращаем обычную веб-ссылку
  if (!botUsername || botUsername === 'your_bot' || botUsername === 'your_bot_username') {
    console.warn('VITE_TELEGRAM_BOT_USERNAME не настроен, используется обычная веб-ссылка');
    return generateEventShareUrl(eventId);
  }
  
  // Генерируем Mini App ссылку в формате t.me/BOT_USERNAME/APP_NAME?startapp=event_ID
  return `https://t.me/${botUsername}/My_Fiesta?startapp=event_${eventId}`;
}

/**
 * Генерирует альтернативную ссылку с обычными URL параметрами
 * Используется как fallback если startapp не работает
 */
export function generateTelegramWebAppUrlWithParams(eventId: string): string {
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
  
  if (!botUsername || botUsername === 'your_bot' || botUsername === 'your_bot_username') {
    return generateEventShareUrl(eventId);
  }
  
  // Используем обычные URL параметры вместо startapp
  return `https://t.me/${botUsername}?start=event_${eventId}`;
}

/**
 * Генерирует простую ссылку для тестирования без префикса
 */
export function generateSimpleTelegramUrl(eventId: string): string {
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
  
  if (!botUsername || botUsername === 'your_bot' || botUsername === 'your_bot_username') {
    return generateEventShareUrl(eventId);
  }
  
  // Простой формат без префикса event_
  return `https://t.me/${botUsername}?startapp=${eventId}`;
}

/**
 * Копирует текст в буфер обмена
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Получает ID события из URL параметров
 */
export function getEventIdFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('event');
}

/**
 * Получает ID события из Telegram Web App start parameter
 */
export function getEventIdFromTelegramStart(): string | null {
  try {
    // В Telegram Web App start параметр доступен через несколько способов
    if (typeof window !== 'undefined' && 'Telegram' in window) {
      const telegram = (window as any).Telegram?.WebApp;
      
      // Способ 1: Через initDataUnsafe.start_param
      let startParam = telegram?.initDataUnsafe?.start_param;
      
      // Способ 2: Через initData строку (парсим вручную)
      if (!startParam && telegram?.initData) {
        try {
          const initDataParams = new URLSearchParams(telegram.initData);
          startParam = initDataParams.get('start_param');
        } catch (e) {
          console.warn('Failed to parse initData for start_param:', e);
        }
      }
      
      // Способ 3: Проверяем URL параметры (fallback)
      if (!startParam) {
        const urlParams = new URLSearchParams(window.location.search);
        startParam = urlParams.get('startapp') || urlParams.get('start_param') || urlParams.get('start');
      }
      
      // Способ 4: Проверяем hash параметры
      if (!startParam && window.location.hash) {
        try {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          startParam = hashParams.get('startapp') || hashParams.get('start_param') || hashParams.get('start');
        } catch (e) {
          console.warn('Failed to parse hash for start_param:', e);
        }
      }
      
      console.log('🔍 Telegram start param detection:', {
        fromInitDataUnsafe: telegram?.initDataUnsafe?.start_param,
        fromInitData: telegram?.initData ? 'present' : 'missing',
        fromUrl: new URLSearchParams(window.location.search).get('startapp'),
        fromHash: window.location.hash,
        finalStartParam: startParam
      });
      
      if (startParam) {
        let eventId = null;
        
        // Формат 1: event_123 (с префиксом)
        if (startParam.startsWith('event_')) {
          eventId = startParam.replace('event_', '');
        }
        // Формат 2: evt123 (короткий префикс)
        else if (startParam.startsWith('evt')) {
          eventId = startParam.replace('evt', '');
        }
        // Формат 3: простой параметр без префикса (если это UUID или похоже на ID события)
        else if (/^[a-f0-9-]{36}$/.test(startParam) || /^[a-zA-Z0-9_-]+$/.test(startParam)) {
          eventId = startParam;
        }
        
        if (eventId) {
          console.log('✅ Event ID extracted from Telegram start param:', eventId, 'from:', startParam);
          return eventId;
        } else {
          console.warn('⚠️ Start param found but not recognized as event ID:', startParam);
        }
      }
    }
  } catch (error) {
    console.error('Failed to get start param from Telegram:', error);
  }
  
  return null;
}

/**
 * Генерирует текст для шаринга
 */
export function generateShareText(eventData: ShareData): string {
  // Используем Telegram Mini App ссылку для более нативного опыта
  const url = generateTelegramWebAppUrl(eventData.eventId);
  
  let text = `🎉 ${eventData.title}\n\n`;
  
  if (eventData.description) {
    // Ограничиваем описание для красивого шаринга
    const shortDescription = eventData.description.length > 100 
      ? eventData.description.substring(0, 100) + '...'
      : eventData.description;
    text += `${shortDescription}\n\n`;
  }
  
  text += `Присоединяйся: ${url}`;
  
  return text;
}

/**
 * Открывает нативный шаринг (если доступен) или копирует в буфер
 */
export async function shareEvent(eventData: ShareData): Promise<{ success: boolean; method: 'native' | 'clipboard' | 'telegram' }> {
  // Используем Telegram Mini App ссылку для поделиться
  const shareUrl = generateTelegramWebAppUrl(eventData.eventId);
  const shareText = `🎉 ${eventData.title}\n\n${eventData.description ? eventData.description.substring(0, 100) + (eventData.description.length > 100 ? '...' : '') + '\n\n' : ''}Присоединяйся: ${shareUrl}`;
  
  // Проверяем, доступен ли нативный шаринг в Telegram
  if (typeof window !== 'undefined' && 'Telegram' in window) {
    try {
      const telegram = (window as any).Telegram?.WebApp;
      if (telegram?.openLink) {
        // Используем Telegram шаринг с Mini App ссылкой
        const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(eventData.title)}`;
        telegram.openLink(telegramShareUrl);
        return { success: true, method: 'telegram' };
      }
    } catch (error) {
      console.error('Telegram sharing failed:', error);
    }
  }
  
  // Проверяем Web Share API
  if (navigator.share) {
    try {
      await navigator.share({
        title: eventData.title,
        text: eventData.description || 'Присоединяйся к мероприятию!',
        url: shareUrl
      });
      return { success: true, method: 'native' };
    } catch (error) {
      // Пользователь отменил шаринг или произошла ошибка
      console.log('Native sharing cancelled or failed:', error);
    }
  }
  
  // Fallback - копирование в буфер обмена
  const copied = await copyToClipboard(shareText);
  return { success: copied, method: 'clipboard' };
}

/**
 * Очищает URL от параметра события (после обработки)
 */
export function clearEventParam(): void {
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.delete('event');
    window.history.replaceState({}, '', url.toString());
  }
} 