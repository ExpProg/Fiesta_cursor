import React, { useState, useEffect } from 'react';
import { EventService } from '@/services/eventService';
import { getEventGradient } from '@/utils/gradients';
import type { DatabaseEvent } from '@/types/database';
import { Calendar, MapPin, Users, Star, Clock } from 'lucide-react';

interface EventsListProps {
  title?: string;
  limit?: number;
  showUpcoming?: boolean;
  showPopular?: boolean;
  onEventClick?: (event: DatabaseEvent) => void;
}

export const EventsList: React.FC<EventsListProps> = ({ 
  title = "Доступные мероприятия",
  limit = 6,
  showUpcoming = true,
  showPopular = false,
  onEventClick
}) => {
  const [events, setEvents] = useState<DatabaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        let result;
        if (showPopular) {
          result = await EventService.getPopular(limit);
        } else {
          result = await EventService.getUpcoming(limit);
        }

        if (result.error) {
          setError(result.error.message);
        } else {
          setEvents(result.data || []);
        }
      } catch (err) {
        setError('Не удалось загрузить мероприятия');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [limit, showUpcoming, showPopular]);

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

  if (loading) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
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
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-2">⚠️ Ошибка загрузки</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <div className="text-xl font-medium text-gray-700 mb-2">
            Пока нет мероприятий
          </div>
          <div className="text-gray-500">
            Скоро здесь появятся интересные события!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        {showPopular && (
          <div className="flex items-center text-yellow-600">
            <Star className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Популярные</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div 
            key={event.id} 
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer group"
            onClick={() => onEventClick && onEventClick(event)}
          >
            {/* Изображение мероприятия */}
            <div className="relative h-48 overflow-hidden">
              {event.image_url ? (
                <img 
                  src={event.image_url} 
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div 
                  className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                  style={{ background: getEventImage(event) }}
                />
              )}
              
              {/* Статус */}
              <div className="absolute top-3 right-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  event.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {event.status === 'active' ? 'Активно' : 'Завершено'}
                </span>
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
                  <span>{formatDate(event.date)}</span>
                  {event.event_time && (
                    <>
                      <Clock className="w-4 h-4 ml-3 mr-1 flex-shrink-0" />
                      <span>{formatTime(event.event_time)}</span>
                    </>
                  )}
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

              {/* Кнопка действия */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick && onEventClick(event);
                  }}
                >
                  Подробнее
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Показать больше */}
      {events.length >= limit && (
        <div className="text-center mt-8">
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200">
            Показать ещё мероприятия
          </button>
        </div>
      )}
    </div>
  );
}; 