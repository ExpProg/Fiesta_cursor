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

  // Оптимизируем URL изображения для быстрой загрузки
  const getOptimizedImageUrl = useCallback((url: string) => {
    // Если это Supabase Storage URL, добавляем параметры оптимизации
    if (url.includes('supabase') && url.includes('storage')) {
      // Добавляем параметры для сжатия и изменения размера
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}width=400&height=300&resize=cover&quality=75`;
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
        rootMargin: '100px' // Увеличиваем до 100px для более плавной загрузки
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
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleLoad}
            onError={handleError}
            loading="lazy"
            decoding="async"
            // Добавляем размеры для оптимизации
            width="400"
            height="300"
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
  
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [events, setEvents] = useState<DatabaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [imagesEnabled, setImagesEnabled] = useState(() => {
    // Инициализируем из localStorage или по умолчанию true
    const saved = localStorage.getItem('eventsImagesEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  }); // Новое состояние для управления изображениями
  const [showDebug, setShowDebug] = useState(false); // Отладочная панель
  const [lastLoadTime, setLastLoadTime] = useState<number | null>(null); // Время последней загрузки
  const [loadingStage, setLoadingStage] = useState<string>('Инициализация...'); // Этап загрузки
  const [fastMode, setFastMode] = useState(() => {
    // Инициализируем из localStorage или по умолчанию false
    const saved = localStorage.getItem('eventsFastMode');
    return saved !== null ? JSON.parse(saved) : false;
  }); // Быстрый режим загрузки
  
  const ITEMS_PER_PAGE = 5;
  
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
    const startTime = performance.now(); // Добавляем замер времени
    const cacheKey = getCacheKey(tab, page);
    const cached = eventsCache.current.get(cacheKey);
    const now = Date.now();
    
    if (!silent) {
      setLoadingStage('Проверка кэша...');
    }
    
    // Диагностика
    console.log('🔍 EventsList.fetchEvents called:', {
      tab,
      page,
      forceRefresh,
      silent,
      hasUser: !!user?.id,
      userId: user?.id,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
    });
    
    if (!forceRefresh && cached && (now - cached.timestamp) < CACHE_DURATION) {
      if (!silent) {
        setEvents(cached.data);
        setTotalItems(cached.totalItems);
        setLoading(false);
        setLoadingStage('Завершено');
        console.log(`⚡ Cache hit for ${tab} page ${page} (${(performance.now() - startTime).toFixed(2)}ms)`);
      }
      return cached.data;
    }

    if (!silent) {
      setLoading(true);
      setError(null);
      setLoadingStage('Подключение к базе данных...');
    }

    try {
      const offset = (page - 1) * ITEMS_PER_PAGE;
      let result;
      let totalCountResult;
      
      console.log(`🔄 Loading ${tab} page ${page} (offset: ${offset}, limit: ${ITEMS_PER_PAGE})`);
      const apiStartTime = performance.now();
      
      // Простая проверка подключения к Supabase с таймаутом
      try {
        if (!silent) setLoadingStage('Тестирование подключения...');
        const { supabase } = await import('@/hooks/useSupabase');
        console.log('🔍 Testing Supabase connection...');
        
        // Добавляем таймаут для запроса
        const connectionPromise = supabase.from('events').select('count').limit(1);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Таймаут подключения (10 секунд)')), 10000)
        );
        
        const { data: testData, error: testError } = await Promise.race([connectionPromise, timeoutPromise]) as any;
        
        if (testError) {
          console.error('❌ Supabase connection test failed:', testError);
          throw new Error(`Ошибка подключения к базе данных: ${testError.message}`);
        }
        console.log('✅ Supabase connection test passed');
        if (!silent) setLoadingStage('Подключение успешно! Загрузка данных...');
      } catch (connectionError) {
        console.error('❌ Supabase connection error:', connectionError);
        if (!silent) setLoadingStage('Ошибка подключения');
        throw connectionError;
      }
      
      // Запросы с пагинацией и подсчет общего количества
      switch (tab) {
        case 'all':
          console.log('🔄 Fetching all events...');
          if (!silent) setLoadingStage(`Загрузка всех мероприятий${fastMode ? ' (быстрый режим)' : ''}...`);
          if (fastMode) {
            [result, totalCountResult] = await Promise.all([
              EventService.getAllFast(ITEMS_PER_PAGE, offset),
              EventService.getTotalCount()
            ]);
          } else {
            [result, totalCountResult] = await Promise.all([
              EventService.getAll(ITEMS_PER_PAGE, offset),
              EventService.getTotalCount()
            ]);
          }
          break;
        case 'available':
          if (!silent) setLoadingStage(`Загрузка доступных мероприятий${fastMode ? ' (быстрый режим)' : ''}...`);
          if (fastMode) {
            [result, totalCountResult] = await Promise.all([
              EventService.getAvailableFast(ITEMS_PER_PAGE, offset),
              EventService.getAvailableTotalCount()
            ]);
          } else {
            [result, totalCountResult] = await Promise.all([
              EventService.getAvailable(ITEMS_PER_PAGE, offset),
              EventService.getAvailableTotalCount()
            ]);
          }
          break;
        case 'my':
          if (!user?.id) {
            if (!silent) {
              setEvents([]);
              setTotalItems(0);
              setLoading(false);
              setLoadingStage('Пользователь не авторизован');
            }
            return [];
          }
          if (!silent) setLoadingStage(`Загрузка ваших мероприятий${fastMode ? ' (быстрый режим)' : ''}...`);
          if (fastMode) {
            [result, totalCountResult] = await Promise.all([
              EventService.getUserEventsFast(user.id, ITEMS_PER_PAGE, offset),
              EventService.getUserEventsTotalCount(user.id)
            ]);
          } else {
            [result, totalCountResult] = await Promise.all([
              EventService.getUserEvents(user.id, ITEMS_PER_PAGE, offset),
              EventService.getUserEventsTotalCount(user.id)
            ]);
          }
          break;
        case 'archive':
          if (!user?.id) {
            if (!silent) {
              setEvents([]);
              setTotalItems(0);
              setLoading(false);
              setLoadingStage('Пользователь не авторизован');
            }
            return [];
          }
          if (!silent) setLoadingStage(`Загрузка архива${fastMode ? ' (быстрый режим)' : ''}...`);
          if (fastMode) {
            [result, totalCountResult] = await Promise.all([
              EventService.getUserArchiveFast(user.id, ITEMS_PER_PAGE, offset),
              EventService.getUserArchiveTotalCount(user.id)
            ]);
          } else {
            [result, totalCountResult] = await Promise.all([
              EventService.getUserArchive(user.id, ITEMS_PER_PAGE, offset),
              EventService.getUserArchiveTotalCount(user.id)
            ]);
          }
          break;
        default:
          if (!silent) setLoadingStage(`Загрузка по умолчанию${fastMode ? ' (быстрый режим)' : ''}...`);
          if (fastMode) {
            [result, totalCountResult] = await Promise.all([
              EventService.getAllFast(ITEMS_PER_PAGE, offset),
              EventService.getTotalCount()
            ]);
          } else {
            [result, totalCountResult] = await Promise.all([
              EventService.getAll(ITEMS_PER_PAGE, offset),
              EventService.getTotalCount()
            ]);
          }
      }

      if (!silent) setLoadingStage('Обработка данных...');
      const apiEndTime = performance.now();
      console.log(`📊 API calls completed in ${(apiEndTime - apiStartTime).toFixed(2)}ms`);

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (totalCountResult.error) {
        console.warn('⚠️ Error getting total count:', totalCountResult.error.message);
      }

      let eventsData = result.data || [];
      
      // Фильтруем частные мероприятия для общих списков
      if (!silent) setLoadingStage('Фильтрация данных...');
      const filterStartTime = performance.now();
      if (tab === 'all' || tab === 'available') {
        eventsData = eventsData.filter(event => 
          !event.is_private || (user?.id && event.created_by === user.id)
        );
      }
      const filterEndTime = performance.now();
      console.log(`🔍 Filtering completed in ${(filterEndTime - filterStartTime).toFixed(2)}ms`);
      
      // Используем точное количество из API или fallback к примерному
      const actualTotal = totalCountResult.data !== null ? totalCountResult.data : 
        (eventsData.length < ITEMS_PER_PAGE ? 
          (page - 1) * ITEMS_PER_PAGE + eventsData.length : 
          eventsData.length * 10);
      
      // Сохраняем в кэш
      if (!silent) setLoadingStage('Сохранение в кэш...');
      eventsCache.current.set(cacheKey, {
        data: eventsData,
        totalItems: actualTotal,
        timestamp: now
      });
      
      const totalTime = performance.now() - startTime;
      console.log(`✅ ${tab} page ${page} loaded: ${eventsData.length} events in ${totalTime.toFixed(2)}ms`);
      
      if (!silent) {
        setEvents(eventsData);
        setTotalItems(actualTotal);
        setLastLoadTime(totalTime); // Сохраняем время загрузки
        setLoadingStage('Завершено успешно!');
        
        // Аналитика с временными метриками
        reachGoal('events_list_loaded', {
          tab,
          page,
          events_count: eventsData.length,
          total_count: actualTotal,
          user_id: user?.id || 0,
          cache_hit: false,
          load_time_ms: Math.round(totalTime),
          api_time_ms: Math.round(apiEndTime - apiStartTime)
        });
      }

      // Предзагружаем соседние страницы
      if (!silent && eventsData.length > 0) {
        setTimeout(() => preloadAdjacentPages(tab, page), 1000);
      }
      
      return eventsData;
      
    } catch (err) {
      const totalTime = performance.now() - startTime;
      console.error(`❌ Error fetching events (${totalTime.toFixed(2)}ms):`, err);
      
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки мероприятий');
        setLoadingStage(`Ошибка: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
        
        reachGoal('events_list_error', {
          tab,
          page,
          error: err instanceof Error ? err.message : 'unknown_error',
          user_id: user?.id || 0,
          load_time_ms: Math.round(totalTime)
        });
      }
      
      return [];
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [user?.id, reachGoal, getCacheKey, preloadAdjacentPages, fastMode]);

  // Функция принудительного обновления
  const forceRefresh = useCallback(() => {
    eventsCache.current.clear();
    setLastLoadTime(null);
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
          
          {/* Визуальная диагностика загрузки */}
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
            
            {/* Кнопка принудительной остановки загрузки */}
            <button
              onClick={() => {
                setLoading(false);
                setLoadingStage('Остановлено пользователем');
                setError('Загрузка была остановлена пользователем');
              }}
              className="mt-3 w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              ⏹️ Остановить загрузку
            </button>
          </div>
          
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
          
          {/* Расширенная информация об ошибке */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 mb-4 text-center">
              <div className="text-2xl mb-2">⚠️</div>
              <div className="font-medium">Ошибка загрузки мероприятий</div>
            </div>
            
            <div className="text-gray-700 mb-4">
              <strong>Сообщение:</strong> {error}
            </div>
            
            <div className="bg-white p-3 rounded border text-sm space-y-2">
              <div><strong>Диагностика:</strong></div>
              <div>• Вкладка: {activeTab}</div>
              <div>• Страница: {currentPage}</div>
              <div>• Пользователь: {user?.id ? `ID ${user.id}` : 'Не авторизован'}</div>
              <div>• Supabase URL: {import.meta.env.VITE_SUPABASE_URL || 'НЕ НАСТРОЕН'}</div>
              <div>• Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Настроен' : 'НЕ НАСТРОЕН'}</div>
              <div>• Время: {new Date().toLocaleTimeString()}</div>
            </div>
            
            <div className="mt-4 space-y-2">
              <button
                onClick={forceRefresh}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                🔄 Попробовать снова
              </button>
              
              <button
                onClick={() => setShowDebug(true)}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                🔧 Показать подробную диагностику
              </button>
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
          
          {/* Диагностика пустого состояния */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-yellow-800 font-medium mb-2">ℹ️ Диагностика загрузки</div>
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
            
            <button
              onClick={forceRefresh}
              className="mt-3 w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              🔄 Обновить данные
            </button>
          </div>
          
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
            {/* Кнопка переключения быстрого режима */}
            <button
              onClick={toggleFastMode}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                fastMode
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={fastMode ? 'Отключить быстрый режим (включить полную функциональность)' : 'Включить быстрый режим (упрощенная загрузка)'}
            >
              {fastMode ? '⚡' : '🔧'}
              <span className="hidden sm:inline">
                {fastMode ? 'Быстро' : 'Полный'}
              </span>
            </button>

            {/* Кнопка переключения изображений */}
            <button
              onClick={toggleImages}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                imagesEnabled
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={imagesEnabled ? 'Отключить изображения для быстрой загрузки' : 'Включить изображения'}
            >
              {imagesEnabled ? '🖼️' : '⚡'}
              <span className="hidden sm:inline">
                {imagesEnabled ? 'Изображения' : 'Быстрый режим'}
              </span>
            </button>

            {/* Кнопка принудительного обновления */}
            <button
              onClick={forceRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Принудительно обновить данные"
            >
              🔄
              <span className="hidden sm:inline">Обновить</span>
            </button>

            {/* Кнопка отладки */}
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
            
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Страница {currentPage} из {Math.ceil(totalItems / ITEMS_PER_PAGE)}
              </div>
              <div className="text-xs text-gray-400">
                Всего: {totalItems} {totalItems === 1 ? 'мероприятие' : totalItems < 5 ? 'мероприятия' : 'мероприятий'}
                {lastLoadTime && (
                  <span className="ml-2 text-blue-500">
                    ({lastLoadTime.toFixed(0)}ms)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Отладочная панель */}
        {showDebug && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">🔧 Отладочная информация</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Производительность:</strong>
                <ul className="mt-1 space-y-1">
                  <li>Последняя загрузка: {lastLoadTime ? `${lastLoadTime.toFixed(2)}ms` : 'N/A'}</li>
                  <li>Кэш записей: {eventsCache.current.size}</li>
                  <li>Изображения: {imagesEnabled ? 'Включены' : 'Отключены'}</li>
                  <li>Режим загрузки: {fastMode ? 'Быстрый' : 'Полный'}</li>
                </ul>
              </div>
              <div>
                <strong>Текущее состояние:</strong>
                <ul className="mt-1 space-y-1">
                  <li>Вкладка: {activeTab}</li>
                  <li>Страница: {currentPage}</li>
                  <li>Загрузка: {loading ? 'Да' : 'Нет'}</li>
                  <li>Пользователь: {user?.id || 'Не авторизован'}</li>
                </ul>
              </div>
              <div>
                <strong>Данные:</strong>
                <ul className="mt-1 space-y-1">
                  <li>События на странице: {events.length}</li>
                  <li>Всего событий: {totalItems}</li>
                  <li>Элементов на страницу: {ITEMS_PER_PAGE}</li>
                  <li>Ошибка: {error || 'Нет'}</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-300">
              <p className="text-xs text-gray-600">
                💡 Если загрузка медленная, попробуйте отключить изображения или проверьте консоль браузера для подробной информации.
              </p>
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