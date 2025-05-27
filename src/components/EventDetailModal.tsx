import React, { useState, useEffect } from 'react';
import type { DatabaseEvent } from '@/types/database';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  User, 
  DollarSign, 
  X,
  Share2,
  Heart,
  MessageCircle,
  Copy,
  Check
} from 'lucide-react';
import { shareEvent, generateEventShareUrl, copyToClipboard, generateTelegramWebAppUrl } from '@/utils/sharing';
import { EventParticipants } from './EventParticipants';
import { EventResponseButtons } from './EventResponseButtons';
import { useTelegram } from './TelegramProvider';

interface EventDetailModalProps {
  event: DatabaseEvent;
  onClose: () => void;
  onBook?: (eventId: string) => void;
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
  onBook, 
  onEdit,
  onDelete,
  currentUserId,
  userFirstName,
  userLastName,
  userUsername
}) => {
  const { impactOccurred } = useTelegram();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  
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

  const isEventFull = event.max_participants && event.current_participants >= event.max_participants;
  const spotsLeft = event.max_participants ? event.max_participants - event.current_participants : null;
  const isCreator = currentUserId && event.created_by === currentUserId;

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
        eventId: event.id,
        title: event.title,
        description: event.description || undefined,
        imageUrl: event.image_url || undefined
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
            message = 'Ссылка отправлена в Telegram!';
            break;
          case 'native':
            message = 'Ссылка отправлена!';
            break;
          case 'clipboard':
            message = 'Ссылка скопирована в буфер обмена!';
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
      const linkUrl = generateTelegramWebAppUrl(event.id);
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
          {event.image_url ? (
            <img 
              src={event.image_url} 
              alt={event.title}
              className={`w-full h-full object-cover transition-all duration-300 ${
                isScrolled ? 'object-top' : 'object-center'
              }`}
            />
          ) : (
            <div 
              className="w-full h-full"
              style={{ background: getEventImage(event.image_url) }}
            />
          )}
          
          {/* Кнопка закрытия */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Статус мероприятия - скрывается при скролле */}
          {!isScrolled && (
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                event.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {event.status === 'active' ? 'Активно' : 'Завершено'}
              </span>
            </div>
          )}

          {/* Цена - скрывается при скролле */}
          {!isScrolled && (event.price > 0 || event.price_per_person) && (
            <div className="absolute bottom-4 right-4">
              <div className="bg-black/70 text-white px-3 py-2 rounded-lg">
                {event.price_per_person ? (
                  <div className="text-sm">
                    <div className="font-bold">{event.price_per_person}₽</div>
                    <div className="text-xs opacity-75">за человека</div>
                  </div>
                ) : (
                  <div className="font-bold">{event.price}₽</div>
                )}
              </div>
            </div>
          )}

          {/* Индикатор заполненности - скрывается при скролле */}
          {!isScrolled && isEventFull && (
            <div className="absolute bottom-4 left-4">
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Мест нет
              </span>
            </div>
          )}

          {/* Заголовок при скролле */}
          {isScrolled && (
            <div className="absolute bottom-2 left-4 right-16">
              <h1 className="text-white font-bold text-lg truncate drop-shadow-lg">
                {event.title}
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {event.title}
              </h1>
              
              {/* Основная информация */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Дата и время */}
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{formatDate(event.date)}</div>
                    {event.event_time && (
                      <div className="text-sm text-gray-500">в {formatTime(event.event_time)}</div>
                    )}
                  </div>
                </div>

                {/* Место */}
                {event.location && (
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-5 h-5 mr-3 flex-shrink-0" />
                    <div>
                      <div className="font-medium">Место проведения</div>
                      <div className="text-sm">{event.location}</div>
                    </div>
                  </div>
                )}

                {/* Участники */}
                <EventParticipants
                  eventId={event.id}
                  currentParticipants={event.current_participants}
                  maxParticipants={event.max_participants}
                  organizerTelegramId={event.created_by}
                />

                {/* Организатор */}
                <div className="flex items-center text-gray-600">
                  <User className="w-5 h-5 mr-3 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Организатор</div>
                    <div className="text-sm">ID: {event.created_by}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Описание */}
            {event.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Описание
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {event.description}
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
                {event.max_guests && event.max_guests !== event.max_participants && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Максимум гостей:</span>
                    <span className="font-medium">{event.max_guests}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Кнопки откликов */}
            <EventResponseButtons
              event={event}
              currentUserId={currentUserId}
              userFirstName={userFirstName}
              userLastName={userLastName}
              userUsername={userUsername}
              className="mb-6"
            />

            {/* Кнопки действий */}
            <div className="space-y-3">
              {/* Кнопка редактирования для создателя */}
              {isCreator && (
                <>
                  <button
                    onClick={() => onEdit && onEdit(event)}
                    className="w-full py-3 px-4 rounded-lg font-medium transition-colors bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    ✏️ Редактировать мероприятие
                  </button>
                  
                  <button
                    onClick={() => {
                      if (window.confirm('Вы уверены, что хотите удалить это мероприятие? Это действие нельзя отменить.')) {
                        onDelete && onDelete(event.id);
                      }
                    }}
                    className="w-full py-3 px-4 rounded-lg font-medium transition-colors bg-red-600 hover:bg-red-700 text-white"
                  >
                    🗑️ Удалить мероприятие
                  </button>
                </>
              )}

              {/* Основная кнопка записи (только для не-создателей) */}
              {!isCreator && (
                <button
                  onClick={() => onBook && onBook(event.id)}
                  disabled={isEventFull || event.status !== 'active'}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    isEventFull || event.status !== 'active'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isEventFull 
                    ? '🚫 Мест нет' 
                    : event.status !== 'active'
                    ? '⏸️ Мероприятие неактивно'
                    : '🎟️ Записаться на мероприятие'
                  }
                </button>
              )}

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