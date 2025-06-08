import React, { useState, useEffect } from 'react';
import { EventService } from '@/services/eventService';
import { getEventStatus, formatEventPeriod } from '@/utils/eventStatus';
import type { DatabaseEvent } from '@/types/database';
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface EventStatusDebugProps {
  className?: string;
}

export const EventStatusDebug: React.FC<EventStatusDebugProps> = ({ className = '' }) => {
  const [events, setEvents] = useState<DatabaseEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        const result = await EventService.getAll(5, 0);
        if (result.error) {
          throw new Error(result.error.message);
        }
        const allEvents = result.data || [];
        
        // Берем первые 5 событий для отладки
        setEvents(allEvents.slice(0, 5));
      } catch (err) {
        console.error('Error loading events for debug:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const formatDebugDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      original: dateString,
      parsed: date.toISOString(),
      local: date.toLocaleDateString('ru-RU'),
      dateOnly: new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString()
    };
  };

  const getCurrentDateInfo = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      now: now.toISOString(),
      today: today.toISOString(),
      local: now.toLocaleDateString('ru-RU'),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  };

  const analyzeEventStatus = (event: DatabaseEvent) => {
    const currentDate = getCurrentDateInfo();
    const eventDate = formatDebugDate(event.date);
    const endDate = event.end_date ? formatDebugDate(event.end_date) : null;
    const status = getEventStatus(event);

    const today = new Date(currentDate.today);
    const eventDateOnly = new Date(eventDate.dateOnly);
    const endDateOnly = endDate ? new Date(endDate.dateOnly) : null;

    let logic = '';
    if (endDate) {
      // Многодневное событие
      if (today < eventDateOnly) {
        logic = `today (${today.toISOString().split('T')[0]}) < eventDate (${eventDateOnly.toISOString().split('T')[0]}) → PLANNED`;
      } else if (today >= eventDateOnly && today <= endDateOnly!) {
        logic = `eventDate (${eventDateOnly.toISOString().split('T')[0]}) <= today (${today.toISOString().split('T')[0]}) <= endDate (${endDateOnly!.toISOString().split('T')[0]}) → ACTIVE`;
      } else {
        logic = `today (${today.toISOString().split('T')[0]}) > endDate (${endDateOnly!.toISOString().split('T')[0]}) → COMPLETED`;
      }
    } else {
      // Однодневное событие
      if (today < eventDateOnly) {
        logic = `today (${today.toISOString().split('T')[0]}) < eventDate (${eventDateOnly.toISOString().split('T')[0]}) → PLANNED`;
      } else if (today.getTime() === eventDateOnly.getTime()) {
        logic = `today (${today.toISOString().split('T')[0]}) === eventDate (${eventDateOnly.toISOString().split('T')[0]}) → ACTIVE`;
      } else {
        logic = `today (${today.toISOString().split('T')[0]}) > eventDate (${eventDateOnly.toISOString().split('T')[0]}) → COMPLETED`;
      }
    }

    return {
      currentDate,
      eventDate,
      endDate,
      status,
      logic,
      isMultiDay: !!endDate
    };
  };

  if (loading) {
    return (
      <div className={`bg-yellow-50 p-4 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 animate-spin text-yellow-600" />
          <span className="text-sm text-yellow-800">Загрузка событий для отладки...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 p-4 rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-800">Ошибка загрузки: {error}</span>
        </div>
      </div>
    );
  }

  const currentDateInfo = getCurrentDateInfo();

  return (
    <div className={`bg-blue-50 p-4 rounded-lg text-xs font-mono space-y-4 ${className}`}>
      <h3 className="font-bold text-sm text-blue-800">📊 Отладка статусов событий</h3>
      
      {/* Информация о текущей дате */}
      <div className="bg-white p-3 rounded border">
        <h4 className="font-semibold text-blue-700 mb-2">🕐 Текущая дата и время</h4>
        <div className="space-y-1">
          <div>Сейчас: {currentDateInfo.now}</div>
          <div>Сегодня (для сравнения): {currentDateInfo.today}</div>
          <div>Локальная дата: {currentDateInfo.local}</div>
          <div>Часовой пояс: {currentDateInfo.timezone}</div>
        </div>
      </div>

      {/* Анализ событий */}
      <div className="space-y-3">
        <h4 className="font-semibold text-blue-700">📋 Анализ событий (первые 5)</h4>
        {events.map((event) => {
          const analysis = analyzeEventStatus(event);
          const statusIcon = analysis.status.status === 'completed' ? '🔴' : 
                           analysis.status.status === 'active' ? '🟢' : '🔵';
          
          return (
            <div key={event.id} className="bg-white p-3 rounded border space-y-2">
              <div className="flex items-center gap-2">
                <span>{statusIcon}</span>
                <span className="font-semibold text-gray-800 truncate">
                  {event.title.substring(0, 30)}...
                </span>
                <span className={`px-2 py-1 rounded text-xs ${analysis.status.className}`}>
                  {analysis.status.label}
                </span>
              </div>
              
              <div className="space-y-1 text-xs">
                <div><strong>ID:</strong> {event.id}</div>
                <div><strong>Тип:</strong> {analysis.isMultiDay ? 'Многодневное' : 'Однодневное'}</div>
                <div><strong>Дата начала:</strong> {analysis.eventDate.original}</div>
                {analysis.endDate && (
                  <div><strong>Дата окончания:</strong> {analysis.endDate.original}</div>
                )}
                <div><strong>Период:</strong> {formatEventPeriod(event)}</div>
              </div>

              <div className="bg-gray-50 p-2 rounded">
                <div className="font-semibold text-gray-700 mb-1">🧮 Логика расчета:</div>
                <div className="text-xs break-all">{analysis.logic}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="font-semibold">Дата события (только дата):</div>
                  <div>{analysis.eventDate.dateOnly.split('T')[0]}</div>
                </div>
                {analysis.endDate && (
                  <div>
                    <div className="font-semibold">Дата окончания (только дата):</div>
                    <div>{analysis.endDate.dateOnly.split('T')[0]}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="bg-gray-50 p-3 rounded text-center">
          <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-gray-500" />
          <div className="text-gray-600">Нет событий для отладки</div>
        </div>
      )}
    </div>
  );
}; 