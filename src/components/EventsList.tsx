import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { EventService } from '@/services/eventService';
import { getEventGradient } from '@/utils/gradients';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { TabNavigation, TabType } from './TabNavigation';
import { Pagination } from './Pagination';
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

// Мемоизированный компонент списка событий для предотвращения лишних ре-рендеров
const EventsGrid: React.FC<{
  events: DatabaseEvent[];
  onEventClick?: (event: DatabaseEvent) => void;
  onMapClick: (event: DatabaseEvent) => void;
}> = React.memo(({ events, onEventClick, onMapClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onEventClick={onEventClick}
          onMapClick={onMapClick}
        />
      ))}
    </div>
  );
});

EventsGrid.displayName = 'EventsGrid';

// Мемоизированный компонент загрузки
const LoadingGrid: React.FC = React.memo(() => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
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
));

LoadingGrid.displayName = 'LoadingGrid';

// Мемоизированный компонент пустого состояния
const EmptyState: React.FC<{
  icon: string;
  title: string;
  subtitle: string;
}> = React.memo(({ icon, title, subtitle }) => (
  <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
    <div className="text-6xl mb-4">{icon}</div>
    <div className="text-xl font-medium text-gray-700 mb-2">
      {title}
    </div>
    <div className="text-gray-500">
      {subtitle}
    </div>
  </div>
));

EmptyState.displayName = 'EmptyState';

