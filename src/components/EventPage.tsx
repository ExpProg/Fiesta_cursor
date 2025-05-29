import React, { useState, useEffect } from 'react';
import type { DatabaseEvent, ResponseStatus } from '@/types/database';
import { 
  Calendar, 
  MapPin, 
  User, 
  Share2,
  MessageCircle,
  Copy,
  Check,
  Edit,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { shareEvent, copyToClipboard, generateTelegramWebAppUrl } from '@/utils/sharing';
import { refreshEventData } from '@/utils/eventResponses';
import { getEventGradient } from '@/utils/gradients';
import { EventParticipants } from './EventParticipants';
import { EventResponseButtons } from './EventResponseButtons';
import { useTelegram } from './TelegramProvider';
import { supabase } from '@/hooks/useSupabase';

interface EventPageProps {
  event: DatabaseEvent;
  onBack: () => void;
  onEdit?: (event: DatabaseEvent) => void;
  onDelete?: (eventId: string) => void;
  currentUserId?: number; // telegram_id текущего пользователя
  userFirstName?: string;
  userLastName?: string | null;
  userUsername?: string | null;
}

export const EventPage: React.FC<EventPageProps> = ({ 
  event, 
  onBack, 
  onEdit,
  onDelete,
  currentUserId,
  userFirstName,
  userLastName,
  userUsername
}) => {
  const { impactOccurred } = useTelegram();
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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);
  
  useEffect(() => {
    // Прокручиваем наверх при открытии страницы
    window.scrollTo(0, 0);
  }, []);

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
      
      // Триггерим обновление списка участников
      setRefreshTrigger(prev => prev + 1);
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

  const getEventImage = (event: DatabaseEvent) => {
    if (event.image_url) return event.image_url;
    // Используем сохраненный градиент или генерируем детерминированный
    return getEventGradient(event);
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header с изображением */}
      <div className="relative h-48">
        {updatedEvent.image_url ? (
          <img 
            src={updatedEvent.image_url} 
            alt={updatedEvent.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div 
            className="w-full h-full"
            style={{ background: getEventImage(updatedEvent) }}
          />
        )}
        
        {/* Overlay для лучшей читаемости */}
        <div className="absolute inset-0 bg-black/30" />
        
        {/* Навигация */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          {/* Кнопка назад */}
          <button
            onClick={onBack}
            className="bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
            title="Назад к списку мероприятий"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Статус мероприятия */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
            updatedEvent.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {updatedEvent.status === 'active' ? 'Активно' : 'Завершено'}
          </span>
        </div>

        {/* Заголовок */}
        <div className="absolute bottom-6 left-4 right-4">
          <h1 className="text-white text-3xl font-bold drop-shadow-lg mb-2">
            {updatedEvent.title}
          </h1>
        </div>
      </div>

      {/* Контент */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Кнопки откликов - в самом верху для максимально быстрого доступа */}
          <EventResponseButtons
            event={updatedEvent}
            currentUserId={currentUserId}
            userFirstName={userFirstName}
            userLastName={userLastName}
            userUsername={userUsername}
            onResponseChange={handleResponseChange}
            className="mb-8"
          />

          {/* Основная информация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Дата и время */}
            <div className="flex items-center text-gray-600">
              <Calendar className="w-6 h-6 mr-4 flex-shrink-0 text-blue-600" />
              <div>
                <div className="font-medium text-lg">{formatDate(updatedEvent.date)}</div>
                {updatedEvent.event_time && (
                  <div className="text-gray-500">в {formatTime(updatedEvent.event_time)}</div>
                )}
              </div>
            </div>

            {/* Место */}
            {updatedEvent.location && (
              <div className="flex items-center text-gray-600">
                <MapPin className="w-6 h-6 mr-4 flex-shrink-0 text-red-600" />
                <div>
                  <div className="font-medium text-lg">Место проведения</div>
                  {updatedEvent.map_url ? (
                    <a
                      href={updatedEvent.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                      title="Открыть на карте"
                    >
                      {updatedEvent.location} 🗺️
                    </a>
                  ) : (
                    <div className="text-gray-500">{updatedEvent.location}</div>
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
              refreshTrigger={refreshTrigger}
            />

            {/* Организатор */}
            <div className="flex items-center text-gray-600">
              <User className="w-6 h-6 mr-4 flex-shrink-0 text-purple-600" />
              <div>
                <div className="font-medium text-lg">Организатор</div>
                <div className="text-gray-500">
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

          {/* Описание */}
          {updatedEvent.description && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Описание
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                {updatedEvent.description}
              </p>
            </div>
          )}

          {/* Дополнительные действия - только для организатора */}
          {isCreator && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Дополнительные действия
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button 
                  onClick={handleCopyLink}
                  disabled={isCopyingLink}
                  className="flex items-center justify-center py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  {copyLinkSuccess ? (
                    <>
                      <Check className="w-5 h-5 mr-2 text-green-600" />
                      Скопировано
                    </>
                  ) : isCopyingLink ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
                      Копирую...
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Скопировать ссылку
                    </>
                  )}
                </button>
                
                <button 
                  onClick={handleShare}
                  disabled={isSharing}
                  className="flex items-center justify-center py-3 px-4 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  {shareSuccess ? (
                    <>
                      <Check className="w-5 h-5 mr-2 text-green-600" />
                      Отправлено
                    </>
                  ) : isSharing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                      Отправляю...
                    </>
                  ) : (
                    <>
                      <Share2 className="w-5 h-5 mr-2" />
                      Поделиться
                    </>
                  )}
                </button>
                
                <button className="flex items-center justify-center py-3 px-4 bg-green-100 hover:bg-green-200 rounded-lg transition-colors">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Задать вопрос
                </button>
              </div>

              {/* Кнопки управления для создателя */}
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => onEdit && onEdit(event)}
                  className="flex items-center justify-center py-2 px-4 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors"
                  title="Редактировать мероприятие"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Редактировать
                </button>
                
                <button
                  onClick={() => {
                    if (window.confirm('Вы уверены, что хотите удалить это мероприятие? Это действие нельзя отменить.')) {
                      onDelete && onDelete(event.id);
                    }
                  }}
                  className="flex items-center justify-center py-2 px-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                  title="Удалить мероприятие"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить
                </button>
              </div>
            </div>
          )}

          {/* Дополнительная информация */}
          <div className="border-t mt-6 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Информация о мероприятии
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Создано:</span>
                <span className="font-medium">
                  {new Date(event.created_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Обновлено:</span>
                <span className="font-medium">
                  {new Date(event.updated_at).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 