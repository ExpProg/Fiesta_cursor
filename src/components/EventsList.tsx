import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EventService } from '@/services/eventService';
import { getEventGradient } from '@/utils/gradients';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { TabNavigation, TabType } from './TabNavigation';
import type { DatabaseEvent } from '@/types/database';
import { Calendar, MapPin, Users, Star, Clock, Loader2 } from 'lucide-react';

interface EventsListProps {
  onEventClick?: (event: DatabaseEvent) => void;
}

// Компонент для ленивой загрузки изображений
interface LazyImageProps {
  src: string;
  alt: string;
  className: string;
  fallbackGradient: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, fallbackGradient }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Начинаем загрузку за 50px до появления в viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  return (
    <div ref={imgRef} className={className}>
      {!isInView ? (
        // Placeholder пока изображение не в viewport
        <div 
          className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center"
          style={{ background: fallbackGradient }}
        >
          <div className="text-white/70 text-sm">📷</div>
        </div>
      ) : hasError ? (
        // Fallback градиент при ошибке загрузки
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ background: fallbackGradient }}
        >
          <div className="text-white/70 text-sm">🖼️</div>
        </div>
      ) : (
        <>
          {/* Placeholder пока изображение загружается */}
          {!isLoaded && (
            <div 
              className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
              style={{ background: fallbackGradient }}
            >
              <Loader2 className="w-6 h-6 text-white/70 animate-spin" />
            </div>
          )}
          
          {/* Само изображение */}
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
          />
        </>
      )}
    </div>
  );
};

// Мемоизированный компонент карточки события
interface EventCardProps {
  event: DatabaseEvent;
  onEventClick?: (event: DatabaseEvent) => void;
  onMapClick: (event: DatabaseEvent) => void;
}

