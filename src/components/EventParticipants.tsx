/**
 * Компонент для отображения участников мероприятия
 */

import React, { useState, useEffect } from 'react';
import { Users, Eye, EyeOff, Check, X } from 'lucide-react';
import { getAllEventResponses, formatParticipantName } from '@/utils/eventResponses';
import type { EventParticipant, EventResponse } from '@/types/database';

interface EventParticipantsProps {
  eventId: string;
  currentParticipants: number;
  maxParticipants: number | null;
  organizerTelegramId?: number; // ID создателя мероприятия
  className?: string;
}

export const EventParticipants: React.FC<EventParticipantsProps> = ({
  eventId,
  currentParticipants,
  maxParticipants,
  organizerTelegramId,
  className = ''
}) => {
  const [allResponses, setAllResponses] = useState<EventParticipant[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [loading, setLoading] = useState(false);

  // Загружаем участников при открытии списка
  useEffect(() => {
    if (showParticipants && allResponses.length === 0) {
      loadAllResponses();
    }
  }, [showParticipants, eventId]);

  const loadAllResponses = async () => {
    setLoading(true);
    try {
      const responses = await getAllEventResponses(eventId);
      
      // Преобразуем все отклики в участников
      const participants: EventParticipant[] = responses.map((response: EventResponse) => ({
        telegram_id: response.user_telegram_id,
        first_name: response.user_first_name,
        last_name: response.user_last_name,
        username: response.user_username,
        response_status: response.response_status,
        responded_at: response.created_at,
        display_name: formatParticipantName(response.user_first_name, response.user_last_name)
      }));
      
      // Сортируем: сначала идущие, потом отказавшиеся
      const sorted = participants.sort((a, b) => {
        if (a.response_status === 'attending' && b.response_status !== 'attending') return -1;
        if (a.response_status !== 'attending' && b.response_status === 'attending') return 1;
        return new Date(a.responded_at).getTime() - new Date(b.responded_at).getTime();
      });
      
      setAllResponses(sorted);
    } catch (error) {
      console.error('Failed to load responses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Подсчитываем статистику
  const attendingCount = allResponses.filter(p => p.response_status === 'attending').length;
  const notAttendingCount = allResponses.filter(p => p.response_status === 'not_attending').length;

  return (
    <div className={`${className}`}>
      {/* Заголовок с кнопкой показать/скрыть */}
      <div className="flex items-center justify-between">
        <div className="flex items-center text-gray-600">
          <Users className="w-6 h-6 mr-4 flex-shrink-0 text-blue-600" />
          <div>
            <div className="font-medium text-lg">Участники</div>
            <div className="text-sm">
              {currentParticipants} человек
              {maxParticipants && (
                <span className="text-gray-400"> / {maxParticipants}</span>
              )}
              {maxParticipants && currentParticipants < maxParticipants && (
                <span className="text-green-600 ml-2">
                  (осталось {maxParticipants - currentParticipants} мест)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Кнопка показать/скрыть */}
        {(currentParticipants > 0 || notAttendingCount > 0) && (
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {showParticipants ? (
              <>
                <EyeOff className="w-4 h-4 mr-1" />
                Скрыть
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1" />
                Показать список
              </>
            )}
          </button>
        )}
      </div>

      {/* Общий список участников */}
      {showParticipants && (
        <div className="mt-4 border-t pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Загрузка...</span>
            </div>
          ) : allResponses.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  Все отклики ({allResponses.length})
                </h4>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center text-green-600">
                    <Check className="w-3 h-3 mr-1" />
                    {attendingCount} идут
                  </span>
                  <span className="flex items-center text-red-600">
                    <X className="w-3 h-3 mr-1" />
                    {notAttendingCount} не идут
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                {allResponses.map((participant, index) => {
                  const isOrganizer = organizerTelegramId === participant.telegram_id;
                  const isAttending = participant.response_status === 'attending';
                  
                  return (
                    <div
                      key={`response-${participant.telegram_id}-${index}`}
                      className={`flex items-center p-3 rounded-lg border ${
                        isOrganizer 
                          ? 'bg-blue-50 border-blue-200' 
                          : isAttending 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      {/* Аватар участника */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                        isOrganizer 
                          ? 'bg-blue-200' 
                          : isAttending 
                          ? 'bg-green-200' 
                          : 'bg-red-200'
                      }`}>
                        <span className={`font-medium ${
                          isOrganizer 
                            ? 'text-blue-700' 
                            : isAttending 
                            ? 'text-green-700' 
                            : 'text-red-700'
                        }`}>
                          {participant.first_name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Информация об участнике */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <div className="font-medium text-gray-900 truncate">
                            {participant.display_name || formatParticipantName(participant.first_name, participant.last_name)}
                          </div>
                          {isOrganizer && (
                            <span className="ml-2 text-xs text-blue-600">👑</span>
                          )}
                        </div>
                        {participant.username && (
                          <div className="text-xs text-gray-500 truncate">
                            @{participant.username}
                          </div>
                        )}
                        {isOrganizer && (
                          <div className="text-xs text-blue-600 font-medium">
                            Организатор
                          </div>
                        )}
                      </div>

                      {/* Статус и время отклика */}
                      <div className="flex flex-col items-end ml-2 flex-shrink-0">
                        <div className={`flex items-center text-sm font-medium ${
                          isAttending ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {isAttending ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              Идет
                            </>
                          ) : (
                            <>
                              <X className="w-4 h-4 mr-1" />
                              Не идет
                            </>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(participant.responded_at).toLocaleDateString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>Пока никто не откликнулся</p>
            </div>
          )}
        </div>
      )}

      {/* Статус заполненности */}
      {maxParticipants && currentParticipants >= maxParticipants && (
        <div className="mt-2">
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              <span className="text-red-700 text-sm font-medium">
                Все места заняты
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 