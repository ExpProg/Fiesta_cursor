import { useState, useEffect } from 'react';
import { AdminService } from '@/services/adminService';
import { useTelegram } from '@/components/TelegramProvider';

/**
 * Хук для проверки и управления статусом администратора
 */
export const useAdminStatus = () => {
  const { user } = useTelegram();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Проверка статуса администратора при монтировании или изменении пользователя
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        setIsLoading(false);
        setError(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const result = await AdminService.isUserAdmin(user.id);
        
        if (result.error) {
          console.error('Error checking admin status:', result.error);
          setError(result.error.message);
          setIsAdmin(false);
        } else {
          setIsAdmin(result.data || false);
        }
      } catch (err) {
        console.error('Exception checking admin status:', err);
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user?.id]);

  // Функция для принудительной проверки статуса (например, после изменений)
  const refetchAdminStatus = async () => {
    if (!user?.id) return;

    try {
      setError(null);
      const result = await AdminService.isUserAdmin(user.id);
      
      if (result.error) {
        setError(result.error.message);
        setIsAdmin(false);
      } else {
        setIsAdmin(result.data || false);
      }
    } catch (err) {
      console.error('Exception refetching admin status:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      setIsAdmin(false);
    }
  };

  return {
    isAdmin,
    isLoading,
    error,
    refetchAdminStatus,
    userId: user?.id
  };
}; 