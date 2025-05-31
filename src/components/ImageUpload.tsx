import React, { useState, useRef, useEffect } from 'react';
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
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  // Показываем ошибку инициализации если есть
  const displayError = uploadError || storageError;
  const isDisabled = isUploading || isInitializing;
  
  // Если Storage недоступен более 5 секунд, показываем fallback
  const [showFallback, setShowFallback] = useState(false);
  
  useEffect(() => {
    if (isInitializing) {
      const timer = setTimeout(() => {
        setShowFallback(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setShowFallback(false);
    }
  }, [isInitializing]);

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

  // Обработчик ввода URL
  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    
    // Простая валидация URL
    try {
      new URL(urlInput);
      setPreviewUrl(urlInput);
      onImageUploaded(urlInput);
      setUrlInput('');
      setShowUrlInput(false);
      
      reachGoal('image_url_added_manual', {
        image_url: urlInput,
        user_id: userId
      });
    } catch {
      setUploadError('Введите корректный URL изображения');
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
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
                {showFallback && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUrlInput(true);
                    }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Добавить URL изображения
                  </button>
                )}
              </>
            ) : storageError ? (
              <>
                <AlertCircle className="w-8 h-8 text-red-400" />
                <div className="text-center">
                  <span className="text-sm font-medium text-red-600">
                    Ошибка инициализации
                  </span>
                  <p className="text-xs text-red-500 mt-1">
                    {storageError}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUrlInput(true);
                    }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Добавить URL изображения
                  </button>
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUrlInput(true);
                    }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Или добавить URL изображения
                  </button>
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
      
      {/* Диагностика (только в режиме разработки) */}
      {import.meta.env.DEV && (
        <details className="mt-2">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
            🔧 Диагностика (только для разработки)
          </summary>
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
            <div>UserId: {userId}</div>
            <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
            <div>Initializing: {isInitializing ? '⏳' : '❌'}</div>
            <div>Storage Error: {storageError || 'None'}</div>
            <div>Upload Error: {uploadError || 'None'}</div>
            <div>Show Fallback: {showFallback ? '✅' : '❌'}</div>
            <button
              type="button"
              onClick={() => {
                console.log('🔧 Manual Storage Check');
                window.location.reload();
              }}
              className="mt-1 px-2 py-1 bg-blue-500 text-white rounded text-xs"
            >
              Перезагрузить
            </button>
          </div>
        </details>
      )}

      {/* Поле для ввода URL */}
      {showUrlInput && (
        <div className="mt-3 p-4 border border-blue-200 rounded-lg bg-blue-50">
          <label className="block text-sm font-medium text-blue-700 mb-2">
            URL изображения
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleUrlSubmit();
                }
              }}
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Добавить
            </button>
            <button
              type="button"
              onClick={() => {
                setShowUrlInput(false);
                setUrlInput('');
                setUploadError(null);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 