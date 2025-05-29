/**
 * Компонент для кнопок откликов на мероприятие
 */

import React, { useState, useEffect } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { 
  getUserResponseStatus, 
  respondToEvent, 
  canUserRespond,
  getResponseButtonClass,
  getResponseStatusText,
  checkEventResponsesTable
} from '@/utils/eventResponses';
import type { ResponseStatus, DatabaseEvent } from '@/types/database';

interface EventResponseButtonsProps {
  event: DatabaseEvent;
  currentUserId?: number; // telegram_id текущего пользователя
  userFirstName?: string;
  userLastName?: string | null;
  userUsername?: string | null;
  onResponseChange?: (newResponse: ResponseStatus | null) => void;
  className?: string;
}

export const EventResponseButtons: React.FC<EventResponseButtonsProps> = ({
  event,
  currentUserId,
  userFirstName,
  userLastName,
  userUsername,
  onResponseChange,
  className = ''
}) => {
  const [userResponse, setUserResponse] = useState<ResponseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<ResponseStatus | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const [showChangeOptions, setShowChangeOptions] = useState(false);

  // Проверяем, является ли пользователь создателем мероприятия
  const isCreator = currentUserId === event.created_by;

  // Загружаем текущий статус отклика пользователя
  useEffect(() => {
    if (currentUserId) {
      checkTableAndLoadResponse();
    }
  }, [currentUserId, event.id]);

  const checkTableAndLoadResponse = async () => {
    // Сначала проверяем таблицу
    const tableCheck = await checkEventResponsesTable();
    if (!tableCheck.exists || !tableCheck.canInsert) {
      setTableError(tableCheck.error || 'Система откликов недоступна');
      return;
    }
    
    setTableError(null);
    loadUserResponse();
  };

  const loadUserResponse = async () => {
    if (!currentUserId) return;
    
    setLoading(true);
    try {
      const status = await getUserResponseStatus(event.id, currentUserId);
      setUserResponse(status);
    } catch (error) {
      console.error('Failed to load user response:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (responseStatus: ResponseStatus) => {
    if (!currentUserId || !userFirstName || submitting) return;

    // Если пользователь нажимает на уже выбранный статус, снимаем выбор
    const newStatus = userResponse === responseStatus ? null : responseStatus;

    setSubmitting(responseStatus);
    
    try {
      if (newStatus === null) {
        // Удаляем отклик (пока не реализовано, можно добавить позже)
        console.log('Remove response - not implemented yet');
        return;
      }

      const result = await respondToEvent(
        event.id,
        currentUserId,
        userFirstName,
        userLastName || null,
        userUsername || null,
        newStatus
      );

      if (result.success) {
        setUserResponse(newStatus);
        setShowChangeOptions(false);
        onResponseChange?.(newStatus);
        
        // Показываем успешное уведомление
        if (typeof window !== 'undefined' && 'Telegram' in window) {
          const telegram = (window as any).Telegram?.WebApp;
          if (telegram?.HapticFeedback) {
            telegram.HapticFeedback.impactOccurred('light');
          }
        }
      } else {
        console.error('Failed to respond to event:', result.error);
        alert('Не удалось отправить отклик. Попробуйте ещё раз.');
      }
    } catch (error) {
      console.error('Error responding to event:', error);
      alert('Произошла ошибка при отправке отклика.');
    } finally {
      setSubmitting(null);
    }
  };

  // Проверяем, может ли пользователь откликнуться
  const canRespond = canUserRespond(
    event.status,
    event.current_participants,
    event.max_participants,
    userResponse
  );

  // Организатор тоже может откликнуться на своё мероприятие

  // Если нет ID пользователя, показываем заглушку
  if (!currentUserId) {
    return (
      <div className={`${className}`}>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-gray-600 text-sm">
            Войдите через Telegram, чтобы откликнуться на мероприятие
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Ошибка системы откликов */}
      {tableError && (
        <div className="mb-3 p-3 bg-red-50 rounded-lg">
          <div className="text-red-700 text-sm">
            <div className="font-medium">Система откликов недоступна</div>
            <div className="text-xs mt-1">{tableError}</div>
          </div>
        </div>
      )}

      {/* Если у пользователя есть отклик и не показываем опции изменения */}
      {userResponse && !tableError && !showChangeOptions && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <div>
                <div className="font-medium text-green-800">
                  {userResponse === 'attending' ? 'Вы идёте на мероприятие!' : 
                   userResponse === 'not_attending' ? 'Вы не идёте на мероприятие' : 
                   'Возможно пойдёте'}
                </div>
                <div className="text-sm text-green-600">
                  Ваш отклик: {getResponseStatusText(userResponse)}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowChangeOptions(true)}
              className="text-sm text-green-700 hover:text-green-800 underline"
            >
              Изменить
            </button>
          </div>
        </div>
      )}

      {/* Если нет отклика или показываем опции изменения */}
      {(!userResponse || showChangeOptions) && !tableError && (
        <div className="space-y-3">
          {showChangeOptions && (
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Изменить отклик:</h3>
              <button
                onClick={() => setShowChangeOptions(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Отмена
              </button>
            </div>
          )}
          
          {!showChangeOptions && (
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Идёте на мероприятие?</h3>
              {isCreator && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  👑 Организатор
                </span>
              )}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            {/* Кнопка "Буду" */}
            <button
              onClick={() => {
                handleResponse('attending');
                setShowChangeOptions(false);
              }}
              disabled={!canRespond || submitting !== null || loading}
              className={getResponseButtonClass('attending', userResponse, !canRespond || loading)}
            >
              {submitting === 'attending' ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Отправка...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <Check className="w-4 h-4 mr-2" />
                  Буду
                </div>
              )}
            </button>

            {/* Кнопка "Не буду" */}
            <button
              onClick={() => {
                handleResponse('not_attending');
                setShowChangeOptions(false);
              }}
              disabled={submitting !== null || loading}
              className={getResponseButtonClass('not_attending', userResponse, loading)}
            >
              {submitting === 'not_attending' ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Отправка...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <X className="w-4 h-4 mr-2" />
                  Не буду
                </div>
              )}
            </button>
          </div>

          {/* Дополнительная информация */}
          {!canRespond && (
            <div className="text-sm text-gray-500 text-center mt-2">
              {event.status !== 'active' 
                ? 'Мероприятие неактивно' 
                : 'Все места заняты'
              }
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-gray-600 text-sm">Загрузка...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 