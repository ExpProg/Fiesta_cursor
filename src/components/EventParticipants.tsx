/**
 * Компонент для отображения участников мероприятия
 */

import React, { useState, useEffect } from 'react';
import { Users, Eye, EyeOff } from 'lucide-react';
import { getEventParticipants, formatParticipantName } from '@/utils/eventResponses';
import type { EventParticipant } from '@/types/database';

interface EventParticipantsProps {
  eventId: string;
  currentParticipants: number;
  maxParticipants: number | null;
  className?: string;
}

export const EventParticipants: React.FC<EventParticipantsProps> = ({
  eventId,
  currentParticipants,
  maxParticipants,
  className = ''
}) => {
  const [participants, setParticipants] = useState<EventParticipant[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [loading, setLoading] = useState(false);

  // Загружаем участников при открытии списка
  useEffect(() => {
    if (showParticipants && participants.length === 0) {
      loadParticipants();
    }
  }, [showParticipants, eventId]);

  const loadParticipants = async () => {
    setLoading(true);
    try {
      const participantsList = await getEventParticipants(eventId);
      setParticipants(participantsList);
    } catch (error) {
      console.error('Failed to load participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleParticipants = () => {
    setShowParticipants(!showParticipants);
  };

  return (
    <div className={`${className}`}>
      {/* Заголовок с кнопкой показать/скрыть */}
      <div className="flex items-center justify-between">
        <div className="flex items-center text-gray-600">
          <Users className="w-5 h-5 mr-3 flex-shrink-0" />
          <div>
            <div className="font-medium">Участники</div>
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

        {/* Кнопка показать/скрыть участников */}
        {currentParticipants > 0 && (
          <button
            onClick={toggleParticipants}
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
                Показать
              </>
            )}
          </button>
        )}
      </div>

      {/* Список участников */}
      {showParticipants && (
        <div className="mt-4 border-t pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Загрузка участников...</span>
            </div>
          ) : participants.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 mb-3">
                Список участников ({participants.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {participants.map((participant, index) => (
                  <div
                    key={`${participant.telegram_id}-${index}`}
                    className="flex items-center p-2 bg-gray-50 rounded-lg"
                  >
                    {/* Аватар участника */}
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="text-blue-600 font-medium text-sm">
                        {participant.first_name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Информация об участнике */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {participant.display_name || formatParticipantName(participant.first_name, participant.last_name)}
                      </div>
                      {participant.username && (
                        <div className="text-xs text-gray-500 truncate">
                          @{participant.username}
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
                ))}
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