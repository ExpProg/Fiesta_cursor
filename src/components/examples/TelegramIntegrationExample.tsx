import React from 'react';
import { 
  useTelegram, 
  TelegramGate, 
  TelegramUserInfo,
  withTelegram 
} from '@/components/TelegramProvider';
import { useTelegramTheme, useThemeClass } from '@/hooks/useTelegramTheme';

/**
 * Пример использования компонентов Telegram WebApp интеграции
 */
export const TelegramIntegrationExample: React.FC = () => {
  const {
    safeUserData,
    platform,
    version,
    isVersionAtLeast,
    // Методы кнопок
    setMainButtonText,
    showMainButton,
    hideMainButton,
    onMainButtonClick,
    showBackButton,
    hideBackButton,
    onBackButtonClick,
    // Haptic feedback
    impactOccurred,
    notificationOccurred,
    selectionChanged,
    // Popups
    showAlert,
    showConfirm,
    showPopup,
    // Cloud storage
    cloudStorageGetItem,
    cloudStorageSetItem,
    // Другие методы
    openLink,
    openTelegramLink,
  } = useTelegram();

  const { 
    isDark, 
    themeParams
  } = useTelegramTheme();

  const cardClass = useThemeClass(
    'bg-white border border-gray-200',
    'bg-gray-800 border-gray-700'
  );

  // Обработчики событий
  const handleMainButtonClick = () => {
    impactOccurred('light');
    showAlert('Main Button нажата!');
  };

  const handleBackButtonClick = () => {
    impactOccurred('medium');
    console.log('Back button clicked');
  };

  const handleTestHaptics = () => {
    impactOccurred('heavy');
    notificationOccurred('success');
    selectionChanged();
  };

  const handleTestPopup = async () => {
    const result = await showPopup({
      title: 'Тестовый popup',
      message: 'Это пример popup с кнопками',
      buttons: [
        { type: 'ok', text: 'ОК' },
        { type: 'cancel', text: 'Отмена' },
        { type: 'destructive', text: 'Удалить' }
      ]
    });
    
    await showAlert(`Выбрана кнопка: ${result}`);
  };

  const handleTestConfirm = async () => {
    const confirmed = await showConfirm('Вы уверены?');
    await showAlert(confirmed ? 'Подтверждено!' : 'Отменено!');
  };

  const handleTestCloudStorage = async () => {
    const key = 'test-key';
    const value = `Test value ${Date.now()}`;
    
    await cloudStorageSetItem(key, value);
    const stored = await cloudStorageGetItem(key);
    
    await showAlert(`Сохранено: ${stored}`);
  };

  const handleShowMainButton = () => {
    setMainButtonText('Тест кнопка');
    onMainButtonClick(handleMainButtonClick);
    showMainButton();
  };

  const handleShowBackButton = () => {
    onBackButtonClick(handleBackButtonClick);
    showBackButton();
  };

  return (
    <div className="space-y-6 p-4 max-w-md mx-auto">
      {/* Информация о пользователе */}
      <div className={`rounded-lg p-4 ${cardClass}`}>
        <h3 className="text-lg font-semibold mb-3">Информация о пользователе</h3>
        <TelegramUserInfo showPremium={true} />
        
        <div className="mt-4 space-y-2 text-sm">
          <p><strong>ID:</strong> {safeUserData.id}</p>
          <p><strong>Язык:</strong> {safeUserData.languageCode}</p>
          <p><strong>Premium:</strong> {safeUserData.isPremium ? 'Да' : 'Нет'}</p>
        </div>
      </div>

      {/* Информация о платформе */}
      <div className={`rounded-lg p-4 ${cardClass}`}>
        <h3 className="text-lg font-semibold mb-3">Платформа</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Платформа:</strong> {platform}</p>
          <p><strong>Версия:</strong> {version}</p>
          <p><strong>Поддержка v6.7:</strong> {isVersionAtLeast('6.7') ? 'Да' : 'Нет'}</p>
        </div>
      </div>

      {/* Информация о теме */}
      <div className={`rounded-lg p-4 ${cardClass}`}>
        <h3 className="text-lg font-semibold mb-3">Тема</h3>
        <div className="space-y-2 text-sm">
          <p><strong>Режим:</strong> {isDark ? 'Темная' : 'Светлая'}</p>
          <p><strong>Фон:</strong> 
            <span 
              className="ml-2 inline-block w-4 h-4 rounded border"
              style={{ backgroundColor: themeParams.bg_color }}
            />
            {themeParams.bg_color}
          </p>
          <p><strong>Текст:</strong> 
            <span 
              className="ml-2 inline-block w-4 h-4 rounded border"
              style={{ backgroundColor: themeParams.text_color }}
            />
            {themeParams.text_color}
          </p>
          <p><strong>Кнопка:</strong> 
            <span 
              className="ml-2 inline-block w-4 h-4 rounded border"
              style={{ backgroundColor: themeParams.button_color }}
            />
            {themeParams.button_color}
          </p>
        </div>
      </div>

      {/* Тесты кнопок */}
      <div className={`rounded-lg p-4 ${cardClass}`}>
        <h3 className="text-lg font-semibold mb-3">Кнопки</h3>
        <div className="space-y-3">
          <button
            onClick={handleShowMainButton}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Показать Main Button
          </button>
          <button
            onClick={() => hideMainButton()}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Скрыть Main Button
          </button>
          <button
            onClick={handleShowBackButton}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
          >
            Показать Back Button
          </button>
          <button
            onClick={() => hideBackButton()}
            className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
          >
            Скрыть Back Button
          </button>
        </div>
      </div>

      {/* Тесты Haptic Feedback */}
      <div className={`rounded-lg p-4 ${cardClass}`}>
        <h3 className="text-lg font-semibold mb-3">Haptic Feedback</h3>
        <div className="space-y-3">
          <button
            onClick={handleTestHaptics}
            className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Тест вибраций
          </button>
          <button
            onClick={() => impactOccurred('light')}
            className="w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Легкая вибрация
          </button>
          <button
            onClick={() => notificationOccurred('error')}
            className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
          >
            Ошибка (вибрация)
          </button>
        </div>
      </div>

      {/* Тесты Popups */}
      <div className={`rounded-lg p-4 ${cardClass}`}>
        <h3 className="text-lg font-semibold mb-3">Popups</h3>
        <div className="space-y-3">
          <button
            onClick={handleTestPopup}
            className="w-full bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition-colors"
          >
            Тест Popup
          </button>
          <button
            onClick={handleTestConfirm}
            className="w-full bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Тест Confirm
          </button>
          <button
            onClick={() => showAlert('Это простое уведомление!')}
            className="w-full bg-teal-500 text-white py-2 px-4 rounded-lg hover:bg-teal-600 transition-colors"
          >
            Тест Alert
          </button>
        </div>
      </div>

      {/* Тесты Cloud Storage */}
      <div className={`rounded-lg p-4 ${cardClass}`}>
        <h3 className="text-lg font-semibold mb-3">Cloud Storage</h3>
        <button
          onClick={handleTestCloudStorage}
          className="w-full bg-cyan-500 text-white py-2 px-4 rounded-lg hover:bg-cyan-600 transition-colors"
        >
          Тест сохранения данных
        </button>
      </div>

      {/* Тесты ссылок */}
      <div className={`rounded-lg p-4 ${cardClass}`}>
        <h3 className="text-lg font-semibold mb-3">Ссылки</h3>
        <div className="space-y-3">
          <button
            onClick={() => openLink('https://telegram.org')}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Открыть внешнюю ссылку
          </button>
          <button
            onClick={() => openTelegramLink('https://t.me/telegram')}
            className="w-full bg-telegram-blue text-white py-2 px-4 rounded-lg hover:bg-telegram-blue/90 transition-colors"
          >
            Открыть Telegram ссылку
          </button>
        </div>
      </div>

      {/* Условный рендеринг */}
      <TelegramGate 
        requireUser={true}
        minVersion="6.0"
        fallback={
          <div className={`rounded-lg p-4 ${cardClass}`}>
            <p className="text-red-500">Требуется версия 6.0 или выше</p>
          </div>
        }
      >
        <div className={`rounded-lg p-4 ${cardClass}`}>
          <h3 className="text-lg font-semibold mb-3">Доступно для v6.0+</h3>
          <p className="text-green-600">Этот блок виден только для поддерживаемых версий!</p>
        </div>
      </TelegramGate>
    </div>
  );
};

/**
 * Пример компонента с HOC
 */
const ComponentWithHOC: React.FC<{ telegram: any }> = ({ telegram }) => {
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h4 className="font-semibold">Компонент с HOC</h4>
      <p>Пользователь: {telegram.safeUserData.firstName}</p>
    </div>
  );
};

export const ComponentWithTelegramHOC = withTelegram(ComponentWithHOC);

export default TelegramIntegrationExample; 