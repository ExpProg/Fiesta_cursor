import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { EditEventForm } from './EditEventForm';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';
import type { DatabaseEvent } from '@/types/database';

interface EditEventPageProps {
  event: DatabaseEvent;
  onBack: () => void;
  onSuccess: (eventId: string) => void;
}

export const EditEventPage: React.FC<EditEventPageProps> = ({
  event,
  onBack,
  onSuccess
}) => {
  const { reachGoal } = useYandexMetrika();
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);

  useEffect(() => {
    // Сохраняем оригинальные данные для сравнения
    setOriginalData({
      title: event.title,
      description: event.description,
      image_url: event.image_url,
      date: event.date,
      event_time: event.event_time,
      location: event.location,
      map_url: event.map_url,
      max_participants: event.max_participants
    });
    
    // Отслеживаем открытие страницы редактирования
    reachGoal('edit_event_page_opened', { 
      event_id: event.id,
      event_title: event.title.substring(0, 30)
    });
  }, [event, reachGoal]);

  useEffect(() => {
    // Прокручиваем наверх при открытии страницы
    window.scrollTo(0, 0);
  }, []);

  const handleBack = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу без сохранения?'
      );
      if (!confirmed) {
        reachGoal('edit_event_cancel_declined');
        return;
      }
      reachGoal('edit_event_cancelled_with_changes', { event_id: event.id });
    } else {
      reachGoal('edit_event_back_clicked', { event_id: event.id });
    }
    onBack();
  };

  const handleFormChange = (formData: any) => {
    if (!originalData) return;
    
    // Проверяем, есть ли изменения
    const hasDataChanges = 
      formData.title !== originalData.title ||
      formData.description !== originalData.description ||
      formData.image_url !== originalData.image_url ||
      formData.date !== originalData.date ||
      formData.event_time !== originalData.event_time ||
      formData.location !== originalData.location ||
      formData.map_url !== originalData.map_url ||
      formData.max_participants !== originalData.max_participants;
    
    if (hasDataChanges && !hasChanges) {
      // Первое изменение в форме
      reachGoal('edit_event_form_first_change', { event_id: event.id });
    }
    
    setHasChanges(hasDataChanges);
  };

  const handleSuccess = (eventId: string) => {
    setHasChanges(false);
    reachGoal('edit_event_form_submitted_success', { 
      event_id: eventId,
      original_event_id: event.id
    });
    onSuccess(eventId);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={handleBack}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Назад к мероприятию"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Редактирование мероприятия
              </h1>
              <p className="text-sm text-gray-600">
                {event.title}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg">
          <EditEventForm
            event={event}
            onSuccess={handleSuccess}
            onCancel={handleBack}
            onFormChange={handleFormChange}
            className="border-0 shadow-none"
          />
        </div>
      </div>
    </div>
  );
}; 