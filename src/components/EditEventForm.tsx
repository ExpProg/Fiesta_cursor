import React, { useState } from 'react';
import { EventService } from '@/services/eventService';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';
import { useTelegram } from './TelegramProvider';
import { ImageUpload } from './ImageUpload';
import type { DatabaseEvent, CreateEventData } from '@/types/database';
import { Calendar, MapPin, FileText, Users, X } from 'lucide-react';

interface EditEventFormProps {
  event: DatabaseEvent;
  onSuccess: (eventId: string) => void;
  onCancel: () => void;
  onFormChange?: (formData: any) => void;
  className?: string;
}

export const EditEventForm: React.FC<EditEventFormProps> = ({ 
  event, 
  onSuccess, 
  onCancel,
  onFormChange,
  className = ''
}) => {
  const { reachGoal } = useYandexMetrika();
  const { user: telegramUser } = useTelegram();
  
  // Инициализируем форму данными существующего мероприятия
  const [formData, setFormData] = useState<CreateEventData>({
    title: event.title,
    description: event.description || '',
    image_url: event.image_url || '',
    date: new Date(event.date).toISOString().slice(0, 16), // Корректное преобразование в формат datetime-local
    location: event.location || '',
    map_url: event.map_url || '',
    max_participants: event.max_participants || undefined,
    host_id: event.host_id || undefined
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);

    // Уведомляем родительский компонент об изменениях
    onFormChange?.(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    reachGoal('edit_event_form_submit_attempt', {
      event_id: event.id,
      event_title: event.title.substring(0, 30)
    });

    try {
      console.log('📝 Updating event:', event.id, formData);

      // Валидация данных
      const validation = EventService.validateEventData(formData);
      if (!validation.isValid) {
        setError(validation.errors.join('\n'));
        
        reachGoal('edit_event_form_validation_failed', {
          event_id: event.id,
          errors_count: validation.errors.length
        });
        
        return;
      }

      // Обновляем мероприятие
      
      // Извлекаем время из даты для поля event_time (аналогично create)
      const eventDate = new Date(formData.date);
      const hours = eventDate.getHours().toString().padStart(2, '0');
      const minutes = eventDate.getMinutes().toString().padStart(2, '0');
      const seconds = eventDate.getSeconds().toString().padStart(2, '0');
      const eventTime = `${hours}:${minutes}:${seconds}`; // формат HH:MM:SS для TIME поля

      const result = await EventService.update(event.id, {
        title: formData.title,
        description: formData.description || null,
        image_url: formData.image_url || null,
        date: formData.date,
        event_time: eventTime, // добавляем обновленное время
        location: formData.location || null,
        map_url: formData.map_url || null,
        max_participants: formData.max_participants || null,
        host_id: formData.host_id || null,
        updated_at: new Date().toISOString()
      });

      if (result.error) {
        setError(result.error.message);
        
        reachGoal('edit_event_form_submit_error', {
          event_id: event.id,
          error: result.error.message
        });
        
        return;
      }

      console.log('✅ Event updated successfully:', result.data?.id);
      
      reachGoal('edit_event_form_submit_success', {
        event_id: event.id,
        changes_made: {
          title_changed: formData.title !== event.title,
          description_changed: formData.description !== (event.description || ''),
          image_changed: formData.image_url !== (event.image_url || ''),
          location_changed: formData.location !== (event.location || ''),
          map_url_changed: formData.map_url !== (event.map_url || ''),
          max_participants_changed: formData.max_participants !== event.max_participants
        }
      });
      
      onSuccess(event.id);
    } catch (err) {
      console.error('❌ Error updating event:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      
      reachGoal('edit_event_form_submit_error', {
        event_id: event.id,
        error: err instanceof Error ? err.message : 'unknown_error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 ${className}`}>
      {/* Заголовок отображается только если форма не используется на отдельной странице */}
      {!className.includes('border-0') && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            ✏️ Редактировать мероприятие
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Форма */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Название мероприятия */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 mr-2" />
            Название мероприятия *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Например: Вечеринка на крыше"
            required
          />
        </div>

        {/* Описание */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 mr-2" />
            Описание
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Расскажите о мероприятии..."
          />
        </div>

        {/* Изображение */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 mr-2" />
            Изображение
          </label>
          <ImageUpload
            currentImageUrl={formData.image_url}
            onImageUploaded={(url: string) => {
              const newFormData = { ...formData, image_url: url };
              setFormData(newFormData);
              onFormChange?.(newFormData);
            }}
            onImageRemoved={() => {
              const newFormData = { ...formData, image_url: '' };
              setFormData(newFormData);
              onFormChange?.(newFormData);
            }}
            userId={telegramUser?.id || 0}
          />
        </div>

        {/* Дата и время */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 mr-2" />
            Дата и время *
          </label>
          <input
            type="datetime-local"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Место */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 mr-2" />
            Место проведения
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Например: ул. Пушкина, д. 1"
          />
        </div>

        {/* Ссылка на карту */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 mr-2" />
            Ссылка на карту
          </label>
          <input
            type="url"
            name="map_url"
            value={formData.map_url}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://yandex.ru/maps/-/... или https://maps.google.com/..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Ссылка на Яндекс.Карты, Google Maps или другой картографический сервис
          </p>
        </div>

        {/* Максимум участников */}
        <div>
          <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <Users className="w-4 h-4 mr-2" />
            Максимум участников
          </label>
          <input
            type="number"
            name="max_participants"
            value={formData.max_participants || ''}
            onChange={handleInputChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="10"
          />
          <p className="text-xs text-gray-500 mt-1">
            Оставьте пустым для неограниченного количества участников
          </p>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-600 text-sm whitespace-pre-line">{error}</div>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={() => {
              reachGoal('edit_event_form_cancelled', {
                event_id: event.id
              });
              onCancel();
            }}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? '⏳ Сохранение...' : '💾 Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
}; 