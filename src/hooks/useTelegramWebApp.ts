import { useEffect, useState, useCallback } from 'react';

import type { 
  TelegramWebAppUser,
  TelegramWebAppInitData,
  TelegramThemeParams,
  ViewportState,
  MainButtonState,
  BackButtonState,
  SettingsButtonState,
  HapticImpactStyle,
  HapticNotificationType
} from '@/types/telegram';

import { 
  getPlatformInfo,
  isVersionAtLeast as checkVersion,
  getSafeUserData
} from '@/utils/telegram-validation';

export interface UseTelegramWebAppReturn {
  // Основные данные
  initData: TelegramWebAppInitData | null;
  initDataRaw: string | null;
  user: TelegramWebAppUser | null;
  safeUserData: ReturnType<typeof getSafeUserData>;
  
  // Состояния
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Тема и UI
  themeParams: TelegramThemeParams;
  colorScheme: 'light' | 'dark';
  viewportState: ViewportState;
  
  // Кнопки
  mainButtonState: MainButtonState;
  backButtonState: BackButtonState;
  settingsButtonState: SettingsButtonState;
  
  // Информация о платформе
  platform: string;
  version: string;
  isVersionAtLeast: (version: string) => boolean;
  
  // Основные методы
  ready: () => void;
  expand: () => void;
  close: () => void;
  
  // Методы Main Button
  setMainButtonText: (text: string) => void;
  showMainButton: () => void;
  hideMainButton: () => void;
  enableMainButton: () => void;
  disableMainButton: () => void;
  showMainButtonProgress: () => void;
  hideMainButtonProgress: () => void;
  onMainButtonClick: (callback: () => void) => void;
  offMainButtonClick: (callback: () => void) => void;
  
  // Методы Back Button
  showBackButton: () => void;
  hideBackButton: () => void;
  onBackButtonClick: (callback: () => void) => void;
  offBackButtonClick: (callback: () => void) => void;
  
  // Методы Settings Button
  showSettingsButton: () => void;
  hideSettingsButton: () => void;
  onSettingsButtonClick: (callback: () => void) => void;
  offSettingsButtonClick: (callback: () => void) => void;
  
  // Haptic Feedback
  impactOccurred: (style: HapticImpactStyle) => void;
  notificationOccurred: (type: HapticNotificationType) => void;
  selectionChanged: () => void;
  
