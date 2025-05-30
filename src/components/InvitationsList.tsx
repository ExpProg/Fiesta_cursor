import React, { useState, useEffect } from 'react';
import { InvitationService } from '@/services/invitationService';
import { getEventGradient } from '@/utils/gradients';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import type { EventInvitation } from '@/types/database';
import { Calendar, MapPin, Users, Check, X, Clock } from 'lucide-react';

interface InvitationsListProps {
  onEventClick?: (eventId: string) => void;
}

export const InvitationsList: React.FC<InvitationsListProps> = ({ 
  onEventClick
}) => {
  console.log('🎯 InvitationsList component rendering started');
  
  // Простая заглушка для тестирования
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Приглашения</h2>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <div className="text-blue-600 mb-2">🔧 Режим отладки</div>
        <div className="text-gray-600">Компонент InvitationsList успешно загружен</div>
        <div className="mt-4 text-sm text-gray-500">
          Если вы видите это сообщение, проблема была в логике компонента
        </div>
      </div>
    </div>
  );
};

interface InvitationCardProps {
  invitation: any;
  onResponse: (invitationId: string, status: 'accepted' | 'declined') => void;
  onEventClick?: (eventId: string) => void;
  isProcessing: boolean;
  getEventImage: (event: any) => string;
  formatDate: (dateString: string) => string;
  formatTime: (timeString: string | null) => string;
  getStatusColor: (status: string) => string;
  getStatusText: (status: string) => string;
  showActions?: boolean;
}

const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  onResponse,
  onEventClick,
  isProcessing,
  getEventImage,
  formatDate,
  formatTime,
  getStatusColor,
  getStatusText,
  showActions = true
}) => {
  // Защитные проверки
  if (!invitation || !invitation.events) {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">⚠️</div>
          <div>Ошибка загрузки приглашения</div>
        </div>
      </div>
    );
  }

  const event = invitation.events;
  
  try {
    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        {/* Изображение мероприятия */}
        <div className="relative h-48 overflow-hidden">
          {event.image_url ? (
            <img 
              src={event.image_url} 
              alt={event.title || 'Мероприятие'}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div 
              className="w-full h-full"
              style={{ background: getEventImage ? getEventImage(event) : '#f0f0f0' }}
            />
          )}
          
          {/* Статус приглашения */}
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor ? getStatusColor(invitation.status) : 'bg-gray-100 text-gray-600'}`}>
              {getStatusText ? getStatusText(invitation.status) : invitation.status}
            </span>
          </div>

          {/* Индикатор частного мероприятия */}
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Частное
            </span>
          </div>
        </div>

        {/* Информация о мероприятии */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
            {event.title || 'Без названия'}
          </h3>
          
          {event.description && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="space-y-2 mb-4">
            {/* Дата и время */}
            <div className="flex items-center text-gray-500 text-sm">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{formatDate ? formatDate(event.date) : event.date}</span>
              {event.event_time && (
                <>
                  <Clock className="w-4 h-4 ml-3 mr-1 flex-shrink-0" />
                  <span>{formatTime ? formatTime(event.event_time) : event.event_time}</span>
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
                {event.current_participants || 0} участников
                {event.max_participants && (
                  <span className="text-gray-400"> / {event.max_participants}</span>
                )}
              </span>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="space-y-2">
            {showActions && invitation.status === 'pending' && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onResponse && onResponse(invitation.id, 'accepted')}
                  disabled={isProcessing}
                  className="flex items-center justify-center py-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Принять
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => onResponse && onResponse(invitation.id, 'declined')}
                  disabled={isProcessing}
                  className="flex items-center justify-center py-2 px-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-1" />
                      Отклонить
                    </>
                  )}
                </button>
              </div>
            )}
            
            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              onClick={() => onEventClick && onEventClick(event.id)}
              disabled={!event.id}
            >
              Подробнее
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('❌ Error rendering InvitationCard:', error);
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">⚠️</div>
          <div>Ошибка отображения карточки</div>
        </div>
      </div>
    );
  }
}; 