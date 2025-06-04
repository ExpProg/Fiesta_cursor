import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { EventService } from '@/services/eventService';
import { getEventGradient } from '@/utils/gradients';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { TabNavigation, TabType } from './TabNavigation';
import { Pagination } from './Pagination';
import type { DatabaseEvent } from '@/types/database';
import { Calendar, MapPin, Users, Star, Clock, Loader2 } from 'lucide-react';

interface EventsListProps {
  onEventClick?: (event: DatabaseEvent) => void;
}

// Компонент для умной загрузки изображений с фоновой загрузкой
interface LazyImageProps {
  src: string;
  alt: string;
  className: string;
  fallbackGradient: string;
  eventId: string;
  onImageLoad?: (eventId: string, success: boolean) => void;
  priority?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className, 
  fallbackGradient, 
  eventId, 
  onImageLoad,
  priority = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Проверяем, является ли URL валидным
  const isValidUrl = useCallback((url: string) => {
    if (!url || url.trim() === '') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return url.includes('.') && (url.includes('jpg') || url.includes('jpeg') || url.includes('png') || url.includes('webp') || url.includes('gif'));
    }
  }, []);

  // Оптимизация URL изображения
  const getOptimizedImageUrl = useCallback((url: string) => {
    if (!isValidUrl(url)) {
      return '';
    }
    
    if (url.includes('supabase') && url.includes('storage')) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}width=300&height=200&resize=cover&quality=70&format=webp`;
    }
    return url;
  }, [isValidUrl]);

  // Intersection Observer для ленивой загрузки
  useEffect(() => {
    // Если это приоритетное изображение, загружаем сразу
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: priority ? '0px' : '100px' // Для приоритетных изображений убираем отступ
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Фоновая загрузка изображения
  useEffect(() => {
    if (!isInView || !isValidUrl(src) || isLoaded || hasError || isLoading) {
      return;
    }

    setIsLoading(true);
    const optimizedSrc = getOptimizedImageUrl(src);

    if (!optimizedSrc) {
      setHasError(true);
      setIsLoading(false);
      onImageLoad?.(eventId, false);
      return;
    }

    // Создаем новый Image объект для фоновой загрузки
    const img = new Image();
    
    img.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
      onImageLoad?.(eventId, true);
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      onImageLoad?.(eventId, false);
    };
    
    img.src = optimizedSrc;
  }, [isInView, src, isValidUrl, getOptimizedImageUrl, eventId, onImageLoad, isLoaded, hasError, isLoading]);

  const optimizedSrc = useMemo(() => getOptimizedImageUrl(src), [src, getOptimizedImageUrl]);

  return (
    <div ref={imgRef} className={className}>
      {!isInView ? (
        // Placeholder пока не в viewport
        <div 
          className="w-full h-full bg-gray-200 flex items-center justify-center"
          style={{ background: fallbackGradient }}
        >
          <div className="text-white/70 text-sm">📷</div>
        </div>
      ) : isLoaded && optimizedSrc ? (
        // Загруженное изображение
        <img
          src={optimizedSrc}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          width="300"
          height="200"
        />
      ) : (
        // Градиент с индикатором загрузки
        <div 
          className="w-full h-full flex items-center justify-center relative"
          style={{ background: fallbackGradient }}
        >
          {isLoading ? (
            <div className="text-white/70 text-xs flex items-center">
              <div className="w-3 h-3 border border-white/30 border-t-white/70 rounded-full animate-spin mr-1"></div>
              Загрузка...
            </div>
          ) : hasError ? (
            <div className="text-white/70 text-sm">🖼️</div>
          ) : (
            <div className="text-white/70 text-sm">📷</div>
          )}
        </div>
      )}
    </div>
  );
};

// Мемоизированный компонент карточки события
interface EventCardProps {
  event: DatabaseEvent;
  onEventClick?: (event: DatabaseEvent) => void;
  onMapClick: (event: DatabaseEvent) => void;
  onImageLoad?: (eventId: string, success: boolean) => void;
  priority?: boolean;
}

const EventCard: React.FC<EventCardProps> = React.memo(({ event, onEventClick, onMapClick, onImageLoad, priority = false }) => {
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
    return timeString.slice(0, 5);
  };

  const getEventGradient = (event: DatabaseEvent) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ];
    const index = parseInt(event.id.slice(-1), 16) % gradients.length;
    return gradients[index];
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer group"
      onClick={() => onEventClick && onEventClick(event)}
    >
      {/* Изображение мероприятия */}
      <div className="relative overflow-hidden h-48">
        <LazyImage
          src={event.image_url || ''}
          alt={event.title}
          className="w-full h-full relative group-hover:scale-105 transition-transform duration-300"
          fallbackGradient={getEventGradient(event)}
          eventId={event.id}
          onImageLoad={onImageLoad}
          priority={priority}
        />
        
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

// Мемоизированный компонент списка событий
const EventsGrid: React.FC<{
  events: DatabaseEvent[];
  onEventClick?: (event: DatabaseEvent) => void;
  onMapClick: (event: DatabaseEvent) => void;
  onImageLoad?: (eventId: string, success: boolean) => void;
}> = React.memo(({ events, onEventClick, onMapClick, onImageLoad }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event, index) => (
        <EventCard
          key={event.id}
          event={event}
          onEventClick={onEventClick}
          onMapClick={onMapClick}
          onImageLoad={onImageLoad}
          priority={index < 3} // Первые 3 события получают приоритет
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
  const { isAdmin, isLoading: adminLoading } = useAdminStatus();
  
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [events, setEvents] = useState<DatabaseEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [showDebug, setShowDebug] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [loadingTimings, setLoadingTimings] = useState<{[key: string]: number}>({});
  const [imageLoadStates, setImageLoadStates] = useState<Map<string, 'loading' | 'loaded' | 'error'>>(new Map());
  
  const ITEMS_PER_PAGE = 5; // 5 событий на странице + используем быстрые методы API для оптимальной производительности
  
  // Кэш для событий с пагинацией
  const eventsCache = useRef<Map<string, { data: DatabaseEvent[], timestamp: number, totalItems: number }>>(new Map());
  const CACHE_DURATION = 300000; // 5 минут

  // Функция переключения отладки
  const toggleDebug = useCallback(() => {
    setShowDebug(prev => !prev);
  }, []);

  // Обработчик загрузки изображений
  const handleImageLoad = useCallback((eventId: string, success: boolean) => {
    setImageLoadStates(prev => {
      const newMap = new Map(prev);
      newMap.set(eventId, success ? 'loaded' : 'error');
      return newMap;
    });
  }, []);

  // Генерируем ключ кэша с учетом пагинации
  const getCacheKey = useCallback((tab: TabType, page: number) => {
    return `${tab}_page_${page}`;
  }, []);

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

  // Основная функция загрузки событий
  const fetchEvents = useCallback(async (tab: TabType, page: number = 1, forceRefresh = false, silent = false) => {
    const startTime = performance.now();
    const timings: {[key: string]: number} = {};
    const cacheKey = getCacheKey(tab, page);
    const cached = eventsCache.current.get(cacheKey);
    const now = Date.now();
    const isPageChange = page !== currentPage;
    
    let lastTimingMark = startTime;
    const markTiming = (label: string) => {
      const currentTime = performance.now();
      timings[label] = currentTime - lastTimingMark;
      lastTimingMark = currentTime;
    };
    
    markTiming('Инициализация');
    
    // Проверяем кэш
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      markTiming('Проверка кэша');
      if (!silent) {
        setEvents(cached.data);
        setTotalItems(cached.totalItems);
        setLoading(false);
        setPageLoading(false);
        const totalTime = performance.now() - startTime;
        setLoadingTimings(timings);
        
        if (isPageChange) {
          setLoadingStage('Загружено из кэша');
          setTimeout(() => setLoadingStage(''), 1000);
        }
      }
      return cached.data;
    }

    markTiming('Проверка кэша');

    // Показываем старые данные если есть
    if (cached && !silent) {
      setEvents(cached.data);
      setTotalItems(cached.totalItems);
      if (isPageChange) {
        setPageLoading(true);
        setLoadingStage('Обновление страницы...');
      } else {
        setLoading(true);
        setLoadingStage('Обновление...');
      }
    }

    if (!silent) {
      if (isPageChange && cached) {
        setPageLoading(true);
        setLoadingStage(`Загрузка страницы ${page}...`);
      } else {
        setLoading(true);
        setLoadingStage(isPageChange ? `Загрузка страницы ${page}...` : 'Загрузка...');
      }
      setError(null);
    }

    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      let result;
      let totalCountResult;
      
      markTiming('Подготовка к API запросам');
      
      const apiStartTime = performance.now();
      
      switch (tab) {
        case 'all':
          result = await EventService.getAllFast(ITEMS_PER_PAGE, offset);
          markTiming('API: getAllFast');
          
          const countCacheKey = `${tab}_total_count`;
          const countCached = eventsCache.current.get(countCacheKey);
          if (!forceRefresh && countCached && (now - countCached.timestamp) < CACHE_DURATION * 2) {
            totalCountResult = { data: countCached.totalItems, error: null };
          } else {
            totalCountResult = await EventService.getTotalCount();
            if (totalCountResult.data !== null) {
              eventsCache.current.set(countCacheKey, {
                data: [],
                timestamp: now,
                totalItems: totalCountResult.data
              });
            }
          }
          markTiming('API: getTotalCount');
          break;
          
        case 'available':
          result = await EventService.getAvailableFast(ITEMS_PER_PAGE, offset);
          markTiming('API: getAvailableFast');
          
          const availableCountCacheKey = `${tab}_total_count`;
          const availableCountCached = eventsCache.current.get(availableCountCacheKey);
          if (!forceRefresh && availableCountCached && (now - availableCountCached.timestamp) < CACHE_DURATION * 2) {
            totalCountResult = { data: availableCountCached.totalItems, error: null };
          } else {
            totalCountResult = await EventService.getAvailableTotalCount();
            if (totalCountResult.data !== null) {
              eventsCache.current.set(availableCountCacheKey, {
                data: [],
                timestamp: now,
                totalItems: totalCountResult.data
              });
            }
          }
          markTiming('API: getAvailableTotalCount');
          break;
          
        case 'my':
          if (!user?.id) {
            if (!silent) {
              setEvents([]);
              setTotalItems(0);
              setLoading(false);
              setPageLoading(false);
            }
            return [];
          }
          result = await EventService.getUserEventsFast(user.id, ITEMS_PER_PAGE, offset);
          markTiming('API: getUserEventsFast');
          
          const myCountCacheKey = `${tab}_${user.id}_total_count`;
          const myCountCached = eventsCache.current.get(myCountCacheKey);
          if (!forceRefresh && myCountCached && (now - myCountCached.timestamp) < CACHE_DURATION * 2) {
            totalCountResult = { data: myCountCached.totalItems, error: null };
          } else {
            totalCountResult = await EventService.getUserEventsTotalCount(user.id);
            if (totalCountResult.data !== null) {
              eventsCache.current.set(myCountCacheKey, {
                data: [],
                timestamp: now,
                totalItems: totalCountResult.data
              });
            }
          }
          markTiming('API: getUserEventsTotalCount');
          break;
          
        case 'archive':
          if (!user?.id) {
            if (!silent) {
              setEvents([]);
              setTotalItems(0);
              setLoading(false);
              setPageLoading(false);
            }
            return [];
          }
          result = await EventService.getUserArchiveFast(user.id, ITEMS_PER_PAGE, offset);
          markTiming('API: getUserArchiveFast');
          
          const archiveCountCacheKey = `${tab}_${user.id}_total_count`;
          const archiveCountCached = eventsCache.current.get(archiveCountCacheKey);
          if (!forceRefresh && archiveCountCached && (now - archiveCountCached.timestamp) < CACHE_DURATION * 2) {
            totalCountResult = { data: archiveCountCached.totalItems, error: null };
          } else {
            totalCountResult = await EventService.getUserArchiveTotalCount(user.id);
            if (totalCountResult.data !== null) {
              eventsCache.current.set(archiveCountCacheKey, {
                data: [],
                timestamp: now,
                totalItems: totalCountResult.data
              });
            }
          }
          markTiming('API: getUserArchiveTotalCount');
          break;
          
        default:
          result = await EventService.getAllFast(ITEMS_PER_PAGE, offset);
          markTiming('API: getAllFast (default)');
          
          totalCountResult = await EventService.getTotalCount();
          markTiming('API: getTotalCount (default)');
      }

      const apiEndTime = performance.now();
      const totalApiTime = apiEndTime - apiStartTime;
      markTiming('Все API запросы завершены');

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (totalCountResult.error) {
        console.warn('⚠️ Error getting total count:', totalCountResult.error.message);
      }

      markTiming('Проверка ошибок API');

      let eventsData = result.data || [];
      
      // Фильтрация частных мероприятий
      if (tab === 'all' || tab === 'available') {
        eventsData = eventsData.filter(event => 
          !event.is_private || (user?.id && event.created_by === user.id)
        );
      }
      
      markTiming('Фильтрация событий');
      
      const actualTotal = totalCountResult.data !== null ? totalCountResult.data : 
        (eventsData.length < ITEMS_PER_PAGE ? 
          (page - 1) * ITEMS_PER_PAGE + eventsData.length : 
          eventsData.length * 10);
      
      markTiming('Подсчет общего количества');
      
      // Сохраняем в кэш
      eventsCache.current.set(cacheKey, {
        data: eventsData,
        totalItems: actualTotal,
        timestamp: now
      });
      
      markTiming('Сохранение в кэш');
      
      const totalTime = performance.now() - startTime;
      
      if (!silent) {
        setEvents(eventsData);
        setTotalItems(actualTotal);
        setLastLoadTime(totalTime);
        setLoadingTimings(timings);
        setLoadingStage(isPageChange ? `Страница ${page} загружена` : 'Завершено');
        
        setTimeout(() => {
          setLoadingStage('');
        }, isPageChange ? 1500 : 500);
        
        reachGoal('events_list_loaded', {
          tab,
          page,
          events_count: eventsData.length,
          total_count: actualTotal,
          user_id: user?.id || 0,
          cache_hit: false,
          load_time_ms: Math.round(totalTime),
          api_time_ms: Math.round(totalApiTime),
          is_page_change: isPageChange
        });
      }

      markTiming('Финализация');
      
      return eventsData;
      
    } catch (err) {
      const totalTime = performance.now() - startTime;
      markTiming('Обработка ошибки');
      
      if (!silent) {
        if (err instanceof Error && err.message.includes('AbortError')) {
          const timeoutMessage = `Запрос прерван по таймауту. Проверьте интернет-соединение.`;
          
          const diagnosticInfo = isAdmin ? {
            timestamp: new Date().toLocaleTimeString(),
            tab,
            page,
            userId: user?.id || 'неизвестен',
            supabaseUrl: import.meta.env.VITE_SUPABASE_URL?.substring(0, 30) + '...',
            userAgent: navigator.userAgent.substring(0, 50) + '...',
            connectionType: (navigator as any).connection?.effectiveType || 'неизвестен'
          } : null;
          
          setError(`${timeoutMessage}${diagnosticInfo ? `\n\nДиагностика (только для администраторов):\n• Вкладка: ${diagnosticInfo.tab}\n• Страница: ${diagnosticInfo.page}\n• Пользователь: ID ${diagnosticInfo.userId}\n• Supabase URL: ${diagnosticInfo.supabaseUrl}\n• Тип соединения: ${diagnosticInfo.connectionType}\n• Время: ${diagnosticInfo.timestamp}` : ''}`);
        } else {
          setError(err instanceof Error ? err.message : 'Ошибка загрузки мероприятий');
        }
        
        setLoadingStage(`Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
        setLoadingTimings(timings);
        
        reachGoal('events_list_error', {
          tab,
          page,
          error: err instanceof Error ? err.message : 'unknown_error',
          user_id: user?.id || 0,
          load_time_ms: Math.round(totalTime),
          is_page_change: isPageChange
        });
      }
      
      return [];
    } finally {
      if (!silent) {
        setLoading(false);
        setPageLoading(false);
      }
    }
  }, [user?.id, reachGoal, getCacheKey, isAdmin, adminLoading, currentPage]);

  // Функция принудительного обновления
  const forceRefresh = useCallback(() => {
    eventsCache.current.clear();
    setLastLoadTime(0);
    setImageLoadStates(new Map());
    
    fetchEvents(activeTab, currentPage, true);
    reachGoal('force_refresh', {
      tab: activeTab,
      page: currentPage,
      user_id: user?.id || 0
    });
  }, [activeTab, currentPage, fetchEvents, user?.id, reachGoal]);

  // Обработчик смены вкладки
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setImageLoadStates(new Map());
    fetchEvents(tab, 1);
  }, [fetchEvents]);

  // Обработчик смены страницы
  const handlePageChange = useCallback((page: number) => {
    setPageLoading(true);
    setLoadingStage(`Переход на страницу ${page}...`);
    
    setCurrentPage(page);
    fetchEvents(activeTab, page);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    reachGoal('page_change', {
      tab: activeTab,
      from_page: currentPage,
      to_page: page,
      user_id: user?.id || 0
    });
  }, [activeTab, fetchEvents, currentPage, user?.id, reachGoal]);

  // Загружаем события при инициализации
  useEffect(() => {
    fetchEvents(activeTab, 1);
  }, [activeTab, fetchEvents]);

  // Очистка кэша при смене пользователя
  useEffect(() => {
    eventsCache.current.clear();
    setCurrentPage(1);
    setImageLoadStates(new Map());
  }, [user?.id]);

  // Мемоизированные значения
  const tabTitle = useMemo(() => getTabTitle(activeTab), [getTabTitle, activeTab]);
  const emptyState = useMemo(() => getEmptyStateMessage(activeTab), [getEmptyStateMessage, activeTab]);
  const eventsCount = useMemo(() => events.length, [events.length]);

  // Статистика загрузки изображений
  const imageStats = useMemo(() => {
    const loaded = Array.from(imageLoadStates.values()).filter(state => state === 'loaded').length;
    const error = Array.from(imageLoadStates.values()).filter(state => state === 'error').length;
    const loading = events.length - loaded - error;
    return { loaded, error, loading };
  }, [imageLoadStates, events.length]);

  if (loading) {
    return (
      <div className="w-full">
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{tabTitle}</h2>
          
          {isAdmin && !adminLoading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-800 font-medium mb-2">🔄 {loadingStage}</div>
              <div className="text-sm text-blue-600 space-y-1">
                <div>Вкладка: {activeTab}</div>
                <div>Страница: {currentPage}</div>
                <div>Пользователь: {user?.id ? `ID ${user.id}` : 'Не авторизован'}</div>
                <div>Время: {new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          )}
          
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 mb-4 text-center">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="font-medium">Ошибка загрузки мероприятий</div>
            </div>
            
            <div className="text-gray-700 mb-4">
              <strong>Сообщение:</strong> {error}
            </div>
            
            <div className="mt-4 space-y-2">
              <button
                onClick={forceRefresh}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                🔄 Попробовать снова
              </button>
              
              {isAdmin && !adminLoading && (
                <button
                  onClick={() => setShowDebug(true)}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  🔧 Показать подробную диагностику
                </button>
              )}
            </div>
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
          <div className="flex items-center gap-4">
            {isAdmin && !adminLoading && (
              <button
                onClick={toggleDebug}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showDebug
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="Показать/скрыть отладочную информацию"
              >
                🔧
                <span className="hidden sm:inline">Debug</span>
              </button>
            )}
          </div>
        </div>

        {/* Индикатор загрузки страницы */}
        {pageLoading && (
          <div className="mb-4 flex items-center justify-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Loader2 className="w-5 h-5 mr-3 animate-spin text-blue-600" />
            <span className="text-blue-800 font-medium">{loadingStage}</span>
          </div>
        )}

        {/* Отладочная панель */}
        {isAdmin && !adminLoading && showDebug && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">🔧 Диагностика загрузки</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <div>• Время последней загрузки: {lastLoadTime > 0 ? `${lastLoadTime.toFixed(0)}ms` : 'не измерено'}</div>
              <div>• Статус производительности: {
                lastLoadTime === 0 ? '⚪ не известен' : 
                lastLoadTime < 1000 ? '🟢 отличная (< 1с)' :
                lastLoadTime < 2000 ? '🟡 хорошая (< 2с)' :
                lastLoadTime < 5000 ? '🟠 средняя (< 5с)' :
                '🔴 медленная (> 5с)'
              }</div>
              <div>• Изображения: загружено {imageStats.loaded}, ошибок {imageStats.error}, загружается {imageStats.loading}</div>
              <div>• Кэш: {eventsCache.current.size} страниц</div>
              <div>• Элементов на странице: {ITEMS_PER_PAGE}</div>
              <div>• Пагинация: страница {currentPage} из {Math.ceil(totalItems / ITEMS_PER_PAGE)}</div>
              <div>• Всего элементов: {totalItems}</div>
              <div>• Загрузка страницы: {pageLoading ? '🔄 в процессе' : '✅ завершена'}</div>
            </div>
          </div>
        )}

        <EventsGrid
          events={events}
          onEventClick={onEventClick}
          onMapClick={handleMapClick}
          onImageLoad={handleImageLoad}
        />

        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={handlePageChange}
          loading={pageLoading}
        />
      </div>
    </div>
  );
}; 