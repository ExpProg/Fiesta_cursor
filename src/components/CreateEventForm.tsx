import React, { useState } from 'react';
import { useTelegram } from './TelegramProvider';
import { EventService } from '@/services/eventService';
import type { CreateEventData } from '@/types/database';

interface CreateEventFormProps {
  onSuccess?: (eventId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export const CreateEventForm: React.FC<CreateEventFormProps> = ({
  onSuccess,
  onCancel,
  className = ''
}) => {
  const { user: telegramUser, impactOccurred } = useTelegram();
  
  // Состояния формы
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    image_url: '',
    event_date: '',
    location: '',
    max_participants: undefined,
    price: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  // Обработчик изменения полей формы
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? 
        (value === '' ? undefined : Number(value)) : 
        value
    }));

    // Очищаем ошибки при изменении полей
    if (errors.length > 0) {
      setErrors([]);
    }
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

    return true;
  };

  // Обработчик отправки формы
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!telegramUser) {
      setErrors(['Пользователь не авторизован']);
      return;
    }

    if (!validateForm()) {
      impactOccurred('light');
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      console.log('🚀 Creating event with data:', formData);
      
      // Конвертируем дату в ISO формат
      const eventDataWithISODate = {
        ...formData,
        event_date: new Date(formData.event_date).toISOString()
      };
      
      const response = await EventService.create(eventDataWithISODate, telegramUser.id);
      
      if (response.error || !response.data) {
        throw new Error(response.error?.message || 'Не удалось создать мероприятие');
      }

      console.log('✅ Event created successfully:', response.data.id);
      
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
        event_date: '',
        location: '',
        max_participants: undefined,
        price: 0
      });

    } catch (error) {
      console.error('❌ Error creating event:', error);
      setErrors([error instanceof Error ? error.message : 'Неизвестная ошибка']);
      impactOccurred('heavy');
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик отмены
  const handleCancel = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      event_date: '',
      location: '',
      max_participants: undefined,
      price: 0
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
            Ваше мероприятие "{formData.title}" успешно создано и опубликовано.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => setSuccess(false)}
              className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              Создать еще одно мероприятие
            </button>
            <button
              onClick={handleCancel}
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
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          🎊 Создать мероприятие
        </h2>
        <p className="text-gray-600 text-sm">
          Заполните информацию о вашем мероприятии
        </p>
      </div>

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
          <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
            Ссылка на изображение
          </label>
          <input
            type="url"
            id="image_url"
            name="image_url"
            value={formData.image_url}
            onChange={handleInputChange}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Вставьте ссылку на изображение мероприятия
          </p>
          
          {/* Превью изображения */}
          {formData.image_url && (
            <div className="mt-3">
              <img
                src={formData.image_url}
                alt="Превью изображения"
                className="w-full h-32 object-cover rounded-lg border"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Дата и время */}
        <div>
          <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-2">
            Дата и время мероприятия *
          </label>
          <input
            type="datetime-local"
            id="event_date"
            name="event_date"
            value={formData.event_date}
            onChange={handleInputChange}
            min={getMinDateTime()}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Выберите дату и время проведения мероприятия
          </p>
        </div>

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

        {/* Цена */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Цена участия (₽)
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            min={0}
            max={100000}
            step={0.01}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Укажите 0 для бесплатного мероприятия
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
              '🎊 Создать мероприятие'
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