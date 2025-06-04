import React, { useState, useRef, useEffect } from 'react';
import { ImageService } from '@/services/imageService';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';
import { useImageStorage } from '@/hooks/useImageStorage';
import { Upload, X, Image as ImageIcon, Loader2, AlertCircle, Clock } from 'lucide-react';
import { useTelegram } from './TelegramProvider';
import { useAdminStatus } from '@/hooks/useAdminStatus';

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
  const { isInitialized, isInitializing, error: storageError, initializationLog, isTelegramWebApp } = useImageStorage();
  const { user } = useTelegram();
  const { isAdmin, isLoading: adminLoading } = useAdminStatus();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const [skipStorage, setSkipStorage] = useState(isTelegramWebApp);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState<string>('');
  const [estimatedTime, setEstimatedTime] = useState<string>('');
  const [uploadStartTime, setUploadStartTime] = useState<number>(0);

  // Показываем ошибку инициализации если есть
  const displayError = uploadError || storageError;
  const isDisabled = isUploading || (isInitializing && !skipStorage);
  
  // Если Storage недоступен более 3 секунд, показываем fallback
  const [showFallback, setShowFallback] = useState(isTelegramWebApp);
  
  useEffect(() => {
    if (isInitializing && !skipStorage) {
      const timer = setTimeout(() => {
        setShowFallback(true);
      }, 3000); // Сократили до 3 секунд
      
      return () => clearTimeout(timer);
    } else {
      setShowFallback(isTelegramWebApp);
    }
  }, [isInitializing, skipStorage, isTelegramWebApp]);

  // Закрытие контекстного меню при клике вне его
  useEffect(() => {
    const handleClickOutside = () => setShowContextMenu(false);
    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Симуляция прогресса загрузки
  const simulateProgress = (startTime: number, fileSize: number) => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const simulatedProgress = Math.min(95, (elapsed / 10000) * 100); // 95% за 10 секунд
      
      setUploadProgress(simulatedProgress);
      
      if (fileSize > 0) {
        const bytesPerSecond = (fileSize * simulatedProgress / 100) / (elapsed / 1000);
        const kbps = (bytesPerSecond / 1024).toFixed(1);
        setUploadSpeed(`${kbps} KB/s`);
        
        const remainingBytes = fileSize * (1 - simulatedProgress / 100);
        const remainingSeconds = remainingBytes / bytesPerSecond;
        if (remainingSeconds > 0 && remainingSeconds < 300) { // Не показываем если больше 5 минут
          setEstimatedTime(`~${Math.ceil(remainingSeconds)}с`);
        }
      }
      
      if (simulatedProgress >= 95) {
        clearInterval(interval);
      }
    }, 200);
    
    return interval;
  };

  // Отмена загрузки
  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
    setUploadSpeed('');
    setEstimatedTime('');
    setUploadError('Загрузка отменена');
  };

  // Обработчик контекстного меню
  const handleContextMenu = (event: React.MouseEvent) => {
    if (!previewUrl) return;
    
    event.preventDefault();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    setShowContextMenu(true);
  };

  // Обработчик выбора файла
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isReplacing = !!previewUrl;
    const previousImageUrl = previewUrl;

    reachGoal('image_upload_attempt', {
      file_size: file.size,
      file_type: file.type,
      user_id: userId,
      action: isReplacing ? 'replace' : 'add'
    });

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);
    setUploadSpeed('');
    setEstimatedTime('');
    setUploadStartTime(Date.now());

    // Создаем AbortController для возможности отмены
    abortControllerRef.current = new AbortController();

    try {
      // Создаем предварительный просмотр
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Запускаем симуляцию прогресса
      const progressInterval = simulateProgress(Date.now(), file.size);

      // В Telegram WebApp загружаем файл в Supabase Storage если доступен
      if (isInitialized && !isTelegramWebApp) {
        // Загружаем файл в Supabase Storage
        const result = await ImageService.uploadImage(file, userId);

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (result.error || !result.data) {
          throw new Error(result.error?.message || 'Не удалось загрузить изображение');
        }

        // Если заменяем изображение, удаляем предыдущее из Storage
        if (isReplacing && previousImageUrl && previousImageUrl.startsWith('http') && !previousImageUrl.startsWith('blob:')) {
          ImageService.deleteImage(previousImageUrl).catch(console.warn);
        }

        // Очищаем временный URL и устанавливаем финальный
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl(result.data);
        onImageUploaded(result.data);
        
        const uploadTime = Date.now() - uploadStartTime;
        reachGoal('image_upload_success', {
          image_url: result.data,
          user_id: userId,
          action: isReplacing ? 'replace' : 'add',
          upload_time_ms: uploadTime,
          file_size_kb: Math.round(file.size / 1024)
        });
      } else {
        // В Telegram WebApp или когда Storage недоступен, конвертируем в base64
        clearInterval(progressInterval);
        setUploadProgress(80);
        
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          URL.revokeObjectURL(objectUrl);
          setPreviewUrl(base64);
          onImageUploaded(base64);
          
          setUploadProgress(100);
          const uploadTime = Date.now() - uploadStartTime;
          
          reachGoal('image_upload_success', {
            image_url: 'base64_image',
            user_id: userId,
            action: isReplacing ? 'replace' : 'add',
            upload_time_ms: uploadTime,
            file_size_kb: Math.round(file.size / 1024)
          });
        };
        reader.onerror = () => {
          throw new Error('Ошибка чтения файла');
        };
        reader.readAsDataURL(file);
        
        // Небольшая задержка для показа прогресса
        setTimeout(() => setIsUploading(false), 500);
        return;
      }

    } catch (error) {
      console.error('❌ Error uploading image:', error);
      
      if (error instanceof Error && error.name === 'AbortError') {
        setUploadError('Загрузка отменена');
      } else {
        setUploadError(error instanceof Error ? error.message : 'Ошибка загрузки');
      }
      
      // Возвращаем предыдущее изображение при ошибке
      setPreviewUrl(isReplacing ? previousImageUrl : null);

      const uploadTime = Date.now() - uploadStartTime;
      reachGoal('image_upload_error', {
        error: error instanceof Error ? error.message : 'unknown_error',
        user_id: userId,
        action: isReplacing ? 'replace' : 'add',
        upload_time_ms: uploadTime,
        file_size_kb: Math.round(file.size / 1024)
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadSpeed('');
      setEstimatedTime('');
      abortControllerRef.current = null;
      
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
              className="w-full h-48 object-cover rounded-lg border-2 border-gray-200 cursor-pointer"
              onContextMenu={handleContextMenu}
              onClick={() => setShowContextMenu(false)}
            />
            
            {/* Контекстное меню */}
            {showContextMenu && (
              <div
                className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[150px]"
                style={{
                  left: Math.min(contextMenuPosition.x, window.innerWidth - 160),
                  top: Math.min(contextMenuPosition.y, window.innerHeight - 120)
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => {
                    handleUploadClick();
                    setShowContextMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  Загрузить новое
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => {
                    handleRemoveImage();
                    setShowContextMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 text-sm"
                >
                  <X className="w-4 h-4" />
                  Удалить
                </button>
              </div>
            )}

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

            {/* Быстрые действия под изображением */}
            <div className="mt-3 flex gap-2 justify-center">
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={isDisabled}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Загрузить новое
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={isDisabled}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Удалить
              </button>
            </div>
            
            {/* Подсказка о правом клике */}
            <p className="text-xs text-gray-400 text-center mt-2">
              💡 Нажмите правой кнопкой мыши на изображение для быстрого доступа к действиям
            </p>

            {/* Улучшенный индикатор загрузки с прогресс-баром */}
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                <div className="bg-white p-4 rounded-lg shadow-lg min-w-[280px]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span className="text-sm font-medium">Загрузка изображения</span>
                    </div>
                    <button
                      onClick={cancelUpload}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Отменить загрузку"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Прогресс-бар */}
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{uploadProgress.toFixed(0)}%</span>
                      {uploadSpeed && <span>{uploadSpeed}</span>}
                    </div>
                  </div>
                  
                  {/* Дополнительная информация */}
                  <div className="text-xs text-gray-500 space-y-1">
                    {estimatedTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Осталось: {estimatedTime}</span>
                      </div>
                    )}
                    <div>Изображение оптимизируется для быстрой загрузки</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Область для загрузки с улучшенным состоянием загрузки
          <div className="relative">
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={isDisabled}
              className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors duration-200 flex flex-col items-center justify-center gap-3 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(isUploading || (isInitializing && !skipStorage && !isTelegramWebApp)) ? (
                <>
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                  <span className="text-sm text-gray-500">
                    {isInitializing ? 'Инициализация хранилища...' : 'Подготовка к загрузке...'}
                  </span>
                  {isUploading && uploadProgress > 0 && (
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
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
                    <p className="text-xs text-gray-400 mt-1">
                      ⚡ Автоматическое сжатие и оптимизация
                    </p>
                  </div>
                </>
              )}
            </button>
            
            {/* Прогресс-бар при загрузке */}
            {isUploading && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white rounded-lg p-3 shadow-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">Загрузка: {uploadProgress.toFixed(0)}%</span>
                    <button
                      onClick={cancelUpload}
                      className="text-gray-400 hover:text-gray-600"
                      title="Отменить"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  {(uploadSpeed || estimatedTime) && (
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      {uploadSpeed && <span>{uploadSpeed}</span>}
                      {estimatedTime && <span>{estimatedTime}</span>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
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
      
      {/* Диагностика (только для администраторов) */}
      {isAdmin && !adminLoading && (
        <details className="mt-2" open={!!storageError || isInitializing || isTelegramWebApp}>
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
            🔧 Диагностика (только для администраторов)
          </summary>
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs space-y-1">
            <div>UserId: {userId}</div>
            <div>Telegram WebApp: {isTelegramWebApp ? '✅' : '❌'}</div>
            <div>Initialized: {isInitialized ? '✅' : '❌'}</div>
            <div>Initializing: {isInitializing ? '⏳' : '❌'}</div>
            <div>Storage Error: {storageError || 'None'}</div>
            <div>Upload Error: {uploadError || 'None'}</div>
            <div>Show Fallback: {showFallback ? '✅' : '❌'}</div>
            <div>Skip Storage: {skipStorage ? '✅' : '❌'}</div>
            
            {/* Лог инициализации */}
            {initializationLog.length > 0 && (
              <div className="mt-2 p-2 bg-white border rounded max-h-32 overflow-y-auto">
                <div className="font-semibold text-gray-700 mb-1">Лог инициализации:</div>
                {initializationLog.map((logEntry, index) => (
                  <div key={index} className="text-xs text-gray-600">
                    {logEntry}
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}; 