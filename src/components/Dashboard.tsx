import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Users, 
  TrendingUp,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { EventService } from '@/services/eventService';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';
import { useTelegram } from './TelegramProvider';
import type { DatabaseEvent } from '@/types/database';

interface DashboardProps {
  onBack: () => void;
  onCreateEvent: () => void;
  currentUserId?: number;
}

interface EventStats {
  total: number;
  active: number;
  completed: number;
  totalParticipants: number;
  averageParticipants: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  onBack, 
  onCreateEvent,
  currentUserId 
}) => {
  const { impactOccurred } = useTelegram();
  const { reachGoal } = useYandexMetrika();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<EventStats>({
    total: 0,
    active: 0,
    completed: 0,
    totalParticipants: 0,
    averageParticipants: 0
  });
  const [recentEvents, setRecentEvents] = useState<DatabaseEvent[]>([]);

  useEffect(() => {
    // Отслеживаем открытие дэшборда
    reachGoal('dashboard_opened', {
      user_id: currentUserId
    });
    
    const fetchDashboardData = async () => {
      if (!currentUserId) {
        setError('Пользователь не авторизован');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Получаем все мероприятия, созданные пользователем
        const result = await EventService.getByCreator(currentUserId, 100);
        
        if (result.error) {
          setError(result.error.message);
          return;
        }

        const events = result.data || [];
        const now = new Date();

        // Вычисляем статистику
        const activeEvents = events.filter(event => 
          event.status === 'active' && new Date(event.date) > now
        );
        const completedEvents = events.filter(event => 
          event.status === 'completed' || new Date(event.date) <= now
        );
        
        const totalParticipants = events.reduce((sum, event) => 
          sum + (event.current_participants || 0), 0
        );
        
        const averageParticipants = events.length > 0 
          ? Math.round(totalParticipants / events.length * 10) / 10 
          : 0;

        setStats({
          total: events.length,
          active: activeEvents.length,
          completed: completedEvents.length,
          totalParticipants,
          averageParticipants
        });

        // Последние 5 мероприятий
        setRecentEvents(events.slice(0, 5));

        // Отслеживаем загрузку статистики
        reachGoal('dashboard_stats_loaded', {
          user_id: currentUserId,
          total_events: events.length,
          active_events: activeEvents.length,
          completed_events: completedEvents.length
        });

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Не удалось загрузить данные дэшборда');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUserId, reachGoal]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold mb-2">Ошибка загрузки</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => {
                  reachGoal('dashboard_back_clicked');
                  onBack();
                  impactOccurred('light');
                }}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Назад к списку мероприятий"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold flex items-center">
                <BarChart3 className="w-6 h-6 mr-2 text-blue-600" />
                Дэшборд
              </h1>
            </div>
            
            <button
              onClick={() => {
                reachGoal('dashboard_create_event_clicked');
                onCreateEvent();
                impactOccurred('light');
              }}
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Создать
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Статистические карточки */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Всего мероприятий */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Всего мероприятий</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Активные мероприятия */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Активные</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Завершенные мероприятия */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Завершенные</p>
                <p className="text-3xl font-bold text-gray-600">{stats.completed}</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Всего участников */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Всего участников</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalParticipants}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Дополнительная статистика */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Средние показатели */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
              Средние показатели
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Участников на мероприятие</span>
                <span className="font-semibold text-orange-600">{stats.averageParticipants}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Процент активных</span>
                <span className="font-semibold text-orange-600">
                  {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Процент завершенных</span>
                <span className="font-semibold text-orange-600">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Последние мероприятия */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Последние мероприятия
            </h3>
            {recentEvents.length > 0 ? (
              <div className="space-y-3">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 truncate">{event.title}</h4>
                      <p className="text-sm text-gray-600">{formatDate(event.date)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.status === 'active' && new Date(event.date) > new Date()
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {event.status === 'active' && new Date(event.date) > new Date() ? 'Активно' : 'Завершено'}
                      </span>
                      {event.is_private && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Частное
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Вы еще не создали ни одного мероприятия</p>
                <button
                  onClick={() => {
                    reachGoal('dashboard_first_event_clicked');
                    onCreateEvent();
                  }}
                  className="mt-3 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Создать первое мероприятие
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Призыв к действию */}
        {stats.total === 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Добро пожаловать в Fiesta!</h2>
            <p className="text-blue-100 mb-6">
              Создайте свое первое мероприятие и начните собирать людей вокруг интересных событий
            </p>
            <button
              onClick={() => {
                reachGoal('dashboard_welcome_create_clicked');
                onCreateEvent();
                impactOccurred('medium');
              }}
              className="bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Создать мероприятие
            </button>
          </div>
        )}
      </div>
    </div>
  );
}; 