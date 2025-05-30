import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { CreateEventForm } from './CreateEventForm';

interface CreateEventPageProps {
  onBack: () => void;
  onSuccess: (eventId: string) => void;
}

export const CreateEventPage: React.FC<CreateEventPageProps> = ({
  onBack,
  onSuccess
}) => {
  const [hasChanges, setHasChanges] = useState(false);

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
        return;
      }
    }
    onBack();
  };

  const handleFormChange = () => {
    setHasChanges(true);
  };

  const handleSuccess = (eventId: string) => {
    setHasChanges(false);
    onSuccess(eventId);
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу без сохранения?'
      );
      if (!confirmed) {
        return;
      }
    }
    setHasChanges(false);
    onBack();
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
              title="Назад к списку мероприятий"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Создание мероприятия
              </h1>
              <p className="text-sm text-gray-600">
                Заполните информацию о вашем мероприятии
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-lg">
          <CreateEventForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
            onFormChange={handleFormChange}
            className="border-0 shadow-none"
          />
        </div>
      </div>
    </div>
  );
}; 