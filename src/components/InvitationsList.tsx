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
  const { reachGoal } = useYandexMetrika();
  const { user } = useTelegramWebApp();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingInvitations, setProcessingInvitations] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id) {
      loadInvitations();
    }
  }, [user]);

  const loadInvitations = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);

      const result = await InvitationService.getUserInvitations(user.id);
      
      if (result.error) {
        setError(result.error.message);
      } else {
        setInvitations(result.data || []);
        
        reachGoal('invitations_list_loaded', {
          invitations_count: result.data?.length || 0,
          user_id: user.id
        });
      }
    } catch (err) {
      setError('Не удалось загрузить приглашения');
      console.error('Error fetching invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationResponse = async (invitationId: string, status: 'accepted' | 'declined') => {
    setProcessingInvitations(prev => new Set(prev).add(invitationId));
    
    try {
      reachGoal('invitation_response_attempt', {
        invitation_id: invitationId,
        response: status
      });

      const result = await InvitationService.updateInvitationStatus(invitationId, status);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      reachGoal('invitation_response_success', {
        invitation_id: invitationId,
        response: status
      });

      // Обновляем локальное состояние
      setInvitations(prev => 
        prev.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status }
            : inv
        )
      );

    } catch (error) {
      console.error('Error updating invitation:', error);
      
      reachGoal('invitation_response_error', {
        invitation_id: invitationId,
        response: status,
        error: error instanceof Error ? error.message : 'unknown_error'
      });
      
      alert('Не удалось обновить статус приглашения. Попробуйте еще раз.');
    } finally {
      setProcessingInvitations(prev => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

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

  const getEventImage = (event: any) => {
    if (event.image_url) return event.image_url;
    return event.gradient_background || getEventGradient(event);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Ожидает ответа';
      case 'accepted':
        return 'Принято';
      case 'declined':
        return 'Отклонено';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Приглашения</h2>
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
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Приглашения</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-2">⚠️ Ошибка загрузки</div>
          <div className="text-gray-600">{error}</div>
          <button
            onClick={loadInvitations}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Приглашения</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📧</div>
          <div className="text-xl font-medium text-gray-700 mb-2">
            У вас нет приглашений
          </div>
          <div className="text-gray-500">
            Здесь будут отображаться приглашения на частные мероприятия
          </div>
        </div>
      </div>
    );
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const respondedInvitations = invitations.filter(inv => inv.status !== 'pending');

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Приглашения</h2>
        <div className="text-sm text-gray-500">
          {invitations.length} {invitations.length === 1 ? 'приглашение' : invitations.length < 5 ? 'приглашения' : 'приглашений'}
        </div>
      </div>

      {/* Ожидающие ответа приглашения */}
      {pendingInvitations.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-yellow-600" />
            Ожидают ответа ({pendingInvitations.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingInvitations.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                onResponse={handleInvitationResponse}
                onEventClick={onEventClick}
                isProcessing={processingInvitations.has(invitation.id)}
                getEventImage={getEventImage}
                formatDate={formatDate}
                formatTime={formatTime}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
              />
            ))}
          </div>
        </div>
      )}

      {/* Отвеченные приглашения */}
      {respondedInvitations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            История ответов ({respondedInvitations.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {respondedInvitations.map((invitation) => (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                onResponse={handleInvitationResponse}
                onEventClick={onEventClick}
                isProcessing={false}
                getEventImage={getEventImage}
                formatDate={formatDate}
                formatTime={formatTime}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
                showActions={false}
              />
            ))}
          </div>
        </div>
      )}
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
  const event = invitation.events;
  
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Изображение мероприятия */}
      <div className="relative h-48 overflow-hidden">
        {event.image_url ? (
          <img 
            src={event.image_url} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full"
            style={{ background: getEventImage(event) }}
          />
        )}
        
        {/* Статус приглашения */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
            {getStatusText(invitation.status)}
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
          {event.title}
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

        {/* Кнопки действий */}
        <div className="space-y-2">
          {showActions && invitation.status === 'pending' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onResponse(invitation.id, 'accepted')}
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
                onClick={() => onResponse(invitation.id, 'declined')}
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
          >
            Подробнее
          </button>
        </div>
      </div>
    </div>
  );
}; 