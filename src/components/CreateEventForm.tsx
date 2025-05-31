import React, { useState } from 'react';
import { useTelegram } from './TelegramProvider';
import { EventService } from '@/services/eventService';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';
import { ImageUpload } from './ImageUpload';
import type { CreateEventData } from '@/types/database';
import { Lock, Globe } from 'lucide-react';

interface CreateEventFormProps {
  onSuccess?: (eventId: string) => void;
  onCancel?: () => void;
  onFormChange?: () => void;
  className?: string;
}

export const CreateEventForm: React.FC<CreateEventFormProps> = ({
  onSuccess,
  onCancel,
  onFormChange,
  className = ''
}) => {
  const { user: telegramUser, impactOccurred } = useTelegram();
  const { reachGoal } = useYandexMetrika();
  
  // Отладочная информация
  console.log('📝 CreateEventForm render:', {
    telegramUser,
    userId: telegramUser?.id
  });
  
  // Состояния формы
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    image_url: '',
    date: '',
    end_date: '',
    end_time: '',
    location: '',
    map_url: '',
    max_participants: undefined,
    is_private: false,
    invited_users: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [isMultiDay, setIsMultiDay] = useState(false);

  // Обработчик изменения полей формы
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? 
        (value === '' ? undefined : Number(value)) : 
        type === 'checkbox' ? (e.target as HTMLInputElement).checked :
        value
    }));

    // Уведомляем родительский компонент об изменениях
    onFormChange?.();

    // Очищаем ошибки при изменении полей
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // Обработчик переключения приватности
  const handlePrivacyToggle = (isPrivate: boolean) => {
    setFormData(prev => ({
      ...prev,
      is_private: isPrivate
    }));
    onFormChange?.();
  };

  // Форматирование даты для input[type="datetime-local"]
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Получение минимальной даты (текущее время + 1 час)
  const getMinDateTime = (): string => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return formatDateForInput(now);
  };

  // Валидация формы
  const validateForm = (): boolean => {
    const validation = EventService.validateEventData(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return false;
    }

    // Убираем обязательную валидацию приглашенных пользователей
    // Теперь их можно добавить после создания мероприятия

    return true;
  };

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    reachGoal('create_event_form_submit_attempt');
    
    if (!telegramUser) {
      setErrors(['Пользователь не авторизован']);
      reachGoal('create_event_form_submit_failed', { error: 'not_authorized' });
      return;
    }

    if (!validateForm()) {
      impactOccurred('light');
      reachGoal('create_event_form_validation_failed', { 
        errors_count: errors.length 
      });
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      console.log('🚀 Creating event with data:', formData);
      
      // Конвертируем дату в ISO формат
      const eventDataWithISODate = {
        ...formData,
        date: new Date(formData.date).toISOString()
      };
      
      const response = await EventService.create(eventDataWithISODate, telegramUser.id);
      
      if (response.error || !response.data) {
        throw new Error(response.error?.message || 'Не удалось создать мероприятие');
      }

      console.log('✅ Event created successfully:', response.data.id);
      
      reachGoal('create_event_form_submit_success', {
        event_id: response.data.id,
        has_image: !!formData.image_url,
        has_location: !!formData.location,
        has_map_url: !!formData.map_url,
        has_max_participants: !!formData.max_participants,
        is_private: !!formData.is_private,
        invited_users_count: formData.invited_users?.length || 0
      });
      
      setSuccess(true);
      impactOccurred('medium');
      
      // Вызываем callback успеха
      if (onSuccess) {
        onSuccess(response.data.id);
      }

      // Сброс формы
      setFormData({
        title: '',
        description: '',
        image_url: '',
        date: '',
        end_date: '',
        end_time: '',
        location: '',
        map_url: '',
        max_participants: undefined,
        is_private: false,
        invited_users: []
      });

    } catch (error) {
      console.error('❌ Error creating event:', error);
      
      reachGoal('create_event_form_submit_error', {
        error: error instanceof Error ? error.message : 'unknown_error'
      });
      
      setErrors([error instanceof Error ? error.message : 'Неизвестная ошибка']);
      impactOccurred('heavy');
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик отмены
  const handleCancel = () => {
    reachGoal('create_event_form_cancelled');
    
    setFormData({
      title: '',
      description: '',
      image_url: '',
      date: '',
      end_date: '',
      end_time: '',
      location: '',
      map_url: '',
      max_participants: undefined,
      is_private: false,
      invited_users: []
    });
    setErrors([]);
    setSuccess(false);
    
    if (onCancel) {
      onCancel();
    }
  };

  if (success) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-green-600 mb-2">
            Мероприятие создано!
          </h2>
          <p className="text-gray-600 mb-6">
            Ваше {formData.is_private ? 'частное ' : ''}мероприятие "{formData.title}" успешно создано и опубликовано.
            {formData.is_private && formData.invited_users && formData.invited_users.length > 0 && (
              <span className="block mt-2 text-sm">
                Приглашения отправлены {formData.invited_users.length} пользователям.
              </span>
            )}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => {
                reachGoal('create_event_success_create_another');
                setSuccess(false);
              }}
              className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Создать еще одно мероприятие
            </button>
            <button
              onClick={() => {
                reachGoal('create_event_success_close');
                handleCancel();
              }}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Заголовок отображается только если форма не используется на отдельной странице */}
      {!className.includes('border-0') && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            🎊 Создать мероприятие
          </h2>
          <p className="text-gray-600 text-sm">
            Заполните информацию о вашем мероприятии
          </p>
        </div>
      )}

      {/* Отображение ошибок */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <span className="text-red-500 text-lg mr-2">⚠️</span>
            <h3 className="font-medium text-red-800">Исправьте ошибки:</h3>
          </div>
          <ul className="text-red-700 text-sm space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="flex items-start">
                <span className="text-red-500 mr-2">•</span>
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Тип мероприятия */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Тип мероприятия
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handlePrivacyToggle(false)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                !formData.is_private
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <Globe className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Публичное</div>
              <div className="text-xs mt-1">Видно всем пользователям</div>
            </button>
            
            <button
              type="button"
              onClick={() => handlePrivacyToggle(true)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                formData.is_private
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <Lock className="w-6 h-6 mx-auto mb-2" />
              <div className="font-medium">Частное</div>
              <div className="text-xs mt-1">Только для приглашенных</div>
            </button>
          </div>
          
          {/* Пояснение для частных мероприятий */}
          {formData.is_private && (
            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-700">
                💡 <strong>Частное мероприятие:</strong> После создания вы сможете пригласить пользователей на странице мероприятия.
              </p>
            </div>
          )}
        </div>

        {/* Приглашенные пользователи теперь добавляются после создания мероприятия */}

        {/* Название мероприятия */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Название мероприятия *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            maxLength={255}
            placeholder="Например: Новогодняя вечеринка 2025"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Минимум 3 символа, максимум 255
          </p>
        </div>

        {/* Описание */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Описание мероприятия
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            maxLength={2000}
            placeholder="Расскажите подробнее о вашем мероприятии..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            Максимум 2000 символов ({formData.description?.length || 0}/2000)
          </p>
        </div>

        {/* Изображение */}
        <div>
          {/* Временная замена для тестирования */}
          <label htmlFor="image_url_temp" className="block text-sm font-medium text-gray-700 mb-2">
            Изображение мероприятия (временно - обычное поле)
          </label>
          <input
            type="url"
            id="image_url_temp"
            name="image_url"
            value={formData.image_url}
            onChange={handleInputChange}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Временно: вставьте ссылку на изображение. Загрузка файлов в разработке.
          </p>
          
          {/* Попытка отобразить ImageUpload */}
          {telegramUser?.id && (
            <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <p className="text-sm text-blue-700 mb-2">Тест компонента загрузки:</p>
              <ImageUpload
                currentImageUrl={formData.image_url}
                onImageUploaded={(url: string) => {
                  setFormData(prev => ({
                    ...prev,
                    image_url: url
                  }));
                  onFormChange?.();
                }}
                onImageRemoved={() => {
                  setFormData(prev => ({
                    ...prev,
                    image_url: ''
                  }));
                  onFormChange?.();
                }}
                userId={telegramUser.id}
              />
            </div>
          )}
        </div>

        {/* Дата и время */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Дата и время начала *
          </label>
          <input
            type="datetime-local"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            min={getMinDateTime()}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Выберите дату и время начала мероприятия
          </p>
        </div>

        {/* Переключатель многодневного мероприятия */}
        <div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isMultiDay}
              onChange={(e) => {
                setIsMultiDay(e.target.checked);
                if (!e.target.checked) {
                  setFormData(prev => ({
                    ...prev,
                    end_date: '',
                    end_time: ''
                  }));
                }
                onFormChange?.();
              }}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Многодневное мероприятие или с определенным временем окончания
            </span>
          </label>
        </div>

        {/* Поля времени окончания (показываются только если включен переключатель) */}
        {isMultiDay && (
          <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800">Время окончания</h4>
            
            {/* Дата окончания */}
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                Дата окончания
              </label>
              <input
                type="date"
                id="end_date"
                name="end_date"
                value={formData.end_date || ''}
                onChange={handleInputChange}
                min={formData.date ? formData.date.split('T')[0] : ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Оставьте пустым, если мероприятие заканчивается в тот же день
              </p>
            </div>

            {/* Время окончания */}
            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-2">
                Время окончания
              </label>
              <input
                type="time"
                id="end_time"
                name="end_time"
                value={formData.end_time || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Укажите время окончания мероприятия
              </p>
            </div>
          </div>
        )}

        {/* Место проведения */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Место проведения
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            maxLength={500}
            placeholder="Например: ул. Примерная, 123, Москва"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Адрес или название места проведения
          </p>
        </div>

        {/* Ссылка на карту */}
        <div>
          <label htmlFor="map_url" className="block text-sm font-medium text-gray-700 mb-2">
            Ссылка на карту
          </label>
          <input
            type="url"
            id="map_url"
            name="map_url"
            value={formData.map_url}
            onChange={handleInputChange}
            placeholder="https://yandex.ru/maps/-/... или https://maps.google.com/..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Ссылка на Яндекс.Карты, Google Maps или другой картографический сервис
          </p>
        </div>

        {/* Максимальное количество участников */}
        <div>
          <label htmlFor="max_participants" className="block text-sm font-medium text-gray-700 mb-2">
            Максимальное количество участников
          </label>
          <input
            type="number"
            id="max_participants"
            name="max_participants"
            value={formData.max_participants || ''}
            onChange={handleInputChange}
            min={1}
            max={10000}
            placeholder="Оставьте пустым для неограниченного количества"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Максимальное количество участников (необязательно)
          </p>
        </div>

        {/* Кнопки */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Создание...
              </span>
            ) : (
              `Создать ${formData.is_private ? 'частное ' : ''}мероприятие`
            )}
          </button>
          
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}; 