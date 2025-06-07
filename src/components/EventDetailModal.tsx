import React, { useState, useEffect, useMemo } from 'react';
import type { DatabaseEvent, ResponseStatus } from '@/types/database';
import { 
  Calendar, 
  MapPin, 
  User, 
  X,
  Share2,
  MessageCircle,
  Copy,
  Check,
  Edit,
  Trash2
} from 'lucide-react';
import { shareEvent, generateEventShareUrl, copyToClipboard, generateTelegramWebAppUrl } from '@/utils/sharing';
import { refreshEventData } from '@/utils/eventResponses';
import { EventParticipants } from './EventParticipants';
import { EventResponseButtons } from './EventResponseButtons';
import { useTelegram } from './TelegramProvider';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';
import { supabase } from '@/hooks/useSupabase';
import { getEventStatus, formatEventPeriod } from '../utils/eventStatus';

interface EventDetailModalProps {
  event: DatabaseEvent;
  onClose: () => void;
  onEdit?: (event: DatabaseEvent) => void;
  onDelete?: (eventId: string) => void;
  currentUserId?: number; // telegram_id текущего пользователя
  userFirstName?: string;
  userLastName?: string | null;
  userUsername?: string | null;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ 
  event, 
  onClose, 
  onEdit,
  onDelete,
  currentUserId,
  userFirstName,
  userLastName,
  userUsername
}) => {
  const { impactOccurred } = useTelegram();
  const { reachGoal } = useYandexMetrika();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  const [updatedEvent, setUpdatedEvent] = useState<DatabaseEvent>(event);
  const [organizerInfo, setOrganizerInfo] = useState<{
    first_name: string;
    last_name: string | null;
    username: string | null;
  } | null>(null);
  const [loadingOrganizer, setLoadingOrganizer] = useState(false);
  
  // Используем оригинальное событие для определения статуса (как в списке)
  const eventStatus = getEventStatus(event);
  
  
  // Обновляем локальное состояние мероприятия при изменении props
  useEffect(() => {
    setUpdatedEvent(event);
  }, [event]);

  // Загружаем информацию об организаторе
  useEffect(() => {
    const fetchOrganizerInfo = async () => {
      if (!updatedEvent.created_by) return;
      
      setLoadingOrganizer(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select('first_name, last_name, username')
          .eq('telegram_id', updatedEvent.created_by)
          .single();

        if (error) {
          console.error('Error fetching organizer info:', error);
          return;
        }

        if (data) {
          setOrganizerInfo(data);
        }
      } catch (error) {
        console.error('Error fetching organizer info:', error);
      } finally {
        setLoadingOrganizer(false);
      }
    };

    fetchOrganizerInfo();
  }, [updatedEvent.created_by]);

  // Обработчик изменения отклика - обновляет данные мероприятия из БД
  const handleResponseChange = async (newResponse: ResponseStatus | null) => {
    console.log('User response changed to:', newResponse);
    
    // Обновляем данные мероприятия из базы данных
    try {
      const refreshedEvent = await refreshEventData(updatedEvent.id);
      if (refreshedEvent) {
        setUpdatedEvent(refreshedEvent);
        console.log('Event data refreshed, new participant count:', refreshedEvent.current_participants);
      }
    } catch (error) {
      console.error('Failed to refresh event data:', error);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    return timeString.slice(0, 5); // HH:MM
  };

  const getEventImage = (imageUrl: string | null) => {
    if (imageUrl) return imageUrl;
    // Fallback градиенты для разных мероприятий
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  const isCreator = currentUserId && updatedEvent.created_by === currentUserId;

  // Определяем, настроен ли Telegram бот
  const telegramBotUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
  const hasTelegramBot = telegramBotUsername && 
    telegramBotUsername !== 'your_bot' && 
    telegramBotUsername !== 'your_bot_username';

  const handleShare = async () => {
    setIsSharing(true);
    setShareSuccess(false);
    
    try {
      const shareData = {
        eventId: updatedEvent.id,
        title: updatedEvent.title,
        description: updatedEvent.description || undefined,
        imageUrl: updatedEvent.image_url || undefined
      };

      const result = await shareEvent(shareData);
      
      if (result.success) {
        setShareSuccess(true);
        
        // Тактильная обратная связь
        impactOccurred('medium');
        
        // Показываем успешное сообщение
        let message = '';
        switch (result.method) {
          case 'telegram':
            message = 'Отправлено через Telegram!';
            break;
          case 'telegram_copy':
            message = 'Ссылка скопирована для отправки в Telegram!';
            break;
          case 'native':
            message = 'Ссылка отправлена!';
            break;
          case 'clipboard':
            message = 'Ссылка скопирована в буфер обмена!';
            break;
          default:
            message = 'Готово!';
            break;
        }
        
        // Временно показываем иконку успеха
        setTimeout(() => {
          setShareSuccess(false);
        }, 2000);
      } else {
        impactOccurred('heavy');
        alert('Не удалось поделиться событием. Попробуйте ещё раз.');
      }
    } catch (error) {
      console.error('Share error:', error);
      impactOccurred('heavy');
      alert('Произошла ошибка при попытке поделиться событием.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    setIsCopyingLink(true);
    setCopyLinkSuccess(false);
    
    try {
      // Используем Telegram Web App ссылку если бот настроен, иначе обычную веб-ссылку
      const linkUrl = generateTelegramWebAppUrl(updatedEvent.id);
      const success = await copyToClipboard(linkUrl);
      
      if (success) {
        setCopyLinkSuccess(true);
        impactOccurred('light');
        
        // Показываем информативное сообщение о типе ссылки
        const linkType = hasTelegramBot ? 'Telegram-ссылка' : 'Веб-ссылка';
        console.log(`✅ ${linkType} скопирована:`, linkUrl);
        
        // Временно показываем иконку успеха
        setTimeout(() => {
          setCopyLinkSuccess(false);
        }, 2000);
      } else {
        impactOccurred('heavy');
        alert('Не удалось скопировать ссылку. Попробуйте ещё раз.');
      }
    } catch (error) {
      console.error('Copy link error:', error);
      impactOccurred('heavy');
      alert('Произошла ошибка при копировании ссылки.');
    } finally {
      setIsCopyingLink(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header с изображением - теперь sticky */}
        <div 
          className={`relative overflow-hidden transition-all duration-300 sticky top-0 z-10 ${
            isScrolled ? 'h-24' : 'h-64'
          }`}
        >
          {updatedEvent.image_url ? (
            <img 
              src={updatedEvent.image_url} 
              alt={updatedEvent.title}
              className={`w-full h-full object-cover transition-all duration-300 ${
                isScrolled ? 'object-top' : 'object-center'
              }`}
            />
          ) : (
            <div 
              className="w-full h-full"
              style={{ background: getEventImage(updatedEvent.image_url) }}
            />
          )}
          
          {/* Статус мероприятия и кнопки управления */}
          <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
            {/* Статус мероприятия */}
            <div className="flex flex-col gap-1 items-end">
              <span 
                className={`px-2 py-1 rounded-full text-xs font-medium border shadow-sm ${eventStatus.className}`}
                title={`${eventStatus.description} | Дата: ${event.date} | Сегодня: ${new Date().toISOString().split('T')[0]}`}
              >
                {eventStatus.label}
              </span>
              
              {updatedEvent.is_private && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200 shadow-sm flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Частное
                </span>
              )}
            </div>

            {/* Кнопки управления */}
            <div className="flex gap-2">
              {/* Кнопки для создателя */}
              {isCreator && (
                <>
                  <button
                    onClick={() => onEdit && onEdit(event)}
                    className="bg-black/50 text-white p-2 rounded-full hover:bg-orange-600 transition-colors"
                    title="Редактировать мероприятие"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => {
                      if (window.confirm('Вы уверены, что хотите удалить это мероприятие? Это действие нельзя отменить.')) {
                        onDelete && onDelete(event.id);
                      }
                    }}
                    className="bg-black/50 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    title="Удалить мероприятие"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
              
              {/* Кнопка закрытия */}
              <button
                onClick={onClose}
                className="bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                title="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Заголовок при скролле */}
          {isScrolled && (
            <div className="absolute bottom-2 left-4 right-32">
              <h1 className="text-white font-bold text-lg truncate drop-shadow-lg">
                {updatedEvent.title}
              </h1>
            </div>
          )}
        </div>

        {/* Контент */}
        <div 
          className="flex-1 overflow-y-auto"
          onScroll={(e) => {
            const scrollTop = e.currentTarget.scrollTop;
            setIsScrolled(scrollTop > 50);
          }}
        >
          <div className="p-6">
            {/* Заголовок */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl font-bold text-gray-900 flex-1">
                  {updatedEvent.title}
                </h1>
                {eventStatus.status === 'active' && (
                  <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
              
              {/* Основная информация */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Дата и время */}
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{formatEventPeriod(updatedEvent)}</div>
                    {updatedEvent.event_time && (
                      <div className="text-sm text-gray-500">
                        начало в {formatTime(updatedEvent.event_time)}
                        {updatedEvent.end_time && (
                          <div>окончание в {formatTime(updatedEvent.end_time)}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Место */}
                {updatedEvent.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-3 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Место проведения</div>
                      {updatedEvent.map_url ? (
                        <a
                          href={updatedEvent.map_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => {
                            reachGoal('event_location_map_clicked', {
                              event_id: updatedEvent.id,
                              event_title: updatedEvent.title.substring(0, 30),
                              location: updatedEvent.location?.substring(0, 50)
                            });
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors text-sm"
                          title="Открыть на карте"
                        >
                          {updatedEvent.location}
                        </a>
                      ) : (
                        <div className="text-sm">{updatedEvent.location}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Участники */}
                <EventParticipants
                  eventId={updatedEvent.id}
                  currentParticipants={updatedEvent.current_participants}
                  maxParticipants={updatedEvent.max_participants}
                  organizerTelegramId={updatedEvent.created_by}
                />

                {/* Организатор */}
                <div className="flex items-center text-gray-600">
                  <User className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Организатор</div>
                    <div className="text-sm">
                      {loadingOrganizer ? (
                        'Загрузка...'
                      ) : organizerInfo ? (
                        `${organizerInfo.first_name}${organizerInfo.last_name ? ` ${organizerInfo.last_name}` : ''}${organizerInfo.username ? ` (@${organizerInfo.username})` : ''}`
                      ) : (
                        `ID: ${event.created_by}`
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Описание */}
            {updatedEvent.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Описание
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {updatedEvent.description}
                </p>
              </div>
            )}

            {/* Дополнительная информация */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Дополнительная информация
              </h2>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Создано:</span>
                  <span className="font-medium">
                    {new Date(event.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Обновлено:</span>
                  <span className="font-medium">
                    {new Date(event.updated_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>

              </div>
            </div>

            {/* Кнопки откликов */}
            <EventResponseButtons
              event={updatedEvent}
              currentUserId={currentUserId}
              userFirstName={userFirstName}
              userLastName={userLastName}
              userUsername={userUsername}
              onResponseChange={handleResponseChange}
              className="mb-6"
            />

            {/* Кнопки действий */}
            <div className="space-y-3">
              {/* Дополнительные действия */}
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={handleCopyLink}
                  disabled={isCopyingLink}
                  className="flex items-center justify-center py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {copyLinkSuccess ? (
                    <>
                      <Check className="w-4 h-4 mr-1 text-green-600" />
                      Скопировано
                    </>
                  ) : isCopyingLink ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-1"></div>
                      Копирую...
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Скопировать
                    </>
                  )}
                </button>
                <button 
                  onClick={handleShare}
                  disabled={isSharing}
                  className="flex items-center justify-center py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm disabled:opacity-50"
                >
                  {shareSuccess ? (
                    <>
                      <Check className="w-4 h-4 mr-1 text-green-600" />
                      Скопировано
                    </>
                  ) : isSharing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-1"></div>
                      Поделиться
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 mr-1" />
                      Поделиться
                    </>
                  )}
                </button>
                <button className="flex items-center justify-center py-2 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm">
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Вопрос
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 