  // Popups
  showAlert: (message: string) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
  showPopup: (params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text: string;
    }>;
  }) => Promise<string>;
  
  // Cloud Storage
  cloudStorageGetItem: (key: string) => Promise<string>;
  cloudStorageSetItem: (key: string, value: string) => Promise<void>;
  cloudStorageRemoveItem: (key: string) => Promise<void>;
  
  // Другие методы
  openLink: (url: string, options?: { tryInstantView?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  switchInlineQuery: (query: string, chooseChatTypes?: string[]) => void;
}

export const useTelegramWebApp = (): UseTelegramWebAppReturn => {
  // Основные состояния
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Данные
  const [parsedInitData, setParsedInitData] = useState<TelegramWebAppInitData | null>(null);
  const [initDataRaw, setInitDataRaw] = useState<string | null>(null);
  const [user, setUser] = useState<TelegramWebAppUser | null>(null);
  
  // UI состояния
  const [currentThemeParams, setCurrentThemeParams] = useState<TelegramThemeParams>({
    bg_color: '#ffffff',
    text_color: '#000000',
    hint_color: '#999999',
    link_color: '#2481cc',
    button_color: '#2481cc',
    button_text_color: '#ffffff',
    secondary_bg_color: '#f1f1f1',
  });
  const [currentColorScheme, setCurrentColorScheme] = useState<'light' | 'dark'>('light');
  const [currentViewport, setCurrentViewport] = useState<ViewportState>({
    height: window.innerHeight || 600,
    stableHeight: window.innerHeight || 600,
    isExpanded: true
  });
  
  // Состояния кнопок
  const [currentMainButton, setCurrentMainButton] = useState<MainButtonState>({
    text: '',
    color: '#2481cc',
    textColor: '#ffffff',
    isVisible: false,
    isActive: true,
    isProgressVisible: false,
    hasShineEffect: false
  });
  
  const [currentBackButton, setCurrentBackButton] = useState<BackButtonState>({
    isVisible: false
  });
  
  const [currentSettingsButton, setCurrentSettingsButton] = useState<SettingsButtonState>({
    isVisible: false
  });

  // Информация о платформе
  const platformInfo = getPlatformInfo();

  // Инициализация в режиме разработки
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Проверяем, что мы внутри Telegram WebApp
        const isInTelegram = typeof window !== 'undefined' && 
                            (window.location.search.includes('tgWebAppData') || 
                             window.location.hash.includes('tgWebAppData') ||
                             // @ts-ignore
                             (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp));

        if (!isInTelegram) {
          // Режим разработки - создаем mock данные
          console.warn('Telegram WebApp не обнаружен. Запуск в режиме разработки.');
          const mockUser: TelegramWebAppUser = {
            id: 123456789,
            first_name: 'Test User',
            last_name: 'Developer',
            username: 'testuser',
            language_code: 'ru',
            is_premium: false
          };
          
          setUser(mockUser);
          setParsedInitData({
            user: mockUser,
            auth_date: Math.floor(Date.now() / 1000),
            hash: 'mock_hash'
          });
          setInitDataRaw('user=' + encodeURIComponent(JSON.stringify(mockUser)) + '&auth_date=' + Math.floor(Date.now() / 1000) + '&hash=mock_hash');
          
          // Устанавливаем базовую тему
          const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          setCurrentColorScheme(isDark ? 'dark' : 'light');
          
          if (isDark) {
            setCurrentThemeParams({
              bg_color: '#17212b',
              text_color: '#ffffff',
              hint_color: '#708499',
              link_color: '#6ab7ff',
              button_color: '#2481cc',
              button_text_color: '#ffffff',
              secondary_bg_color: '#232e3c',
            });
          }
          
          setIsInitialized(true);
          setIsLoading(false);
          return;
        }

        // Если мы в Telegram, пытаемся использовать нативный API
        try {
          // @ts-ignore
          const webApp = window.Telegram.WebApp;
          if (webApp) {
            webApp.ready();
            webApp.expand();
            
            // Получаем данные пользователя
            if (webApp.initDataUnsafe?.user) {
              const telegramUser = webApp.initDataUnsafe.user;
              setUser(telegramUser);
              setParsedInitData(webApp.initDataUnsafe);
              setInitDataRaw(webApp.initData);
            }
            
            // Получаем тему
            if (webApp.themeParams) {
              setCurrentThemeParams(webApp.themeParams);
            }
            setCurrentColorScheme(webApp.colorScheme || 'light');
            
            // Обновляем viewport
            setCurrentViewport({
              height: webApp.viewportHeight || window.innerHeight,
              stableHeight: webApp.viewportStableHeight || window.innerHeight,
              isExpanded: webApp.isExpanded || true
            });
          }
        } catch (e) {
          console.warn('Failed to initialize Telegram WebApp:', e);
        }

        setIsInitialized(true);
        
      } catch (err) {
        console.error('Ошибка инициализации Telegram WebApp SDK:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSDK();
  }, []);

  // Методы для работы с основными функциями
  const ready = useCallback(() => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        // @ts-ignore
        window.Telegram.WebApp.ready();
      }
    } catch (e) {
      console.warn('Failed to call ready:', e);
    }
  }, []);

  const expand = useCallback(() => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        // @ts-ignore
        window.Telegram.WebApp.expand();
      }
    } catch (e) {
      console.warn('Failed to expand viewport:', e);
    }
  }, []);

  const close = useCallback(() => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        // @ts-ignore
        window.Telegram.WebApp.close();
      }
    } catch (e) {
      console.warn('Failed to close miniApp:', e);
    }
  }, []);

  // Методы для Main Button
  const setMainButtonText = useCallback((text: string) => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.MainButton) {
        // @ts-ignore
        window.Telegram.WebApp.MainButton.setText(text);
      }
      setCurrentMainButton(prev => ({ ...prev, text }));
    } catch (e) {
      console.warn('Failed to set main button text:', e);
    }
  }, []);

  const showMainButton = useCallback(() => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.MainButton) {
        // @ts-ignore
        window.Telegram.WebApp.MainButton.show();
      }
      setCurrentMainButton(prev => ({ ...prev, isVisible: true }));
    } catch (e) {
      console.warn('Failed to show main button:', e);
    }
  }, []);

  const hideMainButton = useCallback(() => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.MainButton) {
        // @ts-ignore
        window.Telegram.WebApp.MainButton.hide();
      }
      setCurrentMainButton(prev => ({ ...prev, isVisible: false }));
    } catch (e) {
      console.warn('Failed to hide main button:', e);
    }
  }, []);

  const enableMainButton = useCallback(() => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.MainButton) {
        // @ts-ignore
        window.Telegram.WebApp.MainButton.enable();
      }
      setCurrentMainButton(prev => ({ ...prev, isActive: true }));
    } catch (e) {
      console.warn('Failed to enable main button:', e);
    }
  }, []);

  const disableMainButton = useCallback(() => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.MainButton) {
        // @ts-ignore
        window.Telegram.WebApp.MainButton.disable();
      }
      setCurrentMainButton(prev => ({ ...prev, isActive: false }));
    } catch (e) {
      console.warn('Failed to disable main button:', e);
    }
  }, []);

  const showMainButtonProgress = useCallback(() => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.MainButton) {
        // @ts-ignore
        window.Telegram.WebApp.MainButton.showProgress();
      }
      setCurrentMainButton(prev => ({ ...prev, isProgressVisible: true }));
    } catch (e) {
      console.warn('Failed to show main button progress:', e);
    }
  }, []);

  const hideMainButtonProgress = useCallback(() => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.MainButton) {
        // @ts-ignore
        window.Telegram.WebApp.MainButton.hideProgress();
      }
      setCurrentMainButton(prev => ({ ...prev, isProgressVisible: false }));
    } catch (e) {
      console.warn('Failed to hide main button progress:', e);
    }
  }, []);

  const onMainButtonClick = useCallback((callback: () => void) => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.MainButton) {
        // @ts-ignore
        window.Telegram.WebApp.MainButton.onClick(callback);
      }
    } catch (e) {
      console.warn('Failed to set main button click handler:', e);
    }
  }, []);

  const offMainButtonClick = useCallback((callback: () => void) => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.MainButton) {
        // @ts-ignore
        window.Telegram.WebApp.MainButton.offClick(callback);
      }
    } catch (e) {
      console.warn('Failed to remove main button click handler:', e);
    }
  }, []);

  // Методы для Back Button
  const showBackButton = useCallback(() => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.BackButton) {
        // @ts-ignore
        window.Telegram.WebApp.BackButton.show();
      }
      setCurrentBackButton({ isVisible: true });
    } catch (e) {
      console.warn('Failed to show back button:', e);
    }
  }, []);

  const hideBackButton = useCallback(() => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.BackButton) {
        // @ts-ignore
        window.Telegram.WebApp.BackButton.hide();
      }
      setCurrentBackButton({ isVisible: false });
    } catch (e) {
      console.warn('Failed to hide back button:', e);
    }
  }, []);

  const onBackButtonClick = useCallback((callback: () => void) => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.BackButton) {
        // @ts-ignore
        window.Telegram.WebApp.BackButton.onClick(callback);
      }
    } catch (e) {
      console.warn('Failed to set back button click handler:', e);
    }
  }, []);

  const offBackButtonClick = useCallback((callback: () => void) => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.BackButton) {
        // @ts-ignore
        window.Telegram.WebApp.BackButton.offClick(callback);
      }
    } catch (e) {
      console.warn('Failed to remove back button click handler:', e);
    }
  }, []);

  // Методы для Settings Button
  const showSettingsButton = useCallback(() => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.SettingsButton) {
        // @ts-ignore
        window.Telegram.WebApp.SettingsButton.show();
      }
      setCurrentSettingsButton({ isVisible: true });
    } catch (e) {
      console.warn('Failed to show settings button:', e);
    }
  }, []);

  const hideSettingsButton = useCallback(() => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.SettingsButton) {
        // @ts-ignore
        window.Telegram.WebApp.SettingsButton.hide();
      }
      setCurrentSettingsButton({ isVisible: false });
    } catch (e) {
      console.warn('Failed to hide settings button:', e);
    }
  }, []);

  const onSettingsButtonClick = useCallback((callback: () => void) => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.SettingsButton) {
        // @ts-ignore
        window.Telegram.WebApp.SettingsButton.onClick(callback);
      }
    } catch (e) {
      console.warn('Failed to set settings button click handler:', e);
    }
  }, []);

  const offSettingsButtonClick = useCallback((callback: () => void) => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.SettingsButton) {
        // @ts-ignore
        window.Telegram.WebApp.SettingsButton.offClick(callback);
      }
    } catch (e) {
      console.warn('Failed to remove settings button click handler:', e);
    }
  }, []);

  // Haptic Feedback
  const impactOccurred = useCallback((style: HapticImpactStyle) => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        // @ts-ignore
        window.Telegram.WebApp.HapticFeedback.impactOccurred(style);
      }
    } catch (e) {
      console.warn('Failed to trigger haptic impact:', e);
    }
  }, []);

  const notificationOccurred = useCallback((type: HapticNotificationType) => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        // @ts-ignore
        window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
      }
    } catch (e) {
      console.warn('Failed to trigger haptic notification:', e);
    }
  }, []);

  const selectionChanged = useCallback(() => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.HapticFeedback) {
        // @ts-ignore
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
      }
    } catch (e) {
      console.warn('Failed to trigger haptic selection change:', e);
    }
  }, []);

  // Popup методы
  const showAlert = useCallback(async (message: string): Promise<void> => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.showAlert) {
        // @ts-ignore
        await window.Telegram.WebApp.showAlert(message);
      } else {
        alert(message);
      }
    } catch (e) {
      console.warn('Failed to show alert:', e);
      alert(message);
    }
  }, []);

  const showConfirm = useCallback(async (message: string): Promise<boolean> => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.showConfirm) {
        // @ts-ignore
        return await window.Telegram.WebApp.showConfirm(message);
      } else {
        return confirm(message);
      }
    } catch (e) {
      console.warn('Failed to show confirm:', e);
      return confirm(message);
    }
  }, []);

  const showPopup = useCallback(async (params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text: string;
    }>;
  }): Promise<string> => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.showPopup) {
        // @ts-ignore
        return await window.Telegram.WebApp.showPopup({
          title: params.title,
          message: params.message,
          buttons: params.buttons || [{ type: 'ok', text: 'OK' }]
        });
      } else {
        alert(params.message);
        return 'ok';
      }
    } catch (e) {
      console.warn('Failed to show popup:', e);
      alert(params.message);
      return 'ok';
    }
  }, []);

  // Cloud Storage
  const cloudStorageGetItem = useCallback(async (key: string): Promise<string> => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.CloudStorage) {
        // @ts-ignore
        return await window.Telegram.WebApp.CloudStorage.getItem(key);
      }
      return localStorage.getItem(key) || '';
    } catch (e) {
      console.warn('Failed to get cloud storage item:', e);
      return localStorage.getItem(key) || '';
    }
  }, []);

  const cloudStorageSetItem = useCallback(async (key: string, value: string): Promise<void> => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.CloudStorage) {
        // @ts-ignore
        await window.Telegram.WebApp.CloudStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('Failed to set cloud storage item:', e);
      localStorage.setItem(key, value);
    }
  }, []);

  const cloudStorageRemoveItem = useCallback(async (key: string): Promise<void> => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.CloudStorage) {
        // @ts-ignore
        await window.Telegram.WebApp.CloudStorage.removeItem(key);
      } else {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('Failed to remove cloud storage item:', e);
      localStorage.removeItem(key);
    }
  }, []);

  // Другие методы
  const openLink = useCallback((url: string) => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.openLink) {
        // @ts-ignore
        window.Telegram.WebApp.openLink(url);
      } else {
        window.open(url, '_blank');
      }
    } catch (e) {
      console.warn('Failed to open link:', e);
    }
  }, []);

  const openTelegramLink = useCallback((url: string) => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.openTelegramLink) {
        // @ts-ignore
        window.Telegram.WebApp.openTelegramLink(url);
      } else {
        window.open(url, '_blank');
      }
    } catch (e) {
      console.warn('Failed to open Telegram link:', e);
    }
  }, []);

  const switchInlineQuery = useCallback((query: string, chooseChatTypes?: string[]) => {
    try {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.switchInlineQuery) {
        // @ts-ignore
        window.Telegram.WebApp.switchInlineQuery(query, chooseChatTypes);
      } else {
        console.log('Switch inline query requested:', query, chooseChatTypes);
      }
    } catch (e) {
      console.warn('Failed to switch inline query:', e);
    }
  }, []);

  const isVersionAtLeast = useCallback((version: string): boolean => {
    return checkVersion(platformInfo.version, version);
  }, [platformInfo.version]);

  return {
    // Основные данные
    initData: parsedInitData,
    initDataRaw,
    user,
    safeUserData: getSafeUserData(user),
    
    // Состояния
    isInitialized,
    isLoading,
    error,
    
    // Тема и UI
    themeParams: currentThemeParams,
    colorScheme: currentColorScheme,
    viewportState: currentViewport,
    
    // Кнопки
    mainButtonState: currentMainButton,
    backButtonState: currentBackButton,
    settingsButtonState: currentSettingsButton,
    
    // Информация о платформе
    platform: platformInfo.platform,
    version: platformInfo.version,
    isVersionAtLeast,
    
    // Основные методы
    ready,
    expand,
    close,
    
    // Методы Main Button
    setMainButtonText,
    showMainButton,
    hideMainButton,
    enableMainButton,
    disableMainButton,
    showMainButtonProgress,
    hideMainButtonProgress,
    onMainButtonClick,
    offMainButtonClick,
    
    // Методы Back Button
    showBackButton,
    hideBackButton,
    onBackButtonClick,
    offBackButtonClick,
    
    // Методы Settings Button
    showSettingsButton,
    hideSettingsButton,
    onSettingsButtonClick,
    offSettingsButtonClick,
    
    // Haptic Feedback
    impactOccurred,
    notificationOccurred,
    selectionChanged,
    
    // Popups
    showAlert,
    showConfirm,
    showPopup,
    
    // Cloud Storage
    cloudStorageGetItem,
    cloudStorageSetItem,
    cloudStorageRemoveItem,
    
    // Другие методы
    openLink,
    openTelegramLink,
    switchInlineQuery,
  };
}; 