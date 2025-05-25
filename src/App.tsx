import React, { useEffect, useState } from 'react';
import { 
  TelegramProvider, 
  TelegramThemeAdapter, 
  TelegramUserInfo,
  TelegramGate,
  useTelegram 
} from '@/components/TelegramProvider';
import { DebugInfo } from '@/components/DebugInfo';
import { TestMode } from '@/components/TestMode';
import { useTelegramTheme } from '@/hooks/useTelegramTheme';
import { CreateEventForm } from './components/CreateEventForm';
import { UserService } from '@/services/userService';
import type { DatabaseUser } from '@/types/database';

// Компонент загрузки
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-telegram-blue"></div>
  </div>
);

// Основной компонент приложения
function AppContent() {
  const { user: telegramUser, impactOccurred, isInitialized } = useTelegram();
  const { isDark } = useTelegramTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<DatabaseUser | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);

  // Безопасные данные пользователя для отображения
  const safeUserData = {
    firstName: telegramUser?.first_name || 'Гость',
    lastName: telegramUser?.last_name || '',
    username: telegramUser?.username || null,
  };

  useEffect(() => {
    const initializeUser = async () => {
      if (!isInitialized || !telegramUser) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setErrorDetails(null);
        
        console.log('🔄 Initializing user with Telegram data:', {
          id: telegramUser.id,
          first_name: telegramUser.first_name,
          username: telegramUser.username
        });

        const userData = await UserService.getOrCreateUser(telegramUser);
        console.log('✅ User initialized successfully:', userData);
        
        setUser(userData);
        // Добавляем тактильную обратную связь при успешной инициализации
        impactOccurred('light');
      } catch (err) {
        console.error('❌ Failed to initialize user:', err);
        
        // Детальная информация об ошибке
        const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
        const errorStack = err instanceof Error ? err.stack : undefined;
        
        setError(`Не удалось инициализировать пользователя: ${errorMessage}`);
        setErrorDetails({
          message: errorMessage,
          stack: errorStack,
          telegramUser: telegramUser,
          timestamp: new Date().toISOString(),
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'NOT_SET',
          hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
        });
        
        impactOccurred('heavy');
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [isInitialized, telegramUser, impactOccurred]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-red-500 text-4xl mb-4 text-center">⚠️</div>
          <h2 className="text-lg font-semibold mb-2 text-center">Ошибка инициализации</h2>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          
          {/* Показываем детали ошибки в режиме разработки ИЛИ в Telegram */}
          {(import.meta.env.MODE === 'development' || typeof window !== 'undefined' && 'Telegram' in window) && errorDetails && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <details className="text-xs">
                <summary className="font-medium text-red-800 cursor-pointer mb-2">
                  🔧 Детали ошибки ({import.meta.env.MODE === 'development' ? 'режим разработки' : 'Telegram диагностика'})
                </summary>
                <div className="space-y-2 text-red-700">
                  <div><strong>Сообщение:</strong> {errorDetails.message}</div>
                  <div><strong>Время:</strong> {errorDetails.timestamp}</div>
                  <div><strong>Режим:</strong> {import.meta.env.MODE}</div>
                  <div><strong>Supabase URL:</strong> {errorDetails.supabaseUrl}</div>
                  <div><strong>Supabase Key:</strong> {errorDetails.hasSupabaseKey ? 'Установлен' : 'НЕ УСТАНОВЛЕН'}</div>
                  <div><strong>Telegram User:</strong> {JSON.stringify(errorDetails.telegramUser, null, 2)}</div>
                  <div><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}</div>
                  <div><strong>Location:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</div>
                  {errorDetails.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="bg-red-100 p-2 rounded text-xs mt-1 overflow-auto">
                        {errorDetails.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
          
          <div className="space-y-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              Попробовать снова
            </button>
            
            {/* Кнопка для тестирования подключения к Supabase */}
            <button
              onClick={async () => {
                try {
                  console.log('🔄 Testing Supabase connection...');
                  const { supabase } = await import('@/hooks/useSupabase');
                  const { data, error } = await supabase.from('users').select('count').limit(1);
                  if (error) {
                    console.error('❌ Supabase test failed:', error);
                    alert(`Ошибка Supabase: ${error.message}`);
                  } else {
                    console.log('✅ Supabase connection OK');
                    alert('✅ Подключение к Supabase работает');
                  }
                } catch (err) {
                  console.error('❌ Supabase test error:', err);
                  alert(`Ошибка тестирования: ${err}`);
                }
              }}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              🔧 Тест подключения к базе данных
            </button>
            
            {/* Ссылка на debug страницу */}
            <a
              href="/debug.html"
              target="_blank"
              className="block w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm text-center"
            >
              🔍 Открыть полную диагностику
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!telegramUser) {
    return <TestMode />;
  }

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">🎉 Fiesta</h1>
            <TelegramUserInfo showPremium={true} />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto">
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <h2 className="text-lg font-semibold mb-2">
              Добро пожаловать, {safeUserData.firstName}! 👋
            </h2>
            <p className="text-gray-600 mb-4">
              Здесь вы можете находить и бронировать увлекательные вечеринки в вашем городе.
            </p>
            
            <div className="space-y-3">
              <button 
                className="w-full bg-telegram-blue text-white py-3 px-4 rounded-lg font-medium hover:bg-telegram-blue/90 transition-colors"
                onClick={() => impactOccurred('light')}
              >
                🎊 Найти вечеринки
              </button>
              <button 
                className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 transition-colors"
                onClick={() => {
                  setShowCreateEvent(true);
                  impactOccurred('light');
                }}
              >
                ➕ Создать мероприятие
              </button>
              <button 
                className="w-full py-3 px-4 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: isDark ? '#232e3c' : '#f1f1f1',
                  color: isDark ? '#ffffff' : '#000000'
                }}
                onClick={() => impactOccurred('light')}
              >
                📋 Мои бронирования
              </button>
              <button 
                className="w-full py-3 px-4 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: isDark ? '#232e3c' : '#f1f1f1',
                  color: isDark ? '#ffffff' : '#000000'
                }}
                onClick={() => impactOccurred('light')}
              >
                ⚙️ Настройки
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <h3 className="font-medium mb-2">🔥 Популярные вечеринки</h3>
            <p className="text-sm text-gray-500">
              Скоро здесь появятся самые интересные события!
            </p>
          </div>

          {/* Debug информация только в режиме разработки */}
          {import.meta.env.MODE === 'development' && (
            <DebugInfo className="mt-4" />
          )}
        </div>
      </main>

      {/* Модальное окно создания мероприятия */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <CreateEventForm
              onSuccess={(eventId) => {
                console.log('✅ Event created with ID:', eventId);
                setShowCreateEvent(false);
                impactOccurred('medium');
                // Можно добавить навигацию к созданному мероприятию
              }}
              onCancel={() => {
                setShowCreateEvent(false);
                impactOccurred('light');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Главный компонент приложения с провайдерами
function App() {
  return (
    <TelegramProvider 
      fallback={<LoadingSpinner />}
      enableDevMode={true}
    >
      <TelegramThemeAdapter>
        <TelegramGate 
          requireInitialized={true}
          fallback={<LoadingSpinner />}
        >
          <AppContent />
        </TelegramGate>
      </TelegramThemeAdapter>
    </TelegramProvider>
  );
}

export default App; 