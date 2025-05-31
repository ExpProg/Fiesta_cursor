import React, { useState, useRef } from 'react';
import { ImageService } from '@/services/imageService';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';
import { useImageStorage } from '@/hooks/useImageStorage';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle } from 'lucide-react';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved: () => void;
  userId: number;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  userId,
  className = ''
}) => {
  const { reachGoal } = useYandexMetrika();
  const { isInitialized, isInitializing, error: storageError } = useImageStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

  // Показываем ошибку инициализации если есть
  const displayError = uploadError || storageError;
  const isDisabled = isUploading || isInitializing || !!storageError;

  // Отладочная информация
  console.log('🖼️ ImageUpload render:', {
    userId,
    currentImageUrl,
    isInitialized,
    isInitializing,
    storageError,
    previewUrl,
    isDisabled
  });

  // Обработчик выбора файла
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    reachGoal('image_upload_attempt', {
      file_size: file.size,
      file_type: file.type,
      user_id: userId
    });

    setIsUploading(true);
    setUploadError(null);

    try {
      // Создаем предварительный просмотр
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Загружаем файл
      const result = await ImageService.uploadImage(file, userId);

      if (result.error || !result.data) {
        throw new Error(result.error?.message || 'Не удалось загрузить изображение');
      }

      // Очищаем временный URL и устанавливаем финальный
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(result.data);
      onImageUploaded(result.data);

      reachGoal('image_upload_success', {
        image_url: result.data,
        user_id: userId
      });

    } catch (error) {
      console.error('❌ Error uploading image:', error);
      setUploadError(error instanceof Error ? error.message : 'Ошибка загрузки');
      setPreviewUrl(currentImageUrl || null);

      reachGoal('image_upload_error', {
        error: error instanceof Error ? error.message : 'unknown_error',
        user_id: userId
      });
    } finally {
      setIsUploading(false);
      // Очищаем input для возможности повторной загрузки того же файла
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Обработчик удаления изображения
  const handleRemoveImage = async () => {
    if (!previewUrl) return;

    reachGoal('image_remove_attempt', {
      image_url: previewUrl,
      user_id: userId
    });

    try {
      // Если это загруженное изображение (не временный URL), удаляем из Storage
      if (previewUrl.startsWith('http') && !previewUrl.startsWith('blob:')) {
        await ImageService.deleteImage(previewUrl);
      }

      setPreviewUrl(null);
      onImageRemoved();

      reachGoal('image_remove_success', {
        user_id: userId
      });

    } catch (error) {
      console.error('❌ Error removing image:', error);
      // Даже если удаление из Storage не удалось, убираем изображение из UI
      setPreviewUrl(null);
      onImageRemoved();

      reachGoal('image_remove_error', {
        error: error instanceof Error ? error.message : 'unknown_error',
        user_id: userId
      });
    }
  };

  // Обработчик клика по области загрузки
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Временный отладочный блок */}
      <div className="bg-yellow-100 border border-yellow-400 rounded p-2 text-xs">
        🔧 DEBUG: ImageUpload компонент загружен. UserId: {userId}, Initialized: {isInitialized ? 'Yes' : 'No'}
      </div>
      
      <label className="block text-sm font-medium text-gray-700">
        Изображение мероприятия
      </label>

      {/* Область загрузки/предварительного просмотра */}
      <div className="relative">
        {previewUrl ? (
          // Предварительный просмотр изображения
          <div className="relative group">
            <img
              src={previewUrl}
              alt="Предварительный просмотр"
              className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
            />
            
            {/* Оверлей с кнопками */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={isDisabled}
                  className="bg-white text-gray-700 px-3 py-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Заменить
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isDisabled}
                  className="bg-red-500 text-white px-3 py-2 rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Удалить
                </button>
              </div>
            </div>

            {/* Индикатор загрузки */}
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="bg-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Загрузка...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Область для загрузки
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={isDisabled}
            className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors duration-200 flex flex-col items-center justify-center gap-3 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading || isInitializing ? (
              <>
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                <span className="text-sm text-gray-500">
                  {isInitializing ? 'Инициализация хранилища...' : 'Загрузка изображения...'}
                </span>
              </>
            ) : storageError ? (
              <>
                <AlertCircle className="w-8 h-8 text-red-400" />
                <div className="text-center">
                  <span className="text-sm font-medium text-red-600">
                    Ошибка инициализации
                  </span>
                  <p className="text-xs text-red-500 mt-1">
                    Попробуйте перезагрузить страницу
                  </p>
                </div>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-gray-400" />
                <div className="text-center">
                  <span className="text-sm font-medium text-gray-700">
                    Нажмите для загрузки изображения
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    JPEG, PNG, WebP до 5MB
                  </p>
                </div>
              </>
            )}
          </button>
        )}

        {/* Скрытый input для файлов */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Сообщение об ошибке */}
      {displayError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{displayError}</p>
        </div>
      )}

      {/* Подсказка */}
      <p className="text-xs text-gray-500">
        Рекомендуемый размер: 1200x600 пикселей. Поддерживаются форматы JPEG, PNG, WebP размером до 5MB.
      </p>
    </div>
  );
}; 