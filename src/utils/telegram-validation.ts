import type { TelegramWebAppInitData, TelegramWebAppUser } from '@/types/telegram';

/**
 * Парсинг initData строки в объект
 */
export function parseInitData(initData: string): TelegramWebAppInitData | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const data: Partial<TelegramWebAppInitData> = {};

    // Парсим основные поля
    data.query_id = urlParams.get('query_id') || undefined;
    data.chat_type = urlParams.get('chat_type') || undefined;
    data.chat_instance = urlParams.get('chat_instance') || undefined;
    data.start_param = urlParams.get('start_param') || undefined;
    data.hash = urlParams.get('hash') || '';
    
    const authDate = urlParams.get('auth_date');
    if (authDate) {
      data.auth_date = parseInt(authDate, 10);
    } else {
      return null;
    }

    const canSendAfter = urlParams.get('can_send_after');
    if (canSendAfter) {
      data.can_send_after = parseInt(canSendAfter, 10);
    }

    // Парсим пользователя
    const userStr = urlParams.get('user');
    if (userStr) {
      try {
        data.user = JSON.parse(decodeURIComponent(userStr)) as TelegramWebAppUser;
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }

    // Парсим получателя
    const receiverStr = urlParams.get('receiver');
    if (receiverStr) {
      try {
        data.receiver = JSON.parse(decodeURIComponent(receiverStr)) as TelegramWebAppUser;
      } catch (e) {
        console.error('Failed to parse receiver data:', e);
      }
    }

    // Парсим чат
    const chatStr = urlParams.get('chat');
    if (chatStr) {
      try {
        data.chat = JSON.parse(decodeURIComponent(chatStr));
      } catch (e) {
        console.error('Failed to parse chat data:', e);
      }
    }

    return data as TelegramWebAppInitData;
  } catch (error) {
    console.error('Failed to parse initData:', error);
    return null;
  }
}

/**
 * Проверка базовой валидности initData
 */
export function validateInitDataBasic(initData: TelegramWebAppInitData): boolean {
  // Проверяем обязательные поля
  if (!initData.hash || !initData.auth_date) {
    return false;
  }

  // Проверяем, что auth_date не слишком старый (не более 24 часов)
  const now = Math.floor(Date.now() / 1000);
  const maxAge = 24 * 60 * 60; // 24 часа в секундах
  
  if (now - initData.auth_date > maxAge) {
    return false;
  }

  return true;
}

/**
 * Проверка валидности пользователя
 */
export function validateUser(user: TelegramWebAppUser): boolean {
  if (!user || typeof user.id !== 'number' || !user.first_name) {
    return false;
  }

  // Проверяем, что ID пользователя положительный
  if (user.id <= 0) {
    return false;
  }

  // Проверяем базовые ограничения на длину полей
  if (user.first_name.length > 64 || 
      (user.last_name && user.last_name.length > 64) ||
      (user.username && user.username.length > 32)) {
    return false;
  }

  return true;
}

/**
 * Создание строки данных для валидации хеша (без самого хеша)
 */
export function createDataCheckString(initData: string): string {
  const urlParams = new URLSearchParams(initData);
  
  // Удаляем hash из параметров
  urlParams.delete('hash');
  
  // Сортируем параметры по ключу
  const sortedParams = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
    
  return sortedParams;
}

/**
 * Проверка срока действия initData
 */
export function isInitDataExpired(authDate: number, maxAgeSeconds: number = 86400): boolean {
  const now = Math.floor(Date.now() / 1000);
  return (now - authDate) > maxAgeSeconds;
}

/**
 * Получение информации о платформе из user agent
 */
export function getPlatformInfo(): {
  platform: string;
  version: string;
  isTelegramDesktop: boolean;
  isTelegramMobile: boolean;
} {
  const userAgent = navigator.userAgent.toLowerCase();
  
  let platform = 'unknown';
  let version = '0.0';
  let isTelegramDesktop = false;
  let isTelegramMobile = false;

  // Проверяем Telegram Desktop
  if (userAgent.includes('telegram')) {
    if (userAgent.includes('desktop')) {
      platform = 'tdesktop';
      isTelegramDesktop = true;
    } else {
      platform = 'telegram';
      isTelegramMobile = true;
    }
    
    // Пытаемся извлечь версию
    const versionMatch = userAgent.match(/telegram[\/\s](\d+\.\d+)/);
    if (versionMatch) {
      version = versionMatch[1];
    }
  } else if (userAgent.includes('android')) {
    platform = 'android';
  } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    platform = 'ios';
  } else if (userAgent.includes('mac')) {
    platform = 'macos';
  } else if (userAgent.includes('windows')) {
    platform = 'windows';
  } else if (userAgent.includes('linux')) {
    platform = 'linux';
  }

  return {
    platform,
    version,
    isTelegramDesktop,
    isTelegramMobile
  };
}

/**
 * Проверка поддержки версии API
 */
export function isVersionAtLeast(current: string, required: string): boolean {
  const currentParts = current.split('.').map(Number);
  const requiredParts = required.split('.').map(Number);
  
  for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const requiredPart = requiredParts[i] || 0;
    
    if (currentPart > requiredPart) return true;
    if (currentPart < requiredPart) return false;
  }
  
  return true;
}

/**
 * Безопасное получение данных пользователя с валидацией
 */
export function getSafeUserData(user: TelegramWebAppUser | null): {
  id: number | null;
  firstName: string;
  lastName: string;
  username: string;
  languageCode: string;
  isPremium: boolean;
} {
  if (!user || !validateUser(user)) {
    return {
      id: null,
      firstName: '',
      lastName: '',
      username: '',
      languageCode: 'en',
      isPremium: false
    };
  }

  return {
    id: user.id,
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    username: user.username || '',
    languageCode: user.language_code || 'en',
    isPremium: user.is_premium || false
  };
}

/**
 * Создание безопасного объекта initData для логирования (без чувствительных данных)
 */
export function createSafeInitDataForLogging(initData: TelegramWebAppInitData | null): any {
  if (!initData) return null;

  return {
    hasUser: !!initData.user,
    hasQuery: !!initData.query_id,
    hasChat: !!initData.chat,
    authDate: initData.auth_date,
    chatType: initData.chat_type,
    startParam: initData.start_param ? '***' : undefined,
    userLanguage: initData.user?.language_code,
    userId: initData.user?.id ? '***' : undefined
  };
} 