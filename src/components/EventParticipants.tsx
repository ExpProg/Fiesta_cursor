/**
 * Компонент для отображения участников мероприятия
 */

import React, { useState, useEffect } from 'react';
import { Users, Eye, EyeOff, UserMinus } from 'lucide-react';
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
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [notAttendingUsers, setNotAttendingUsers] = useState<EventParticipant[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showNotAttending, setShowNotAttending] = useState(false);
  const [loading, setLoading] = useState(false);

  // Загружаем участников при открытии списка
  useEffect(() => {
    if ((showParticipants || showNotAttending) && participants.length === 0 && notAttendingUsers.length === 0) {
      loadAllResponses();
    }
  }, [showParticipants, showNotAttending, eventId]);

  const loadAllResponses = async () => {
    setLoading(true);
    try {
      const allResponses = await getAllEventResponses(eventId);
      
      // Разделяем на участников и отказавшихся
      const attending: EventParticipant[] = [];
      const notAttending: EventParticipant[] = [];
      
      allResponses.forEach((response: EventResponse) => {
        const participant: EventParticipant = {
          telegram_id: response.user_telegram_id,
          first_name: response.user_first_name,
          last_name: response.user_last_name,
          username: response.user_username,
          response_status: response.response_status,
          responded_at: response.created_at,
          display_name: formatParticipantName(response.user_first_name, response.user_last_name)
        };
        
        if (response.response_status === 'attending') {
          attending.push(participant);
        } else if (response.response_status === 'not_attending') {
          notAttending.push(participant);
        }
      });
      
      setParticipants(attending);
      setNotAttendingUsers(notAttending);
    } catch (error) {
      console.error('Failed to load responses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${className}`}>
      {/* Заголовок с кнопками показать/скрыть */}
      <div className="flex items-center justify-between">
        <div className="flex items-center text-gray-600">
          <Users className="w-6 h-6 mr-4 flex-shrink-0 text-green-600" />
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

        {/* Кнопки показать/скрыть */}
        <div className="flex gap-2">
          {/* Кнопка участников */}
          {currentParticipants > 0 && (
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="flex items-center px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              {showParticipants ? (
                <>
                  <EyeOff className="w-4 h-4 mr-1" />
                  Скрыть
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Участники
                </>
              )}
            </button>
          )}
          
          {/* Кнопка отказавшихся */}
          <button
            onClick={() => setShowNotAttending(!showNotAttending)}
            className="flex items-center px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            {showNotAttending ? (
              <>
                <EyeOff className="w-4 h-4 mr-1" />
                Скрыть
              </>
            ) : (
              <>
                <UserMinus className="w-4 h-4 mr-1" />
                Отказы
              </>
            )}
          </button>
        </div>
      </div>

      {/* Списки участников и отказавшихся */}
      {(showParticipants || showNotAttending) && (
        <div className="mt-4 border-t pt-4 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Загрузка...</span>
            </div>
          ) : (
            <>
              {/* Список участников */}
              {showParticipants && (
                <div>
                  {participants.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-800 mb-3 flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        Участники ({participants.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {participants.map((participant, index) => {
                          const isOrganizer = organizerTelegramId === participant.telegram_id;
                          return (
                            <div
                              key={`attending-${participant.telegram_id}-${index}`}
                              className={`flex items-center p-2 rounded-lg ${
                                isOrganizer ? 'bg-blue-50 border border-blue-200' : 'bg-green-50'
                              }`}
                            >
                              {/* Аватар участника */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                                isOrganizer ? 'bg-blue-200' : 'bg-green-200'
                              }`}>
                                <span className={`font-medium text-sm ${
                                  isOrganizer ? 'text-blue-700' : 'text-green-700'
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

                              {/* Время отклика */}
                              <div className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                {new Date(participant.responded_at).toLocaleDateString('ru-RU', {
                                  day: '2-digit',
                                  month: '2-digit'
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p>Пока никто не записался</p>
                    </div>
                  )}
                </div>
              )}

              {/* Список отказавшихся */}
              {showNotAttending && (
                <div>
                  {notAttendingUsers.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="font-medium text-red-800 mb-3 flex items-center">
                        <UserMinus className="w-4 h-4 mr-2" />
                        Отказались ({notAttendingUsers.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {notAttendingUsers.map((participant, index) => {
                          const isOrganizer = organizerTelegramId === participant.telegram_id;
                          return (
                            <div
                              key={`not-attending-${participant.telegram_id}-${index}`}
                              className={`flex items-center p-2 rounded-lg ${
                                isOrganizer ? 'bg-blue-50 border border-blue-200' : 'bg-red-50'
                              }`}
                            >
                              {/* Аватар участника */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0 ${
                                isOrganizer ? 'bg-blue-200' : 'bg-red-200'
                              }`}>
                                <span className={`font-medium text-sm ${
                                  isOrganizer ? 'text-blue-700' : 'text-red-700'
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

                              {/* Время отклика */}
                              <div className="text-xs text-gray-400 ml-2 flex-shrink-0">
                                {new Date(participant.responded_at).toLocaleDateString('ru-RU', {
                                  day: '2-digit',
                                  month: '2-digit'
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <UserMinus className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p>Никто пока не отказался</p>
                    </div>
                  )}
                </div>
              )}
            </>
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