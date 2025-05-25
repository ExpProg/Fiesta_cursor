import React, { useState } from 'react';
import { EventService } from '@/services/eventService';
import type { DatabaseEvent, CreateEventData } from '@/types/database';
import { Calendar, MapPin, FileText, Image, Users, DollarSign, X } from 'lucide-react';

interface EditEventFormProps {
  event: DatabaseEvent;
  onSuccess: (eventId: string) => void;
  onCancel: () => void;
}

export const EditEventForm: React.FC<EditEventFormProps> = ({ 
  event, 
  onSuccess, 
  onCancel 
}) => {
  // Инициализируем форму данными существующего мероприятия
  const [formData, setFormData] = useState<CreateEventData>({
    title: event.title,
    description: event.description || '',
    image_url: event.image_url || '',
    date: new Date(event.date).toISOString().slice(0, 16), // Корректное преобразование в формат datetime-local
    location: event.location || '',
    max_participants: event.max_participants || undefined,
    max_guests: event.max_guests || undefined,
    price: event.price || undefined,
    price_per_person: event.price_per_person || undefined,
    host_id: event.host_id || undefined
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(event.image_url);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Обновление превью изображения
    if (name === 'image_url') {
      setImagePreview(value || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('📝 Updating event:', event.id, formData);

      // Валидация данных
      const validation = EventService.validateEventData(formData);
      if (!validation.isValid) {
        setError(validation.errors.join('\n'));
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
        max_participants: formData.max_participants || null,
        max_guests: formData.max_guests || null,
        price: formData.price || 0,
        price_per_person: formData.price_per_person || null,
        host_id: formData.host_id || null,
        updated_at: new Date().toISOString()
      });

      if (result.error) {
        setError(result.error.message);
        return;
      }

      console.log('✅ Event updated successfully:', result.data?.id);
      onSuccess(event.id);
    } catch (err) {
      console.error('❌ Error updating event:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Заголовок */}
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
            <Image className="w-4 h-4 mr-2" />
            Ссылка на изображение
          </label>
          <input
            type="url"
            name="image_url"
            value={formData.image_url}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/image.jpg"
          />
          {imagePreview && (
            <div className="mt-2">
              <img 
                src={imagePreview} 
                alt="Превью" 
                className="w-full h-32 object-cover rounded-lg"
                onError={() => setImagePreview(null)}
              />
            </div>
          )}
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

        {/* Участники */}
        <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 mr-2" />
              Максимум гостей
            </label>
            <input
              type="number"
              name="max_guests"
              value={formData.max_guests || ''}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="20"
            />
          </div>
        </div>

        {/* Цена */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 mr-2" />
              Общая цена (₽)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price || ''}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 mr-2" />
              Цена за человека (₽)
            </label>
            <input
              type="number"
              name="price_per_person"
              value={formData.price_per_person || ''}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="100"
            />
          </div>
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
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? '⏳ Сохранение...' : '💾 Сохранить изменения'}
          </button>
        </div>
      </form>
    </div>
  );
}; 