// Telegram WebApp User types
export interface TelegramWebAppUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  added_to_attachment_menu?: boolean;
  allows_write_to_pm?: boolean;
  photo_url?: string;
}

// Telegram WebApp Chat types
export interface TelegramWebAppChat {
  id: number;
  type: 'group' | 'supergroup' | 'channel';
  title: string;
  username?: string;
  photo_url?: string;
}

// Telegram WebApp Init Data
export interface TelegramWebAppInitData {
  query_id?: string;
  user?: TelegramWebAppUser;
  receiver?: TelegramWebAppUser;
  chat?: TelegramWebAppChat;
  chat_type?: string;
  chat_instance?: string;
  start_param?: string;
  can_send_after?: number;
  auth_date: number;
  hash: string;
}

// Theme parameters
export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

// Haptic feedback types
export type HapticFeedbackType = 'impact' | 'notification' | 'selection';
export type HapticImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
export type HapticNotificationType = 'error' | 'success' | 'warning';

// Viewport state
export interface ViewportState {
  height: number;
  stableHeight: number;
  isExpanded: boolean;
}

// Main button state
export interface MainButtonState {
  text: string;
  color: string;
  textColor: string;
  isVisible: boolean;
  isActive: boolean;
  isProgressVisible: boolean;
  hasShineEffect: boolean;
}

// Back button state
export interface BackButtonState {
  isVisible: boolean;
}

// Settings button state
export interface SettingsButtonState {
  isVisible: boolean;
}

// Cloud storage data
export interface CloudStorageValue {
  key: string;
  value: string;
}

// Telegram WebApp context type
export interface TelegramWebAppContextType {
  // Init data
  initData: TelegramWebAppInitData | null;
  initDataRaw: string | null;
  user: TelegramWebAppUser | null;
  
  // Theme
  themeParams: TelegramThemeParams;
  colorScheme: 'light' | 'dark';
  
  // Viewport
  viewport: ViewportState;
  
  // Buttons
  mainButton: MainButtonState;
  backButton: BackButtonState;
  settingsButton: SettingsButtonState;
  
  // Platform info
  platform: string;
  version: string;
  isVersionAtLeast: (version: string) => boolean;
  
  // Methods
  ready: () => void;
  expand: () => void;
  close: () => void;
  
  // Main button methods
  setMainButtonText: (text: string) => void;
  showMainButton: () => void;
  hideMainButton: () => void;
  enableMainButton: () => void;
  disableMainButton: () => void;
  showMainButtonProgress: () => void;
  hideMainButtonProgress: () => void;
  setMainButtonParams: (params: Partial<MainButtonState>) => void;
  onMainButtonClick: (callback: () => void) => void;
  offMainButtonClick: (callback: () => void) => void;
  
  // Back button methods
  showBackButton: () => void;
  hideBackButton: () => void;
  onBackButtonClick: (callback: () => void) => void;
  offBackButtonClick: (callback: () => void) => void;
  
  // Settings button methods
  showSettingsButton: () => void;
  hideSettingsButton: () => void;
  onSettingsButtonClick: (callback: () => void) => void;
  offSettingsButtonClick: (callback: () => void) => void;
  
  // Haptic feedback
  impactOccurred: (style: HapticImpactStyle) => void;
  notificationOccurred: (type: HapticNotificationType) => void;
  selectionChanged: () => void;
  
  // Theme methods
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  
  // Popup methods
  showPopup: (params: {
    title?: string;
    message: string;
    buttons?: Array<{
      id?: string;
      type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
      text: string;
    }>;
  }) => Promise<string>;
  
  showAlert: (message: string) => Promise<void>;
  showConfirm: (message: string) => Promise<boolean>;
  
  // Sharing
  switchInlineQuery: (query: string, choose_chat_types?: string[]) => void;
  
  // Links
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  
  // QR Scanner
  showScanQrPopup: (params?: {
    text?: string;
  }) => Promise<string>;
  closeScanQrPopup: () => void;
  
  // Cloud storage
  cloudStorageGetItem: (key: string) => Promise<string>;
  cloudStorageSetItem: (key: string, value: string) => Promise<void>;
  cloudStorageRemoveItem: (key: string) => Promise<void>;
  cloudStorageGetItems: (keys: string[]) => Promise<CloudStorageValue[]>;
  cloudStorageRemoveItems: (keys: string[]) => Promise<void>;
  cloudStorageGetKeys: () => Promise<string[]>;
  
  // Biometric authentication
  requestWriteAccess: () => Promise<boolean>;
  requestContact: () => Promise<TelegramWebAppUser>;
  
  // Invoice
  readTextFromClipboard: () => Promise<string>;
  
  // Events
  onEvent: (eventType: string, callback: (...args: any[]) => void) => void;
  offEvent: (eventType: string, callback: (...args: any[]) => void) => void;
  
  // Loading state
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

// Event types
export type TelegramWebAppEventType = 
  | 'main_button_pressed'
  | 'back_button_pressed'
  | 'settings_button_pressed'
  | 'viewport_changed'
  | 'theme_changed'
  | 'popup_closed'
  | 'qr_text_received'
  | 'clipboard_text_received'
  | 'write_access_requested'
  | 'contact_requested'; 