import React, { useState, useEffect } from 'react';
import { AdminService } from '@/services/adminService';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';
import { 
  Shield, 
  Users, 
  Calendar, 
  Activity, 
  Lock, 
  MessageSquare,
  ArrowLeft,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface AdminPanelProps {
  onBack: () => void;
}

interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalActiveEvents: number;
  totalPrivateEvents: number;
  totalResponses: number;
  totalAdmins: number;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const { isAdmin, isLoading: adminLoading } = useAdminStatus();
  const { reachGoal } = useYandexMetrika();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка статистики
  useEffect(() => {
    const fetchStats = async () => {
      if (!isAdmin || adminLoading) return;

      try {
        setLoading(true);
        setError(null);
        
        const result = await AdminService.getAdminStats();
        
        if (result.error) {
          setError(result.error.message);
        } else {
          setStats(result.data);
        }
      } catch (err) {
        console.error('Error fetching admin stats:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Аналитика
    reachGoal('admin_panel_opened');
  }, [isAdmin, adminLoading, reachGoal]);

  // Проверка прав доступа
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Проверка прав доступа...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Нет доступа
          </h2>
          <p className="text-gray-600 mb-6">
            У вас нет прав администратора для доступа к этой панели.
          </p>
          <button
            onClick={onBack}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  // Статистические карточки
  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          {React.cloneElement(icon as React.ReactElement, { 
            className: "w-6 h-6",
            style: { color }
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Вернуться назад"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-red-600" />
                <h1 className="text-xl font-bold text-gray-900">Админ-панель</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4" />
              Администратор
            </div>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Загрузка статистики...</span>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Ошибка загрузки
            </h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Обновить страницу
            </button>
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* Статистика */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Общая статистика</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                  title="Всего пользователей"
                  value={stats.totalUsers}
                  icon={<Users />}
                  color="#3B82F6"
                />
                <StatCard
                  title="Всего мероприятий"
                  value={stats.totalEvents}
                  icon={<Calendar />}
                  color="#10B981"
                />
                <StatCard
                  title="Активные мероприятия"
                  value={stats.totalActiveEvents}
                  icon={<Activity />}
                  color="#F59E0B"
                />
                <StatCard
                  title="Частные мероприятия"
                  value={stats.totalPrivateEvents}
                  icon={<Lock />}
                  color="#8B5CF6"
                />
                <StatCard
                  title="Всего откликов"
                  value={stats.totalResponses}
                  icon={<MessageSquare />}
                  color="#EF4444"
                />
                <StatCard
                  title="Администраторов"
                  value={stats.totalAdmins}
                  icon={<Shield />}
                  color="#DC2626"
                />
              </div>
            </div>

            {/* Дополнительная информация */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Информация о системе
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Последние обновления</h4>
                  <ul className="text-sm text-gray-500 space-y-1">
                    <li>• Добавлена поддержка многодневных мероприятий</li>
                    <li>• Реализована система администрирования</li>
                    <li>• Улучшена производительность загрузки</li>
                    <li>• Исправлены ошибки с частными мероприятиями</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Версия системы</h4>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div>Fiesta v2.0.0</div>
                    <div>React {React.version}</div>
                    <div>Telegram WebApp API</div>
                    <div>Supabase Backend</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}; 