const EventCard: React.FC<EventCardProps> = React.memo(({ event, onEventClick, onMapClick }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    return timeString.slice(0, 5); // HH:MM
  };

  const getEventImage = (event: DatabaseEvent) => {
    // Fallback градиенты для разных мероприятий
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ];
    // Используем ID события для консистентного выбора градиента
    const index = parseInt(event.id.slice(-1), 16) % gradients.length;
    return gradients[index];
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer group"
      onClick={() => onEventClick && onEventClick(event)}
    >
      {/* Изображение мероприятия */}
      <div className="relative h-48 overflow-hidden">
        {event.image_url ? (
          <LazyImage
            src={event.image_url}
            alt={event.title}
            className="w-full h-full relative group-hover:scale-105 transition-transform duration-300"
            fallbackGradient={getEventImage(event)}
          />
        ) : (
          <div 
            className="w-full h-full group-hover:scale-105 transition-transform duration-300"
            style={{ background: getEventImage(event) }}
          />
        )}
        
        {/* Статус */}
        <div className="absolute top-3 right-3">
          <div className="flex flex-col gap-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              event.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {event.status === 'active' ? 'Активно' : 'Завершено'}
            </span>
            
            {event.is_private && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Частное
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Информация о мероприятии */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
          {event.title}
        </h3>
        
        {event.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="space-y-2">
          {/* Дата и время */}
          <div className="flex items-center text-gray-500 text-sm">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <div className="flex flex-col">
              <div>
                {formatDate(event.date)}
                {event.end_date && event.end_date !== event.date.split('T')[0] && (
                  <span className="text-gray-400"> - {formatDate(event.end_date)}</span>
                )}
              </div>
              {event.event_time && (
                <div className="flex items-center mt-1">
                  <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span>
                    {formatTime(event.event_time)}
                    {event.end_time && (
                      <span className="text-gray-400"> - {formatTime(event.end_time)}</span>
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Место */}
          {event.location && (
            <div className="flex items-center text-gray-500 text-sm">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}

          {/* Участники */}
          <div className="flex items-center text-gray-500 text-sm">
            <Users className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>
              {event.current_participants} участников
              {event.max_participants && (
                <span className="text-gray-400"> / {event.max_participants}</span>
              )}
            </span>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex gap-2">
            <button 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              onClick={(e) => {
                e.stopPropagation();
                onEventClick && onEventClick(event);
              }}
            >
              Подробнее
            </button>
            
            {/* Кнопка карты - только если есть ссылка */}
            {event.map_url && (
              <button
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onMapClick(event);
                }}
                title="Открыть на карте"
              >
                📍 На карте
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

EventCard.displayName = 'EventCard';

export const EventsList: React.FC<EventsListProps> = ({ 
  onEventClick
}) => {
  const { user } = useTelegramWebApp();
  const { reachGoal } = useYandexMetrika();
  
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [events, setEvents] = useState<DatabaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Кэш для событий
  const eventsCache = useRef<Map<TabType, { data: DatabaseEvent[], timestamp: number }>>(new Map());
  const CACHE_DURATION = 30000; // 30 секунд

  const getTabTitle = (tab: TabType): string => {
    switch (tab) {
      case 'all': return 'Все мероприятия';
      case 'available': return 'Доступные мероприятия';
      case 'my': return 'Мои мероприятия';
      case 'archive': return 'Архив мероприятий';
      default: return 'Мероприятия';
    }
  };

  // Мемоизированный обработчик клика по карте
  const handleMapClick = useCallback((event: DatabaseEvent) => {
    if (event.map_url) {
      reachGoal('map_click', {
        event_id: event.id,
        event_title: event.title.substring(0, 30)
      });
      window.open(event.map_url, '_blank', 'noopener,noreferrer');
    }
  }, [reachGoal]);

  // Оптимизированная функция загрузки событий
  const fetchEvents = useCallback(async (tab: TabType, forceRefresh = false) => {
    // Проверяем кэш
    const cached = eventsCache.current.get(tab);
    const now = Date.now();
    
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      setEvents(cached.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;
      
      // Оптимизированные запросы в зависимости от вкладки
      switch (tab) {
        case 'all':
          result = await EventService.getAll(50);
          break;
        case 'available':
          result = await EventService.getAvailable(50);
          break;
        case 'my':
          if (!user?.id) {
            setEvents([]);
            setLoading(false);
            return;
          }
          result = await EventService.getUserEvents(user.id, 50);
          break;
        case 'archive':
          if (!user?.id) {
            setEvents([]);
            setLoading(false);
            return;
          }
          result = await EventService.getUserArchive(user.id, 50);
          break;
        default:
          result = await EventService.getAll(50);
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      let eventsData = result.data || [];
      
      // Фильтруем частные мероприятия для общих списков, но оставляем их для организатора
      if (tab === 'all' || tab === 'available') {
        eventsData = eventsData.filter(event => 
          !event.is_private || (user?.id && event.created_by === user.id)
        );
      }
      
      // Сохраняем в кэш
      eventsCache.current.set(tab, {
        data: eventsData,
        timestamp: now
      });
      
      setEvents(eventsData);
      
      // Аналитика
      reachGoal('events_list_loaded', {
        tab,
        events_count: eventsData.length,
        user_id: user?.id || 0
      });
      
    } catch (err) {
      console.error('❌ Error fetching events:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки мероприятий');
      
      reachGoal('events_list_error', {
        tab,
        error: err instanceof Error ? err.message : 'unknown_error',
        user_id: user?.id || 0
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, reachGoal]);

  // Мемоизированный обработчик смены вкладки
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    fetchEvents(tab);
  }, [fetchEvents]);

  // Загрузка событий при монтировании и смене пользователя
  useEffect(() => {
    fetchEvents(activeTab);
  }, [fetchEvents, activeTab]);

  // Очистка кэша при смене пользователя
  useEffect(() => {
    eventsCache.current.clear();
  }, [user?.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    return timeString.slice(0, 5); // HH:MM
  };

  const getEventImage = (event: DatabaseEvent) => {
    if (event.image_url) return event.image_url;
    // Используем сохраненный градиент или генерируем детерминированный
    return getEventGradient(event);
  };

  const getEmptyStateMessage = (tab: TabType) => {
    switch (tab) {
      case 'all':
        return {
          icon: '🎉',
          title: 'Пока нет мероприятий',
          subtitle: 'Скоро здесь появятся интересные события!'
        };
      case 'available':
        return {
          icon: '🔍',
          title: 'Нет доступных мероприятий',
          subtitle: 'Все места заняты или мероприятия завершены'
        };
      case 'my':
        return {
          icon: '📋',
          title: 'У вас пока нет мероприятий',
          subtitle: 'Создайте свое первое мероприятие!'
        };
      case 'archive':
        return {
          icon: '📦',
          title: 'Архив пуст',
          subtitle: 'Здесь будут отображаться завершенные мероприятия'
        };
      default:
        return {
          icon: '🎉',
          title: 'Пока нет мероприятий',
          subtitle: 'Скоро здесь появятся интересные события!'
        };
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{getTabTitle(activeTab)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{getTabTitle(activeTab)}</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">⚠️ Ошибка загрузки</div>
            <div className="text-gray-600">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  const emptyState = getEmptyStateMessage(activeTab);

  if (events.length === 0) {
    return (
      <div className="w-full">
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{getTabTitle(activeTab)}</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">{emptyState.icon}</div>
            <div className="text-xl font-medium text-gray-700 mb-2">
              {emptyState.title}
            </div>
            <div className="text-gray-500">
              {emptyState.subtitle}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{getTabTitle(activeTab)}</h2>
          <div className="text-sm text-gray-500">
            {events.length} {events.length === 1 ? 'мероприятие' : events.length < 5 ? 'мероприятия' : 'мероприятий'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEventClick={onEventClick}
              onMapClick={handleMapClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 