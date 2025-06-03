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

// Компонент для ленивой загрузки изображений с оптимизацией
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

  // Агрессивная оптимизация URL изображения для быстрой загрузки
  const getOptimizedImageUrl = useCallback((url: string) => {
    // Если это Supabase Storage URL, добавляем параметры оптимизации
    if (url.includes('supabase') && url.includes('storage')) {
      // Более агрессивная оптимизация для быстрой загрузки
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}width=300&height=200&resize=cover&quality=60&format=webp`;
    }
    return url;
  }, []);

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
        rootMargin: '200px' // Увеличиваем до 200px для более ранней загрузки
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

  const optimizedSrc = useMemo(() => getOptimizedImageUrl(src), [src, getOptimizedImageUrl]);

  return (
    <div ref={imgRef} className={className}>
      {!isInView ? (
        // Placeholder пока изображение не в viewport
        <div 
          className="w-full h-full bg-gray-200 flex items-center justify-center"
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
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: fallbackGradient }}
            >
              <div className="text-white/70 text-xs">Загрузка...</div>
            </div>
          )}
          
          {/* Само изображение */}
          <img
            src={optimizedSrc}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            decoding="async"
            // Оптимизированные размеры
            width="300"
            height="200"
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
  imagesEnabled?: boolean; // Новый проп для управления изображениями
}

const EventCard: React.FC<EventCardProps> = React.memo(({ event, onEventClick, onMapClick, imagesEnabled = true }) => {
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
      <div className={`relative overflow-hidden ${imagesEnabled ? 'h-48' : 'h-24'}`}>
        {imagesEnabled && event.image_url ? (
          <LazyImage
            src={event.image_url}
            alt={event.title}
            className="w-full h-full relative group-hover:scale-105 transition-transform duration-300"
            fallbackGradient={getEventImage(event)}
          />
        ) : (
          <div 
            className={`w-full h-full group-hover:scale-105 transition-transform duration-300 flex items-center justify-center ${
              !imagesEnabled ? 'text-white font-medium' : ''
            }`}
            style={{ background: getEventImage(event) }}
          >
            {!imagesEnabled && (
              <div className="text-center">
                <div className="text-lg mb-1">🎉</div>
                <div className="text-sm opacity-90">Быстрый режим</div>
              </div>
            )}
          </div>
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
  imagesEnabled?: boolean;
}> = React.memo(({ events, onEventClick, onMapClick, imagesEnabled = true }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onEventClick={onEventClick}
          onMapClick={onMapClick}
          imagesEnabled={imagesEnabled}
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
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [imagesEnabled, setImagesEnabled] = useState(() => {
    // Инициализируем из localStorage или по умолчанию true
    const saved = localStorage.getItem('eventsImagesEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  }); // Новое состояние для управления изображениями
  const [showDebug, setShowDebug] = useState(false); // Отладочная панель
  const [lastLoadTime, setLastLoadTime] = useState<number>(0); // Время последней загрузки
  const [loadingStage, setLoadingStage] = useState<string>(''); // Этап загрузки для диагностики
  const [loadingTimings, setLoadingTimings] = useState<{[key: string]: number}>({}); // Детальные тайминги
  const [fastMode, setFastMode] = useState(() => {
    // Инициализируем из localStorage или по умолчанию false для обычной загрузки
    const saved = localStorage.getItem('eventsFastMode');
    return saved !== null ? JSON.parse(saved) : false;
  }); // Обычный режим загрузки (быстрый режим отключен)
  
  const ITEMS_PER_PAGE = 10; // Увеличиваем до 10 для меньшего количества запросов
  
  // Кэш для событий с пагинацией
  const eventsCache = useRef<Map<string, { data: DatabaseEvent[], timestamp: number, totalItems: number }>>(new Map());
  const CACHE_DURATION = 120000; // 2 минуты

  // Функция для переключения режима изображений
  const toggleImages = useCallback(() => {
    setImagesEnabled((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem('eventsImagesEnabled', JSON.stringify(newValue));
      return newValue;
    });
    reachGoal('images_toggle', {
      enabled: !imagesEnabled,
      tab: activeTab,
      user_id: user?.id || 0
    });
  }, [imagesEnabled, activeTab, user?.id, reachGoal]);

  // Функция переключения быстрого режима
  const toggleFastMode = useCallback(() => {
    setFastMode((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem('eventsFastMode', JSON.stringify(newValue));
      // Очищаем кэш при смене режима
      eventsCache.current.clear();
      return newValue;
    });
    reachGoal('fast_mode_toggle', {
      enabled: !fastMode,
      tab: activeTab,
      user_id: user?.id || 0
    });
    // Перезагружаем данные в новом режиме
    fetchEvents(activeTab, currentPage, true);
  }, [fastMode, activeTab, currentPage, user?.id, reachGoal]);

  // Функция переключения отладки
  const toggleDebug = useCallback(() => {
    setShowDebug(prev => !prev);
  }, []);

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
    const startTime = performance.now();
    const timings: {[key: string]: number} = {};
    const cacheKey = getCacheKey(tab, page);
    const cached = eventsCache.current.get(cacheKey);
    const now = Date.now();
    
    // Детальная диагностика времени
    let lastTimingMark = startTime;
    const markTiming = (label: string) => {
      const currentTime = performance.now();
      timings[label] = currentTime - lastTimingMark;
      lastTimingMark = currentTime;
      console.log(`⏱️ ${label}: ${timings[label].toFixed(2)}ms`);
    };
    
    markTiming('Инициализация');
    
    // Проверяем кэш первым делом
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      markTiming('Проверка кэша');
      if (!silent) {
        setEvents(cached.data);
        setTotalItems(cached.totalItems);
        setLoading(false);
        const totalTime = performance.now() - startTime;
        setLoadingTimings(timings);
        console.log(`⚡ Cache hit for ${tab} page ${page} (${totalTime.toFixed(2)}ms)`);
      }
      return cached.data;
    }

    markTiming('Проверка кэша');

    // Если есть старые данные в кэше (даже просроченные), показываем их сразу
    // и загружаем свежие данные в фоне
    if (cached && !silent) {
      console.log(`🔄 Showing stale cache while loading fresh data for ${tab} page ${page}`);
      setEvents(cached.data);
      setTotalItems(cached.totalItems);
      setLoading(true); // Показываем, что идет обновление
      setLoadingStage('Обновление...');
    }

    if (!silent) {
      setLoading(true);
      setError(null);
      setLoadingStage('Загрузка...');
    }

    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      let result;
      let totalCountResult;
      
      console.log(`🔄 Loading ${tab} page ${page} (offset: ${offset}, limit: ${ITEMS_PER_PAGE})`);
      
      markTiming('Подготовка к API запросам');
      
      // Замеряем время каждого API запроса отдельно
      const apiStartTime = performance.now();
      
      switch (tab) {
        case 'all':
          console.log(`🔄 Fetching all events (${fastMode ? 'fast' : 'normal'} mode)...`);
          const allEventsStart = performance.now();
          result = fastMode ? 
            await EventService.getAllFast(ITEMS_PER_PAGE, offset) :
            await EventService.getAll(ITEMS_PER_PAGE, offset);
          markTiming(fastMode ? 'API: getAllFast' : 'API: getAll');
          
          const allCountStart = performance.now();
          totalCountResult = await EventService.getTotalCount();
          markTiming('API: getTotalCount');
          break;
          
        case 'available':
          const availableEventsStart = performance.now();
          result = fastMode ?
            await EventService.getAvailableFast(ITEMS_PER_PAGE, offset) :
            await EventService.getAvailable(ITEMS_PER_PAGE, offset);
          markTiming(fastMode ? 'API: getAvailableFast' : 'API: getAvailable');
          
          const availableCountStart = performance.now();
          totalCountResult = await EventService.getAvailableTotalCount();
          markTiming('API: getAvailableTotalCount');
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
          const myEventsStart = performance.now();
          result = fastMode ?
            await EventService.getUserEventsFast(user.id, ITEMS_PER_PAGE, offset) :
            await EventService.getUserEvents(user.id, ITEMS_PER_PAGE, offset);
          markTiming(fastMode ? 'API: getUserEventsFast' : 'API: getUserEvents');
          
          const myCountStart = performance.now();
          totalCountResult = await EventService.getUserEventsTotalCount(user.id);
          markTiming('API: getUserEventsTotalCount');
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
          const archiveEventsStart = performance.now();
          result = fastMode ?
            await EventService.getUserArchiveFast(user.id, ITEMS_PER_PAGE, offset) :
            await EventService.getUserArchive(user.id, ITEMS_PER_PAGE, offset);
          markTiming(fastMode ? 'API: getUserArchiveFast' : 'API: getUserArchive');
          
          const archiveCountStart = performance.now();
          totalCountResult = await EventService.getUserArchiveTotalCount(user.id);
          markTiming('API: getUserArchiveTotalCount');
          break;
          
        default:
          const defaultEventsStart = performance.now();
          result = fastMode ?
            await EventService.getAllFast(ITEMS_PER_PAGE, offset) :
            await EventService.getAll(ITEMS_PER_PAGE, offset);
          markTiming(fastMode ? 'API: getAllFast (default)' : 'API: getAll (default)');
          
          const defaultCountStart = performance.now();
          totalCountResult = await EventService.getTotalCount();
          markTiming('API: getTotalCount (default)');
      }

      const apiEndTime = performance.now();
      const totalApiTime = apiEndTime - apiStartTime;
      console.log(`📊 All API calls completed in ${totalApiTime.toFixed(2)}ms`);
      markTiming('Все API запросы завершены');

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (totalCountResult.error) {
        console.warn('⚠️ Error getting total count:', totalCountResult.error.message);
      }

      markTiming('Проверка ошибок API');

      let eventsData = result.data || [];
      
      // Быстрая фильтрация частных мероприятий
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
      console.log(`✅ ${tab} page ${page} loaded: ${eventsData.length} events in ${totalTime.toFixed(2)}ms`);
      
      // Детальная диагностика производительности
      console.log('🔍 Детальные тайминги:', timings);
      
      if (!silent) {
        setEvents(eventsData);
        setTotalItems(actualTotal);
        setLastLoadTime(totalTime);
        setLoadingTimings(timings);
        setLoadingStage('Завершено');
        
        // Аналитика
        reachGoal('events_list_loaded', {
          tab,
          page,
          events_count: eventsData.length,
          total_count: actualTotal,
          user_id: user?.id || 0,
          cache_hit: false,
          load_time_ms: Math.round(totalTime),
          api_time_ms: Math.round(totalApiTime),
          timings: Object.entries(timings).reduce((acc, [key, value]) => {
            acc[key] = Math.round(value);
            return acc;
          }, {} as {[key: string]: number})
        });
      }

      markTiming('Финализация');

      // Предзагружаем соседние страницы в фоне
      if (!silent && eventsData.length > 0) {
        setTimeout(() => preloadAdjacentPages(tab, page), 500);
      }
      
      return eventsData;
      
    } catch (err) {
      const totalTime = performance.now() - startTime;
      console.error(`❌ Error fetching events (${totalTime.toFixed(2)}ms):`, err);
      markTiming('Обработка ошибки');
      
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки мероприятий');
        setLoadingStage(`Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
        setLoadingTimings(timings);
        
        reachGoal('events_list_error', {
          tab,
          page,
          error: err instanceof Error ? err.message : 'unknown_error',
          user_id: user?.id || 0,
          load_time_ms: Math.round(totalTime),
          timings: Object.entries(timings).reduce((acc, [key, value]) => {
            acc[key] = Math.round(value);
            return acc;
          }, {} as {[key: string]: number})
        });
      }
      
      return [];
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [user?.id, reachGoal, getCacheKey, preloadAdjacentPages, isAdmin, adminLoading]);

  // Функция принудительного обновления
  const forceRefresh = useCallback(() => {
    eventsCache.current.clear();
    setLastLoadTime(0);
    fetchEvents(activeTab, currentPage, true);
    reachGoal('force_refresh', {
      tab: activeTab,
      page: currentPage,
      user_id: user?.id || 0
    });
  }, [activeTab, currentPage, fetchEvents, user?.id, reachGoal]);

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

  // Загружаем события при инициализации
  useEffect(() => {
    fetchEvents(activeTab, 1);
  }, [activeTab, fetchEvents]);

  // Автоматическое отключение изображений при медленной загрузке
  useEffect(() => {
    if (lastLoadTime > 5000 && imagesEnabled) { // Если загрузка дольше 5 секунд
      console.log('🐌 Slow loading detected, suggesting to disable images for better performance');
      setImagesEnabled(false);
      localStorage.setItem('eventsImagesEnabled', JSON.stringify(false));
      // Перезагружаем данные без изображений
      setTimeout(() => fetchEvents(activeTab, currentPage, true), 500);
    }
    
    // Если загрузка дольше 15 секунд, выводим предупреждение
    if (lastLoadTime > 15000) {
      console.warn('🚨 Very slow connection detected:', {
        loadTime: lastLoadTime,
        tab: activeTab,
        page: currentPage,
        suggestions: [
          'Check internet connection',
          'Try switching to mobile data',
          'Contact support if issue persists'
        ]
      });
      
      // Показываем уведомление пользователю (если доступно Telegram Web App)
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert(
          'Медленное соединение. Попробуйте проверить интернет-подключение или переключиться на мобильные данные.'
        );
      }
    }
  }, [lastLoadTime, imagesEnabled, activeTab, currentPage, fetchEvents]);

  // Детектор очень медленной загрузки - если первая загрузка занимает >15 секунд
  useEffect(() => {
    if (lastLoadTime > 15000 && events.length === 0) {
      console.warn('🆘 Emergency mode triggered due to extremely slow initial loading (>15s)');
      
      // Автоматически переключаемся в экстренный режим только при критично медленной загрузке
      if (!fastMode) {
        console.log('🔄 Auto-enabling fast mode due to critical performance issues');
        setFastMode(true);
        localStorage.setItem('eventsFastMode', JSON.stringify(true));
      }
      
      if (imagesEnabled) {
        console.log('🖼️ Auto-disabling images due to critical performance issues');
        setImagesEnabled(false);
        localStorage.setItem('eventsImagesEnabled', JSON.stringify(false));
      }
      
      // Очищаем кэш и пробуем снова
      eventsCache.current.clear();
      setTimeout(() => fetchEvents(activeTab, 1, true), 1000);
    }
  }, [lastLoadTime, events.length, fastMode, imagesEnabled, activeTab, fetchEvents]);

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
          
          {/* Диагностика загрузки только для администраторов */}
          {isAdmin && !adminLoading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-blue-800 font-medium mb-2">🔄 {loadingStage}</div>
              <div className="text-sm text-blue-600 space-y-1">
                <div>Вкладка: {activeTab}</div>
                <div>Страница: {currentPage}</div>
                <div>Пользователь: {user?.id ? `ID ${user.id}` : 'Не авторизован'}</div>
                <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅ Настроен' : '❌ Не настроен'}</div>
                <div>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Настроен' : '❌ Не настроен'}</div>
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
            
            {/* Диагностика только для администраторов */}
            {isAdmin && !adminLoading && (
              <div className="bg-white p-3 rounded border text-sm space-y-2">
                <div><strong>Диагностика (только для администраторов):</strong></div>
                <div>• Вкладка: {activeTab}</div>
                <div>• Страница: {currentPage}</div>
                <div>• Пользователь: {user?.id ? `ID ${user.id}` : 'Не авторизован'}</div>
                <div>• Supabase URL: {import.meta.env.VITE_SUPABASE_URL || 'НЕ НАСТРОЕН'}</div>
                <div>• Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Настроен' : 'НЕ НАСТРОЕН'}</div>
                <div>• Время: {new Date().toLocaleTimeString()}</div>
              </div>
            )}
            
            <div className="mt-4 space-y-2">
              <button
                onClick={forceRefresh}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                🔄 Попробовать снова
              </button>
              
              {/* Кнопка отладки только для администраторов */}
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
          
          {/* Диагностика пустого состояния только для администраторов */}
          {isAdmin && !adminLoading && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="text-yellow-800 font-medium mb-2">ℹ️ Диагностика загрузки (только для администраторов)</div>
              <div className="text-sm text-yellow-700 space-y-1">
                <div>• Загрузка завершена: ✅</div>
                <div>• Ошибок нет: ✅</div>
                <div>• Количество событий: {events.length}</div>
                <div>• Общее количество: {totalItems}</div>
                <div>• Вкладка: {activeTab}</div>
                <div>• Пользователь: {user?.id ? `ID ${user.id}` : 'Не авторизован'}</div>
                <div>• Время загрузки: {lastLoadTime ? `${lastLoadTime.toFixed(0)}ms` : 'N/A'}</div>
                <div>• Кэш записей: {eventsCache.current.size}</div>
              </div>
            </div>
          )}
          
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
            {/* Кнопка отладки только для администраторов */}
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

        {/* Отладочная панель только для администраторов */}
        {isAdmin && !adminLoading && showDebug && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">🔧 Диагностика загрузки</h3>
            <div className="text-xs text-blue-700 space-y-1">
              <div>• Текущий этап: {loadingStage}</div>
              <div>• Время последней загрузки: {lastLoadTime > 0 ? `${lastLoadTime.toFixed(0)}ms` : 'не измерено'}</div>
              <div>• Статус производительности: {
                lastLoadTime === 0 ? '⚪ не известен' : 
                lastLoadTime < 1000 ? '🟢 отличная (< 1с)' :
                lastLoadTime < 2000 ? '🟡 хорошая (< 2с)' :
                lastLoadTime < 5000 ? '🟠 средняя (< 5с)' :
                '🔴 медленная (> 5с)'
              }</div>
              <div>• Быстрый режим: {fastMode ? '✅ включен' : '❌ выключен (обычный режим)'}</div>
              <div>• Изображения: {imagesEnabled ? '✅ включены' : '❌ выключены'}</div>
              <div>• Кэш: {eventsCache.current.size} страниц</div>
              <div>• Элементов на странице: {ITEMS_PER_PAGE}</div>
              <div>• Пагинация: страница {currentPage} из {Math.ceil(totalItems / ITEMS_PER_PAGE)}</div>
              <div>• Всего элементов: {totalItems}</div>
              <div>• Supabase URL: {import.meta.env.VITE_SUPABASE_URL?.substring(0, 30)}...</div>
              <div>• API ключ: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ установлен' : '❌ отсутствует'}</div>
              
              {/* Детальный разбор времени загрузки */}
              {Object.keys(loadingTimings).length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="text-sm font-medium text-blue-900 mb-2">📊 Детальный разбор времени:</div>
                  <div className="space-y-1">
                    {Object.entries(loadingTimings).map(([key, time]) => {
                      // Определяем цвет на основе времени
                      const getTimeColor = (time: number) => {
                        if (time < 100) return 'text-green-600';
                        if (time < 500) return 'text-yellow-600';
                        if (time < 1000) return 'text-orange-600';
                        return 'text-red-600';
                      };
                      
                      return (
                        <div key={key} className={`text-xs ${getTimeColor(time)}`}>
                          • {key}: {time < 1 ? '0.0' : time.toFixed(1)}ms
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Анализ производительности */}
                  {lastLoadTime > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="text-sm font-medium text-blue-900 mb-2">Анализ производительности:</div>
                      
                      {/* Медленные этапы */}
                      {(() => {
                        const slowStages = Object.entries(loadingTimings).filter(([_, time]) => time > 1000);
                        if (slowStages.length > 0) {
                          return (
                            <div className="text-xs text-orange-700 mb-2">
                              <div>⚠️ Медленные этапы (&gt;1с): {slowStages.map(([key, time]) => `${key} (${time.toFixed(0)}ms)`).join(', ')}</div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      
                      {/* API vs Client время */}
                      {(() => {
                        const apiTimes = Object.entries(loadingTimings)
                          .filter(([key]) => key.startsWith('API:'))
                          .reduce((sum, [_, time]) => sum + time, 0);
                        const totalTime = lastLoadTime;
                        const clientTime = totalTime - apiTimes;
                        
                        const apiPercent = (apiTimes / totalTime * 100).toFixed(1);
                        const clientPercent = (clientTime / totalTime * 100).toFixed(1);
                        
                        return (
                          <div className="text-xs text-blue-700 space-y-1">
                            <div>• Время API запросов: {apiTimes.toFixed(0)}ms ({apiPercent}%)</div>
                            <div>• Время обработки в клиенте: {clientTime.toFixed(0)}ms ({clientPercent}%)</div>
                          </div>
                        );
                      })()}
                      
                      {/* Рекомендации по производительности */}
                      {(() => {
                        const apiTimes = Object.entries(loadingTimings)
                          .filter(([key]) => key.startsWith('API:'))
                          .reduce((sum, [_, time]) => sum + time, 0);
                        const clientTime = lastLoadTime - apiTimes;
                        
                        if (apiTimes > 8000) {
                          return (
                            <div className="text-xs text-red-700 mt-2">
                              <div>🚨 Проблема: API запросы очень медленные (&gt;8с). Возможные причины:</div>
                              <div className="ml-2 space-y-1">
                                <div>• Медленное интернет-соединение</div>
                                <div>• Проблемы с Supabase сервером</div>
                                <div>• Неоптимизированные запросы к БД</div>
                                <div>• Недостаток индексов в базе данных</div>
                              </div>
                            </div>
                          );
                        } else if (clientTime > 2000) {
                          return (
                            <div className="text-xs text-red-700 mt-2">
                              <div>🚨 Проблема: Медленная обработка в клиенте (&gt;2с). Возможные причины:</div>
                              <div className="ml-2 space-y-1">
                                <div>• Медленное устройство</div>
                                <div>• Проблемы с браузером</div>
                                <div>• Слишком много данных для обработки</div>
                              </div>
                            </div>
                          );
                        } else if (lastLoadTime > 5000) {
                          return (
                            <div className="text-xs text-orange-700 mt-2">
                              <div>⚠️ Общая производительность ниже нормы. Рекомендации:</div>
                              <div className="ml-2 space-y-1">
                                <div>• Включите быстрый режим</div>
                                <div>• Отключите изображения</div>
                                <div>• Проверьте интернет-соединение</div>
                              </div>
                            </div>
                          );
                        } else if (lastLoadTime < 1000) {
                          return (
                            <div className="text-xs text-green-700 mt-2">
                              <div>✅ Отличная производительность! Все оптимизации работают корректно.</div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <EventsGrid
          events={events}
          onEventClick={onEventClick}
          onMapClick={handleMapClick}
          imagesEnabled={imagesEnabled}
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