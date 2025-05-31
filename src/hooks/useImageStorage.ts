import { useEffect, useState } from 'react';
import { ImageService } from '@/services/imageService';

/**
 * Хук для работы с Supabase Storage для изображений
 */
export const useImageStorage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeStorage = async () => {
      if (isInitialized || isInitializing) return;

      setIsInitializing(true);
      setError(null);

      try {
        console.log('🔍 Checking if storage bucket exists...');
        
        // Проверяем существование bucket
        const bucketExists = await ImageService.checkBucketExists();
        
        if (!bucketExists) {
          console.log('🪣 Creating storage bucket...');
          
          // Создаем bucket если не существует
          const createResult = await ImageService.createBucket();
          
          if (createResult.error) {
            throw new Error(createResult.error.message);
          }
          
          console.log('✅ Storage bucket created successfully');
        } else {
          console.log('✅ Storage bucket already exists');
        }

        setIsInitialized(true);
      } catch (err) {
        console.error('❌ Error initializing storage:', err);
        setError(err instanceof Error ? err.message : 'Ошибка инициализации хранилища');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeStorage();
  }, [isInitialized, isInitializing]);

  return {
    isInitialized,
    isInitializing,
    error
  };
}; 