import React from 'react';
import { DebugInfo } from './DebugInfo';
import { SupabaseTest } from './SupabaseTest';
import { useAdminStatus } from '@/hooks/useAdminStatus';

export const TestMode: React.FC = () => {
  const { isAdmin, isLoading: adminLoading } = useAdminStatus();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Fiesta</h1>
            <p className="text-gray-600">
              Приложение для бронирования вечеринок
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-yellow-600 text-xl mr-3">⚠️</div>
              <div>
                <h3 className="font-medium text-yellow-800 mb-1">
                  Режим разработки
                </h3>
                <p className="text-sm text-yellow-700">
                  Приложение запущено вне Telegram WebApp. Для полной функциональности 
                  откройте приложение через Telegram бота.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">
                🚀 Как запустить в Telegram:
              </h3>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Создайте бота через @BotFather</li>
                <li>2. Настройте Web App URL</li>
                <li>3. Добавьте кнопку меню</li>
                <li>4. Откройте приложение в боте</li>
              </ol>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">
                🔧 Для разработки:
              </h3>
              <p className="text-sm text-blue-700">
                Используйте ngrok или Vercel для создания HTTPS URL, 
                который можно настроить в Telegram боте.
              </p>
            </div>
          </div>
        </div>

        {/* Отладочные компоненты только для администраторов */}
        {isAdmin && !adminLoading && (
          <>
            <SupabaseTest />
            <DebugInfo />
          </>
        )}
      </div>
    </div>
  );
}; 