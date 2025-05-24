import { useEffect, useState, useMemo } from 'react';
import { useTelegram } from '@/components/TelegramProvider';
import type { TelegramThemeParams } from '@/types/telegram';

// Интерфейс для CSS переменных темы
interface TelegramCSSVariables {
  '--tg-theme-bg-color': string;
  '--tg-theme-text-color': string;
  '--tg-theme-hint-color': string;
  '--tg-theme-link-color': string;
  '--tg-theme-button-color': string;
  '--tg-theme-button-text-color': string;
  '--tg-theme-secondary-bg-color': string;
  '--tg-theme-header-bg-color': string;
  '--tg-theme-accent-text-color': string;
  '--tg-theme-section-bg-color': string;
  '--tg-theme-section-header-text-color': string;
  '--tg-theme-subtitle-text-color': string;
  '--tg-theme-destructive-text-color': string;
}

// Интерфейс для адаптированных цветов Tailwind
interface TailwindThemeColors {
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

// Значения по умолчанию для светлой темы
const LIGHT_THEME_DEFAULTS: TelegramThemeParams = {
  bg_color: '#ffffff',
  text_color: '#000000',
  hint_color: '#999999',
  link_color: '#2481cc',
  button_color: '#2481cc',
  button_text_color: '#ffffff',
  secondary_bg_color: '#f1f1f1',
  header_bg_color: '#ffffff',
  accent_text_color: '#2481cc',
  section_bg_color: '#ffffff',
  section_header_text_color: '#2481cc',
  subtitle_text_color: '#999999',
  destructive_text_color: '#ff3b30',
};

// Значения по умолчанию для темной темы
const DARK_THEME_DEFAULTS: TelegramThemeParams = {
  bg_color: '#17212b',
  text_color: '#ffffff',
  hint_color: '#708499',
  link_color: '#6ab7ff',
  button_color: '#2481cc',
  button_text_color: '#ffffff',
  secondary_bg_color: '#232e3c',
  header_bg_color: '#17212b',
  accent_text_color: '#6ab7ff',
  section_bg_color: '#17212b',
  section_header_text_color: '#6ab7ff',
  subtitle_text_color: '#708499',
  destructive_text_color: '#ff6b6b',
};

/**
 * Хук для работы с темой Telegram WebApp
 */
export const useTelegramTheme = () => {
  const { themeParams, colorScheme, isInitialized } = useTelegram();
  const [appliedTheme, setAppliedTheme] = useState<TelegramThemeParams>({});

  // Получаем полную тему с fallback значениями
  const fullTheme = useMemo(() => {
    const defaults = colorScheme === 'dark' ? DARK_THEME_DEFAULTS : LIGHT_THEME_DEFAULTS;
    return { ...defaults, ...themeParams };
  }, [themeParams, colorScheme]);

  // Создаем CSS переменные
  const cssVariables = useMemo((): TelegramCSSVariables => ({
    '--tg-theme-bg-color': fullTheme.bg_color!,
    '--tg-theme-text-color': fullTheme.text_color!,
    '--tg-theme-hint-color': fullTheme.hint_color!,
    '--tg-theme-link-color': fullTheme.link_color!,
    '--tg-theme-button-color': fullTheme.button_color!,
    '--tg-theme-button-text-color': fullTheme.button_text_color!,
    '--tg-theme-secondary-bg-color': fullTheme.secondary_bg_color!,
    '--tg-theme-header-bg-color': fullTheme.header_bg_color!,
    '--tg-theme-accent-text-color': fullTheme.accent_text_color!,
    '--tg-theme-section-bg-color': fullTheme.section_bg_color!,
    '--tg-theme-section-header-text-color': fullTheme.section_header_text_color!,
    '--tg-theme-subtitle-text-color': fullTheme.subtitle_text_color!,
    '--tg-theme-destructive-text-color': fullTheme.destructive_text_color!,
  }), [fullTheme]);

  // Создаем адаптированные цвета для Tailwind
  const tailwindColors = useMemo((): TailwindThemeColors => ({
    background: fullTheme.bg_color!,
    foreground: fullTheme.text_color!,
    muted: fullTheme.secondary_bg_color!,
    mutedForeground: fullTheme.hint_color!,
    primary: fullTheme.button_color!,
    primaryForeground: fullTheme.button_text_color!,
    secondary: fullTheme.secondary_bg_color!,
    secondaryForeground: fullTheme.text_color!,
    accent: fullTheme.accent_text_color!,
    accentForeground: fullTheme.text_color!,
    destructive: fullTheme.destructive_text_color!,
    destructiveForeground: fullTheme.button_text_color!,
    border: fullTheme.hint_color!,
    input: fullTheme.secondary_bg_color!,
    ring: fullTheme.accent_text_color!,
  }), [fullTheme]);

  // Применяем CSS переменные к document
  useEffect(() => {
    if (!isInitialized) return;

    const root = document.documentElement;
    
         Object.entries(cssVariables).forEach(([property, value]) => {
       root.style.setProperty(property, value as string);
     });

    // Также добавляем базовые стили
    root.style.setProperty('--background', fullTheme.bg_color!);
    root.style.setProperty('--foreground', fullTheme.text_color!);
    
    setAppliedTheme(fullTheme);

    return () => {
      // Очищаем CSS переменные при размонтировании
      Object.keys(cssVariables).forEach((property) => {
        root.style.removeProperty(property);
      });
      root.style.removeProperty('--background');
      root.style.removeProperty('--foreground');
    };
  }, [cssVariables, fullTheme, isInitialized]);

  // Хелперы для работы с цветами
  const isDark = colorScheme === 'dark';
  const isLight = colorScheme === 'light';

  // Функция для получения контрастного цвета
  const getContrastColor = (backgroundColor: string): string => {
    // Простая логика определения контрастности
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  // Функция для адаптации цвета под тему
  const adaptColor = (lightColor: string, darkColor?: string): string => {
    return isDark ? (darkColor || lightColor) : lightColor;
  };

  // Функция для создания стилей с адаптацией темы
  const createThemedStyles = (styles: Record<string, any>) => {
    return Object.entries(styles).reduce((acc, [key, value]) => {
      if (typeof value === 'object' && value.light && value.dark) {
        acc[key] = isDark ? value.dark : value.light;
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
  };

  return {
    // Основные данные темы
    themeParams: fullTheme,
    appliedTheme,
    colorScheme,
    isDark,
    isLight,
    
    // CSS переменные и цвета
    cssVariables,
    tailwindColors,
    
    // Хелперы
    getContrastColor,
    adaptColor,
    createThemedStyles,
    
    // Состояние инициализации
    isInitialized,
  };
};

/**
 * Хук для создания адаптивных стилей компонента
 */
export const useThemedStyles = <T extends Record<string, any>>(
  styles: T
): T => {
  const { createThemedStyles } = useTelegramTheme();
  
  return useMemo(() => {
    return createThemedStyles(styles) as T;
  }, [styles, createThemedStyles]);
};

/**
 * Хук для получения CSS класса темы
 */
export const useThemeClass = (
  lightClass: string, 
  darkClass?: string
): string => {
  const { isDark } = useTelegramTheme();
  return isDark ? (darkClass || lightClass) : lightClass;
};

/**
 * Хук для получения значения CSS переменной темы
 */
export const useThemeVariable = (variableName: keyof TelegramCSSVariables): string => {
  const { cssVariables } = useTelegramTheme();
  return cssVariables[variableName];
};

// Экспортируем типы и константы
export type { TelegramCSSVariables, TailwindThemeColors };
export { LIGHT_THEME_DEFAULTS, DARK_THEME_DEFAULTS }; 