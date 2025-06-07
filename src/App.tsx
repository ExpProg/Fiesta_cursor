import React, { useEffect, useState } from 'react';
import { 
  TelegramProvider, 
  TelegramThemeAdapter, 
  TelegramUserInfo,
  TelegramGate,
  useTelegram 
} from '@/components/TelegramProvider';
import { AdminDebugPanel } from '@/components/AdminDebugPanel';
import { TestMode } from '@/components/TestMode';
import { useTelegramTheme } from '@/hooks/useTelegramTheme';
import { useEventSharing } from '@/hooks/useEventSharing';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { CreateEventForm } from './components/CreateEventForm';
import { CreateEventPage } from './components/CreateEventPage';
import { EventsList } from './components/EventsList';
import { EventPage } from './components/EventPage';
import { EditEventForm } from './components/EditEventForm';
import { EditEventPage } from './components/EditEventPage';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { UserMenu } from './components/UserMenu';
import { UserService } from '@/services/userService';
import type { DatabaseUser, DatabaseEvent } from '@/types/database';

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
  const { sharedEvent, isLoadingSharedEvent, sharedEventError, clearSharedEvent } = useEventSharing();
  const { reachGoal, userParams } = useYandexMetrika();
  const { isAdmin, isLoading: adminLoading } = useAdminStatus();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<DatabaseUser | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<DatabaseEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<DatabaseEvent | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

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
        
        // Отправляем данные пользователя в Яндекс.Метрику
        userParams({
          telegram_id: telegramUser.id,
          first_name: telegramUser.first_name,
          username: telegramUser.username || 'no_username',
          language_code: telegramUser.language_code || 'unknown'
        });
        
        // Отмечаем успешную инициализацию
        reachGoal('user_initialized');
        
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

  // Автоматическое открытие события по ссылке
  useEffect(() => {
    if (sharedEvent && !selectedEvent) {
      console.log('🔗 Opening shared event:', sharedEvent.id);
      setSelectedEvent(sharedEvent);
      impactOccurred('light');
      // Очищаем состояние поделенного события
      clearSharedEvent();
    }
  }, [sharedEvent, selectedEvent, impactOccurred, clearSharedEvent]);

  // Показ ошибки загрузки поделенного события
  useEffect(() => {
    if (sharedEventError) {
      console.error('❌ Shared event error:', sharedEventError);
      alert(`Ошибка загрузки события: ${sharedEventError}`);
      impactOccurred('heavy');
    }
  }, [sharedEventError, impactOccurred]);

  if (isLoading || isLoadingSharedEvent) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-red-500 text-4xl mb-4 text-center">⚠️</div>
          <h2 className="text-lg font-semibold mb-2 text-center">Ошибка инициализации</h2>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          
          {/* Показываем детали ошибки только администраторам */}
          {isAdmin && !adminLoading && errorDetails && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <details className="text-xs">
                <summary className="font-medium text-red-800 cursor-pointer mb-2">
                  🔧 Детали ошибки (только для администраторов)
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
            
            {/* Кнопки диагностики только для администраторов */}
            {isAdmin && !adminLoading && (
              <>
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
                
                {/* Ссылки на диагностические страницы */}
                <a
                  href="/telegram-debug.html"
                  target="_blank"
                  className="block w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm text-center mb-2"
                >
                  🔍 Диагностика Telegram WebApp
                </a>
                <a
                  href="/debug.html"
                  target="_blank"
                  className="block w-full bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm text-center"
                >
                  🔧 Полная диагностика
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!telegramUser) {
    return <TestMode />;
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Если показываем админ-панель */}
      {showAdminPanel ? (
        <AdminPanel
          onBack={() => {
            setShowAdminPanel(false);
            impactOccurred('light');
          }}
          onEditEvent={(event) => {
            setEditingEvent(event);
            setShowAdminPanel(false);
            impactOccurred('light');
          }}
        />
      ) : /* Если показываем дэшборд */
      showDashboard ? (
        <Dashboard
          onBack={() => {
            setShowDashboard(false);
            impactOccurred('light');
          }}
          onCreateEvent={() => {
            setShowDashboard(false);
            setShowCreateEvent(true);
            reachGoal('dashboard_to_create_event');
            impactOccurred('light');
          }}
          currentUserId={telegramUser?.id}
        />
      ) : showCreateEvent ? (
        /* Если создаём мероприятие, показываем страницу создания */
        <CreateEventPage
          onBack={() => {
            setShowCreateEvent(false);
            impactOccurred('light');
          }}
          onSuccess={(eventId) => {
            console.log('✅ Event created with ID:', eventId);
            setShowCreateEvent(false);
            reachGoal('event_created', { event_id: eventId });
            impactOccurred('medium');
            // Обновляем список мероприятий
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      ) : editingEvent ? (
        /* Если редактируем мероприятие, показываем страницу редактирования */
        <EditEventPage
          event={editingEvent}
          onBack={() => {
            setSelectedEvent(editingEvent);
            setEditingEvent(null);
            impactOccurred('light');
          }}
          onSuccess={(eventId) => {
            console.log('✅ Event updated with ID:', eventId);
            // Показываем страницу мероприятия после редактирования
            setSelectedEvent(editingEvent);
            setEditingEvent(null);
            impactOccurred('medium');
            // Обновляем список мероприятий
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      ) : selectedEvent ? (
        /* Если выбрано мероприятие, показываем полноэкранную страницу */
        <EventPage
          event={selectedEvent}
          currentUserId={telegramUser?.id}
          userFirstName={telegramUser?.first_name}
          userLastName={telegramUser?.last_name}
          userUsername={telegramUser?.username}
          onBack={() => {
            setSelectedEvent(null);
            impactOccurred('light');
          }}
          onEdit={(event) => {
            setEditingEvent(event);
            setSelectedEvent(null);
            impactOccurred('light');
          }}
          onDelete={async (eventId) => {
            try {
              console.log('🗑️ Deleting event:', eventId);
              const result = await import('@/services/eventService').then(module => 
                module.EventService.delete(eventId)
              );
              
              if (result.error) {
                alert(`Ошибка удаления: ${result.error.message}`);
                return;
              }
              
              console.log('✅ Event deleted successfully');
              setSelectedEvent(null);
              impactOccurred('heavy');
              
              // Обновляем список мероприятий
              setRefreshTrigger(prev => prev + 1);
            } catch (error) {
              console.error('❌ Delete error:', error);
              alert('Произошла ошибка при удалении мероприятия');
            }
          }}
        />
      ) : (
        /* Основной интерфейс со списком мероприятий */
        <>
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">🎉 Fiesta</h1>
                
                <div className="flex items-center space-x-3">
                  <TelegramUserInfo />
                  
                  {/* Бургер-меню с дэшбордом и созданием мероприятия */}
                  <UserMenu
                    onDashboard={() => {
                      setShowDashboard(true);
                      reachGoal('header_dashboard_clicked');
                      impactOccurred('light');
                    }}
                    onCreateEvent={() => {
                      setShowCreateEvent(true);
                      reachGoal('header_create_event_clicked');
                      impactOccurred('light');
                    }}
                    onAdminPanel={() => {
                      setShowAdminPanel(true);
                      reachGoal('header_admin_panel_clicked');
                      impactOccurred('light');
                    }}
                    userFirstName={telegramUser?.first_name}
                    userLastName={telegramUser?.last_name}
                    userUsername={telegramUser?.username}
                  />
                </div>
              </div>
            </div>
          </header>

          <main className="max-w-6xl mx-auto">
            {/* Список мероприятий с вкладками */}
            <EventsList 
              key={refreshTrigger}
              onEventClick={(event) => {
                setSelectedEvent(event);
                reachGoal('event_view', { 
                  event_id: event.id,
                  event_title: event.title.substring(0, 50)
                });
                impactOccurred('light');
              }}
            />

            {/* Admin Debug Panel - только для администраторов */}
            <AdminDebugPanel className="mt-4" />
          </main>
        </>
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