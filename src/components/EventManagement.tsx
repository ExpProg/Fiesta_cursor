import React, { useState, useEffect } from 'react';
import { EventService } from '@/services/eventService';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  MoreVertical,
  Loader2,
  AlertTriangle,
  Activity,
  Clock,
  Lock,
  User
} from 'lucide-react';
import type { DatabaseEvent } from '@/types/database';

interface EventManagementProps {
  onEditEvent?: (event: DatabaseEvent) => void;
}

export const EventManagement: React.FC<EventManagementProps> = ({ onEditEvent }) => {
  const { reachGoal } = useYandexMetrika();
  const [events, setEvents] = useState<DatabaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [creatorFilter, setCreatorFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [showActions, setShowActions] = useState<string | null>(null);
  const eventsPerPage = 20;

  // Загрузка всех мероприятий
  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📊 EventManagement: Loading all events for admin...');
      
      // Используем прямой запрос к supabase для получения всех мероприятий
      const response = await EventService.getAllForAdmin(
        (currentPage - 1) * eventsPerPage,
        eventsPerPage,
        searchTerm,
        statusFilter === 'all' ? undefined : statusFilter
      );
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      setEvents(response.data || []);
      
      // Получаем общее количество для пагинации
      const countResponse = await EventService.getTotalCountForAdmin(searchTerm, statusFilter === 'all' ? undefined : statusFilter);
      if (countResponse.data !== null) {
        setTotalEvents(countResponse.data);
      }
      
      console.log(`✅ Loaded ${response.data?.length || 0} events (page ${currentPage})`);
      
    } catch (err) {
      console.error('❌ Error loading events:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка при монтировании и изменении фильтров
  useEffect(() => {
    loadEvents();
  }, [currentPage, searchTerm, statusFilter]);

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Форматирование времени
  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    return timeString.slice(0, 5);
  };

  // Удаление мероприятия
  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить это мероприятие? Это действие нельзя отменить.')) {
      return;
    }
    
    try {
      const response = await EventService.delete(eventId);
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      // Обновляем список
      await loadEvents();
      
      reachGoal('admin_event_deleted', { event_id: eventId });
      
    } catch (err) {
      console.error('❌ Error deleting event:', err);
      alert(`Не удалось удалить мероприятие: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    }
  };

  // Пагинация
  const totalPages = Math.ceil(totalEvents / eventsPerPage);
  const canGoBack = currentPage > 1;
  const canGoForward = currentPage < totalPages;

  // Получение уникальных создателей для фильтра
  const uniqueCreators = Array.from(new Set(events.map(event => event.created_by))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Управление мероприятиями</h2>
          <p className="text-gray-600 mt-1">
            Всего мероприятий: {totalEvents.toLocaleString()}
          </p>
        </div>
        
        <button
          onClick={loadEvents}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      {/* Фильтры и поиск */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Сбрасываем на первую страницу
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          {/* Фильтр по статусу */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'active' | 'completed');
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Все статусы</option>
            <option value="active">Активные</option>
            <option value="completed">Завершенные</option>
          </select>
          
          {/* Фильтр по создателю */}
          <select
            value={creatorFilter}
            onChange={(e) => {
              setCreatorFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Все создатели</option>
            {uniqueCreators.map(creatorId => (
              <option key={creatorId} value={creatorId}>
                ID: {creatorId}
              </option>
            ))}
          </select>
          
          {/* Показать выбранные */}
          {selectedEvents.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Выбрано: {selectedEvents.size}
              </span>
              <button
                onClick={() => setSelectedEvents(new Set())}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Сбросить
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Таблица мероприятий */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Загрузка мероприятий...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Ошибка загрузки</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadEvents}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Мероприятий не найдено</h3>
              <p className="text-gray-500">Попробуйте изменить фильтры поиска</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedEvents.size === events.length && events.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEvents(new Set(events.map(event => event.id)));
                        } else {
                          setSelectedEvents(new Set());
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Название</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Дата</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Место</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Участники</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Статус</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Создатель</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {events.map((event) => (
                  <tr 
                    key={event.id} 
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedEvents.has(event.id) ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* Чекбокс */}
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedEvents.has(event.id)}
                        onChange={(e) => {
                          const newSelected = new Set(selectedEvents);
                          if (e.target.checked) {
                            newSelected.add(event.id);
                          } else {
                            newSelected.delete(event.id);
                          }
                          setSelectedEvents(newSelected);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    
                    {/* Название */}
                    <td className="py-3 px-4">
                      <div className="max-w-xs">
                        <div className="font-medium text-gray-900 truncate" title={event.title}>
                          {event.title}
                        </div>
                        {event.description && (
                          <div className="text-sm text-gray-500 truncate" title={event.description}>
                            {event.description}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* Дата */}
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(event.date)}
                        </div>
                        {event.event_time && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatTime(event.event_time)}
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* Место */}
                    <td className="py-3 px-4">
                      {event.location ? (
                        <div className="flex items-center gap-1 text-sm max-w-xs">
                          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate" title={event.location}>
                            {event.location}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Не указано</span>
                      )}
                    </td>
                    
                    {/* Участники */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span>
                          {event.current_participants || 0}
                          {event.max_participants ? `/${event.max_participants}` : ''}
                        </span>
                      </div>
                    </td>
                    
                    {/* Статус */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          event.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {event.status === 'active' ? (
                            <Activity className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {event.status === 'active' ? 'Активно' : 'Завершено'}
                        </div>
                        {event.is_private && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                            <Lock className="w-3 h-3" />
                            Частное
                          </div>
                        )}
                      </div>
                    </td>
                    
                    {/* Создатель */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-sm">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-gray-600">
                          ID: {event.created_by}
                        </span>
                      </div>
                    </td>
                    
                    {/* Действия */}
                    <td className="py-3 px-4">
                      <div className="relative">
                        <button
                          onClick={() => setShowActions(showActions === event.id ? null : event.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {showActions === event.id && (
                          <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[140px]">
                            <button
                              onClick={() => {
                                // Открыть мероприятие в новой вкладке или модальном окне
                                window.open(`/event/${event.id}`, '_blank');
                                setShowActions(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                            >
                              <Eye className="w-3 h-3" />
                              Просмотр
                            </button>
                            
                            {onEditEvent && (
                              <button
                                onClick={() => {
                                  onEditEvent(event);
                                  setShowActions(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                              >
                                <Edit className="w-3 h-3" />
                                Редактировать
                              </button>
                            )}
                            
                            <button
                              onClick={() => {
                                handleDeleteEvent(event.id);
                                setShowActions(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                              Удалить
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow-md px-4 py-3">
          <div className="text-sm text-gray-600">
            Показано {((currentPage - 1) * eventsPerPage) + 1}-{Math.min(currentPage * eventsPerPage, totalEvents)} из {totalEvents}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => prev - 1)}
              disabled={!canGoBack}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Назад
            </button>
            
            <div className="flex items-center gap-1">
              {/* Показываем номера страниц */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                if (pageNum > totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!canGoForward}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Вперед
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 