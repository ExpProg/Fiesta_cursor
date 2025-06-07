import React from 'react';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { DatabaseEvent } from '../types/database';
import { getEventStatus, formatEventPeriod } from '../utils/eventStatus';

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
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [isInView, setIsInView] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);

  // Проверяем, является ли URL валидным
  const isValidUrl = React.useCallback((url: string) => {
    if (!url || url.trim() === '') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return url.includes('.') && (url.includes('jpg') || url.includes('jpeg') || url.includes('png') || url.includes('webp') || url.includes('gif'));
    }
  }, []);

  // Оптимизация URL изображения
  const getOptimizedImageUrl = React.useCallback((url: string) => {
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
  React.useEffect(() => {
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
        rootMargin: priority ? '0px' : '100px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  // Фоновая загрузка изображения
  React.useEffect(() => {
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

  const optimizedSrc = React.useMemo(() => getOptimizedImageUrl(src), [src, getOptimizedImageUrl]);

  return (
    <div ref={imgRef} className={className}>
      {!isInView ? (
        <div 
          className="w-full h-full bg-gray-200 flex items-center justify-center"
          style={{ background: fallbackGradient }}
        >
          <div className="text-white/70 text-sm">📷</div>
        </div>
      ) : isLoaded && optimizedSrc ? (
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

interface EventCardProps {
  event: DatabaseEvent;
  onEventClick?: (event: DatabaseEvent) => void;
  onMapClick: (event: DatabaseEvent) => void;
  onImageLoad?: (eventId: string, success: boolean) => void;
  priority?: boolean;
}

export const EventCard: React.FC<EventCardProps> = React.memo(({ 
  event, 
  onEventClick, 
  onMapClick, 
  onImageLoad, 
  priority = false 
}) => {
  const eventStatus = getEventStatus(event);
  
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
            <span 
              className={`px-2 py-1 rounded-full text-xs font-medium border shadow-sm ${eventStatus.className}`}
              title={eventStatus.description}
            >
              {eventStatus.label}
            </span>
            
            {event.is_private && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200 shadow-sm flex items-center">
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
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
            {event.title}
          </h3>
          {eventStatus.status === 'active' && (
            <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          )}
        </div>
        
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
                {formatEventPeriod(event)}
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
              className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors duration-200 ${
                eventStatus.status === 'active' 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
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