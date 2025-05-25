import React, { createContext, useContext, ReactNode } from 'react';
import { useTelegramWebApp, UseTelegramWebAppReturn } from '@/hooks/useTelegramWebApp';

// Создаем контекст
const TelegramContext = createContext<UseTelegramWebAppReturn | null>(null);

// Props для провайдера
interface TelegramProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
  enableDevMode?: boolean;
}

/**
 * Провайдер контекста Telegram WebApp
 * Предоставляет доступ к функциональности Telegram WebApp через Context API
 */
export const TelegramProvider: React.FC<TelegramProviderProps> = ({
  children,
  fallback,
  enableDevMode = true
}) => {
  const telegramData = useTelegramWebApp();

  // Показываем fallback во время загрузки
  if (telegramData.isLoading && fallback) {
    return <>{fallback}</>;
  }

  // Показываем ошибку если не удалось инициализировать
  if (telegramData.error && !enableDevMode) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Ошибка инициализации Telegram WebApp
          </h2>
          <p className="text-gray-600 mb-4">{telegramData.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    );
  }

  return (
    <TelegramContext.Provider value={telegramData}>
      {children}
    </TelegramContext.Provider>
  );
};

/**
 * Хук для использования контекста Telegram WebApp
 * @throws {Error} Если используется вне TelegramProvider
 */
export const useTelegram = (): UseTelegramWebAppReturn => {
  const context = useContext(TelegramContext);
  
  if (!context) {
    throw new Error(
      'useTelegram must be used within a TelegramProvider. ' +
      'Make sure to wrap your component tree with <TelegramProvider>.'
    );
  }
  
  return context;
};

/**
 * Хук для безопасного использования контекста Telegram WebApp
 * Возвращает null если контекст недоступен вместо выбрасывания ошибки
 */
export const useTelegramSafe = (): UseTelegramWebAppReturn | null => {
  return useContext(TelegramContext);
};

/**
 * HOC для компонентов, которым нужен доступ к Telegram WebApp
 */
export function withTelegram<P extends object>(
  Component: React.ComponentType<P & { telegram: UseTelegramWebAppReturn }>
) {
  const WrappedComponent = (props: P) => {
    const telegram = useTelegram();
    return <Component {...props} telegram={telegram} />;
  };
  
  WrappedComponent.displayName = `withTelegram(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Компонент для условного рендеринга в зависимости от состояния Telegram WebApp
 */
interface TelegramGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireUser?: boolean;
  requireInitialized?: boolean;
  minVersion?: string;
}

export const TelegramGate: React.FC<TelegramGateProps> = ({
  children,
  fallback,
  requireUser = false,
  requireInitialized = true,
  minVersion
}) => {
  const telegram = useTelegramSafe();

  // Если контекст недоступен
  if (!telegram) {
    return fallback ? <>{fallback}</> : null;
  }

  // Проверяем инициализацию
  if (requireInitialized && !telegram.isInitialized) {
    return fallback ? <>{fallback}</> : null;
  }

  // Проверяем наличие пользователя
  if (requireUser && !telegram.user) {
    return fallback ? <>{fallback}</> : null;
  }

  // Проверяем версию
  if (minVersion && !telegram.isVersionAtLeast(minVersion)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

/**
 * Компонент для отображения информации о пользователе
 * Показывает аватарку слева, имя и сокращенную фамилию справа
 */
export const TelegramUserInfo: React.FC<{
  className?: string;
  showAvatar?: boolean;
  showPremium?: boolean;
}> = ({ 
  className = '', 
  showAvatar = true, 
  showPremium = false
}) => {
  const { user, safeUserData } = useTelegram();

  if (!user) {
    return null;
  }

  // Сокращаем фамилию до одной буквы
  const shortLastName = safeUserData.lastName 
    ? safeUserData.lastName.charAt(0).toUpperCase() + '.'
    : '';

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {showAvatar && (
        <div className="w-10 h-10 bg-telegram-blue rounded-full flex items-center justify-center text-white font-medium">
          {safeUserData.firstName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {safeUserData.firstName} {shortLastName}
        </p>
      </div>
    </div>
  );
};

/**
 * Компонент для адаптации темы под Telegram
 */
export const TelegramThemeAdapter: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  const { themeParams, colorScheme } = useTelegram();

  // Применяем CSS переменные для темы
  const themeStyle: React.CSSProperties = {
    '--tg-theme-bg-color': themeParams.bg_color || (colorScheme === 'dark' ? '#17212b' : '#ffffff'),
    '--tg-theme-text-color': themeParams.text_color || (colorScheme === 'dark' ? '#ffffff' : '#000000'),
    '--tg-theme-hint-color': themeParams.hint_color || (colorScheme === 'dark' ? '#708499' : '#999999'),
    '--tg-theme-link-color': themeParams.link_color || '#2481cc',
    '--tg-theme-button-color': themeParams.button_color || '#2481cc',
    '--tg-theme-button-text-color': themeParams.button_text_color || '#ffffff',
    '--tg-theme-secondary-bg-color': themeParams.secondary_bg_color || (colorScheme === 'dark' ? '#232e3c' : '#f1f1f1'),
    '--tg-theme-header-bg-color': themeParams.header_bg_color || (colorScheme === 'dark' ? '#17212b' : '#ffffff'),
    '--tg-theme-accent-text-color': themeParams.accent_text_color || '#2481cc',
    '--tg-theme-section-bg-color': themeParams.section_bg_color || (colorScheme === 'dark' ? '#17212b' : '#ffffff'),
    '--tg-theme-section-header-text-color': themeParams.section_header_text_color || '#2481cc',
    '--tg-theme-subtitle-text-color': themeParams.subtitle_text_color || (colorScheme === 'dark' ? '#708499' : '#999999'),
    '--tg-theme-destructive-text-color': themeParams.destructive_text_color || '#ff3b30',
    backgroundColor: 'var(--tg-theme-bg-color)',
    color: 'var(--tg-theme-text-color)',
  } as React.CSSProperties;

  return (
    <div 
      className={`min-h-screen transition-colors duration-200 ${className}`}
      style={themeStyle}
    >
      {children}
    </div>
  );
};

// Экспортируем типы для удобства
export type { UseTelegramWebAppReturn };

// Экспортируем контекст для продвинутого использования
export { TelegramContext }; 