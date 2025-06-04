import React, { useState, useCallback, useMemo } from 'react';
import { EventService } from '@/services/eventService';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';
import { useTelegram } from './TelegramProvider';
import { ImageUpload } from './ImageUpload';
import type { DatabaseEvent, CreateEventData } from '@/types/database';
import { Calendar, MapPin, FileText, Users, X, Save, Loader2 } from 'lucide-react';

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
  const [saveProgress, setSaveProgress] = useState(0);

  // Мемоизируем оригинальные данные для сравнения
  const originalData = useMemo(() => ({
    title: event.title,
    description: event.description || '',
    image_url: event.image_url || '',
    date: new Date(event.date).toISOString().slice(0, 16),
    location: event.location || '',
    map_url: event.map_url || '',
    max_participants: event.max_participants || undefined,
    host_id: event.host_id || undefined
  }), [event]);

  // Определяем, какие поля изменились
  const changedFields = useMemo(() => {
    const changes: Partial<CreateEventData> = {};
    
    if (formData.title !== originalData.title) changes.title = formData.title;
    if (formData.description !== originalData.description) changes.description = formData.description;
    if (formData.image_url !== originalData.image_url) changes.image_url = formData.image_url;
    if (formData.date !== originalData.date) changes.date = formData.date;
    if (formData.location !== originalData.location) changes.location = formData.location;
    if (formData.map_url !== originalData.map_url) changes.map_url = formData.map_url;
    if (formData.max_participants !== originalData.max_participants) changes.max_participants = formData.max_participants;
    if (formData.host_id !== originalData.host_id) changes.host_id = formData.host_id;
    
    return changes;
  }, [formData, originalData]);

  const hasChanges = Object.keys(changedFields).length > 0;

  // Мемоизированный обработчик изменений
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    setFormData(newFormData);

    // Уведомляем родительский компонент об изменениях
    onFormChange?.(newFormData);
  }, [formData, onFormChange]);

  // Симуляция прогресса сохранения
  const simulateSaveProgress = useCallback(() => {
    setSaveProgress(0);
    
    const interval = setInterval(() => {
      setSaveProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 100);
    
    return interval;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasChanges) {
      setError('Нет изменений для сохранения');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const progressInterval = simulateSaveProgress();
    
    reachGoal('edit_event_form_submit_attempt', {
      event_id: event.id,
      event_title: event.title.substring(0, 30),
      changes_count: Object.keys(changedFields).length,
      changed_fields: Object.keys(changedFields)
    });

    try {
      console.log('📝 Updating event with changes only:', event.id, changedFields);

      // Валидация изменений
      const validation = EventService.validateEventData(formData);
      if (!validation.isValid) {
        setError(validation.errors.join('\n'));
        
        reachGoal('edit_event_form_validation_failed', {
          event_id: event.id,
          errors_count: validation.errors.length
        });
        
        return;
      }

      setSaveProgress(30);

      // Подготавливаем обновления только для измененных полей
      const updates: any = {};
      
      if (changedFields.title !== undefined) updates.title = changedFields.title;
      if (changedFields.description !== undefined) updates.description = changedFields.description || null;
      if (changedFields.image_url !== undefined) updates.image_url = changedFields.image_url || null;
      if (changedFields.location !== undefined) updates.location = changedFields.location || null;
      if (changedFields.map_url !== undefined) updates.map_url = changedFields.map_url || null;
      if (changedFields.max_participants !== undefined) updates.max_participants = changedFields.max_participants || null;
      if (changedFields.host_id !== undefined) updates.host_id = changedFields.host_id || null;
      
      // Обрабатываем дату и время только если изменились
      if (changedFields.date !== undefined) {
        const eventDate = new Date(changedFields.date);
        const hours = eventDate.getHours().toString().padStart(2, '0');
        const minutes = eventDate.getMinutes().toString().padStart(2, '0');
        const seconds = eventDate.getSeconds().toString().padStart(2, '0');
        const eventTime = `${hours}:${minutes}:${seconds}`;
        
        updates.date = changedFields.date;
        updates.event_time = eventTime;
      }
      
      // Добавляем updated_at
      updates.updated_at = new Date().toISOString();

      setSaveProgress(60);

      // Обновляем мероприятие только с измененными полями
      const result = await EventService.update(event.id, updates);

      clearInterval(progressInterval);
      setSaveProgress(100);

      if (result.error) {
        setError(result.error.message);
        
        reachGoal('edit_event_form_submit_error', {
          event_id: event.id,
          error: result.error.message,
          changes_count: Object.keys(changedFields).length
        });
        
        return;
      }

      console.log('✅ Event updated successfully:', result.data?.id);
      
      reachGoal('edit_event_form_submit_success', {
        event_id: event.id,
        changes_count: Object.keys(changedFields).length,
        changed_fields: Object.keys(changedFields),
        changes_made: {
          title_changed: changedFields.title !== undefined,
          description_changed: changedFields.description !== undefined,
          image_changed: changedFields.image_url !== undefined,
          location_changed: changedFields.location !== undefined,
          map_url_changed: changedFields.map_url !== undefined,
          max_participants_changed: changedFields.max_participants !== undefined
        }
      });
      
      // Небольшая задержка для показа 100% прогресса
      setTimeout(() => {
        onSuccess(event.id);
      }, 300);
      
    } catch (err) {
      clearInterval(progressInterval);
      setSaveProgress(0);
      
      console.error('❌ Error updating event:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      
      reachGoal('edit_event_form_submit_error', {
        event_id: event.id,
        error: err instanceof Error ? err.message : 'unknown_error',
        changes_count: Object.keys(changedFields).length
      });
    } finally {
      setTimeout(() => {
        setLoading(false);
        setSaveProgress(0);
      }, 300);
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

        {/* Индикатор изменений */}
        {hasChanges && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-blue-800 text-sm">
              📝 Изменения: {Object.keys(changedFields).join(', ')}
            </div>
          </div>
        )}

        {/* Прогресс сохранения */}
        {loading && saveProgress > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Сохранение изменений</span>
              <span className="text-sm text-gray-500">{saveProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${saveProgress}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {saveProgress < 30 ? 'Подготовка данных...' :
               saveProgress < 60 ? 'Валидация изменений...' :
               saveProgress < 90 ? 'Отправка на сервер...' :
               'Завершение...'}
            </div>
          </div>
        )}

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
                event_id: event.id,
                had_changes: hasChanges,
                changes_count: Object.keys(changedFields).length
              });
              onCancel();
            }}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          
          <button
            type="submit"
            disabled={loading || !hasChanges}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              !hasChanges 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : loading 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Сохранение...</span>
              </>
            ) : hasChanges ? (
              <>
                <Save className="w-4 h-4" />
                <span>Сохранить изменения</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Нет изменений</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}; 