export const EventsList: React.FC<EventsListProps> = ({ 
  onEventClick
}) => {
  const { user } = useTelegramWebApp();
  const { reachGoal } = useYandexMetrika();
  
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [events, setEvents] = useState<DatabaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const ITEMS_PER_PAGE = 5;
  
  // Кэш для событий с пагинацией
  const eventsCache = useRef<Map<string, { data: DatabaseEvent[], timestamp: number, totalItems: number }>>(new Map());
  const CACHE_DURATION = 120000; // 2 минуты

  // Генерируем ключ кэша с учетом пагинации
  const getCacheKey = useCallback((tab: TabType, page: number) => {
    return `${tab}_page_${page}`;
  }, []);

  // Предзагрузка соседних страниц
  const preloadAdjacentPages = useCallback(async (tab: TabType, page: number) => {
    const adjacentPages = [page - 1, page + 1].filter(p => p > 0);
    
    for (const adjacentPage of adjacentPages) {
      const cacheKey = getCacheKey(tab, adjacentPage);
      const cached = eventsCache.current.get(cacheKey);
      const now = Date.now();
      
      if (!cached || (now - cached.timestamp) > CACHE_DURATION) {
        try {
          await fetchEvents(tab, adjacentPage, false, true); // silent preload
        } catch (error) {
          console.log(`📦 Preload failed for ${tab} page ${adjacentPage}:`, error);
        }
      }
    }
  }, [getCacheKey]);

  // Мемоизированная функция получения заголовка вкладки
  const getTabTitle = useCallback((tab: TabType): string => {
    switch (tab) {
      case 'all': return 'Все мероприятия';
      case 'available': return 'Доступные мероприятия';
      case 'my': return 'Мои мероприятия';
      case 'archive': return 'Архив мероприятий';
      default: return 'Мероприятия';
    }
  }, []);

  // Мемоизированная функция получения пустого состояния
  const getEmptyStateMessage = useCallback((tab: TabType) => {
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
  }, []);

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

  // Оптимизированная функция загрузки событий с пагинацией
  const fetchEvents = useCallback(async (tab: TabType, page: number = 1, forceRefresh = false, silent = false) => {
    const cacheKey = getCacheKey(tab, page);
    const cached = eventsCache.current.get(cacheKey);
    const now = Date.now();
    
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      if (!silent) {
        setEvents(cached.data);
        setTotalItems(cached.totalItems);
        setLoading(false);
      }
      return cached.data;
    }

    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      let result;
      let totalCountResult;
      
      // Запросы с пагинацией и подсчет общего количества
      switch (tab) {
        case 'all':
          [result, totalCountResult] = await Promise.all([
            EventService.getAll(ITEMS_PER_PAGE, offset),
            EventService.getTotalCount()
          ]);
          break;
        case 'available':
          [result, totalCountResult] = await Promise.all([
            EventService.getAvailable(ITEMS_PER_PAGE, offset),
            EventService.getAvailableTotalCount()
          ]);
          break;
        case 'my':
          if (!user?.id) {
            if (!silent) {
              setEvents([]);
              setTotalItems(0);
              setLoading(false);
            }
            return [];
          }
          [result, totalCountResult] = await Promise.all([
            EventService.getUserEvents(user.id, ITEMS_PER_PAGE, offset),
            EventService.getUserEventsTotalCount(user.id)
          ]);
          break;
        case 'archive':
          if (!user?.id) {
            if (!silent) {
              setEvents([]);
              setTotalItems(0);
              setLoading(false);
            }
            return [];
          }
          [result, totalCountResult] = await Promise.all([
            EventService.getUserArchive(user.id, ITEMS_PER_PAGE, offset),
            EventService.getUserArchiveTotalCount(user.id)
          ]);
          break;
        default:
          [result, totalCountResult] = await Promise.all([
            EventService.getAll(ITEMS_PER_PAGE, offset),
            EventService.getTotalCount()
          ]);
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (totalCountResult.error) {
        console.warn('⚠️ Error getting total count:', totalCountResult.error.message);
      }

      let eventsData = result.data || [];
      
      // Фильтруем частные мероприятия для общих списков
      if (tab === 'all' || tab === 'available') {
        eventsData = eventsData.filter(event => 
          !event.is_private || (user?.id && event.created_by === user.id)
        );
      }
      
      // Используем точное количество из API или fallback к примерному
      const actualTotal = totalCountResult.data !== null ? totalCountResult.data : 
        (eventsData.length < ITEMS_PER_PAGE ? 
          (page - 1) * ITEMS_PER_PAGE + eventsData.length : 
          eventsData.length * 10);
      
      // Сохраняем в кэш
      eventsCache.current.set(cacheKey, {
        data: eventsData,
        totalItems: actualTotal,
        timestamp: now
      });
      
      if (!silent) {
        setEvents(eventsData);
        setTotalItems(actualTotal);
        
        // Аналитика
        reachGoal('events_list_loaded', {
          tab,
          page,
          events_count: eventsData.length,
          total_count: actualTotal,
          user_id: user?.id || 0,
          cache_hit: false
        });
      }

      // Предзагружаем соседние страницы
      if (!silent && eventsData.length > 0) {
        setTimeout(() => preloadAdjacentPages(tab, page), 1000);
      }
      
      return eventsData;
      
    } catch (err) {
      console.error('❌ Error fetching events:', err);
      
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки мероприятий');
        
        reachGoal('events_list_error', {
          tab,
          page,
          error: err instanceof Error ? err.message : 'unknown_error',
          user_id: user?.id || 0
        });
      }
      
      return [];
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [user?.id, reachGoal, getCacheKey, preloadAdjacentPages]);

  // Мемоизированный обработчик смены вкладки
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1); // Сбрасываем на первую страницу
    fetchEvents(tab, 1);
  }, [fetchEvents]);

  // Обработчик смены страницы
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    fetchEvents(activeTab, page);
    
    // Скроллим наверх при смене страницы
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, fetchEvents]);

  // Загрузка событий при монтировании
  useEffect(() => {
    fetchEvents(activeTab, currentPage);
  }, [fetchEvents, activeTab, currentPage]);

  // Очистка кэша при смене пользователя
  useEffect(() => {
    eventsCache.current.clear();
    setCurrentPage(1);
  }, [user?.id]);

  // Мемоизированные значения
  const tabTitle = useMemo(() => getTabTitle(activeTab), [getTabTitle, activeTab]);
  const emptyState = useMemo(() => getEmptyStateMessage(activeTab), [getEmptyStateMessage, activeTab]);
  const eventsCount = useMemo(() => events.length, [events.length]);

  if (loading) {
    return (
      <div className="w-full">
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{tabTitle}</h2>
          <LoadingGrid />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{tabTitle}</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 mb-2">⚠️ Ошибка загрузки</div>
            <div className="text-gray-600">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (eventsCount === 0) {
    return (
      <div className="w-full">
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{tabTitle}</h2>
          <EmptyState {...emptyState} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{tabTitle}</h2>
          <div className="text-sm text-gray-500">
            Страница {currentPage}
          </div>
        </div>

        <EventsGrid
          events={events}
          onEventClick={onEventClick}
          onMapClick={handleMapClick}
        />

        {/* Пагинация */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={handlePageChange}
          loading={loading}
        />
      </div>
    </div>
  );
}; 