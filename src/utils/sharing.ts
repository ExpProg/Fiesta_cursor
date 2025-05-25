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
  
  // URL для Telegram Web App
  return `https://t.me/${botUsername}?startapp=event_${eventId}`;
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
    // В Telegram Web App start параметр доступен через window.Telegram.WebApp.initDataUnsafe.start_param
    if (typeof window !== 'undefined' && 'Telegram' in window) {
      const telegram = (window as any).Telegram?.WebApp;
      const startParam = telegram?.initDataUnsafe?.start_param;
      
      if (startParam && startParam.startsWith('event_')) {
        return startParam.replace('event_', '');
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
  const url = generateEventShareUrl(eventData.eventId);
  
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
  const shareText = generateShareText(eventData);
  const shareUrl = generateEventShareUrl(eventData.eventId);
  
  // Проверяем, доступен ли нативный шаринг в Telegram
  if (typeof window !== 'undefined' && 'Telegram' in window) {
    try {
      const telegram = (window as any).Telegram?.WebApp;
      if (telegram?.openLink) {
        // Используем Telegram шаринг
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