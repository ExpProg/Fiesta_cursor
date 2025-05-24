import React, { useState } from 'react';
import { supabase } from '@/hooks/useSupabase';

export const SupabaseTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    const results: any[] = [];

    try {
      // Тест 1: Проверка подключения
      console.log('🔄 Test 1: Connection check');
      try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        results.push({
          test: 'Подключение к Supabase',
          status: error ? 'error' : 'success',
          message: error ? error.message : 'Успешное подключение',
          details: error || data
        });
      } catch (err) {
        results.push({
          test: 'Подключение к Supabase',
          status: 'error',
          message: 'Ошибка подключения',
          details: err
        });
      }

      // Тест 2: Проверка таблицы users
      console.log('🔄 Test 2: Users table check');
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, telegram_id, first_name')
          .limit(1);
        results.push({
          test: 'Таблица users',
          status: error ? 'error' : 'success',
          message: error ? error.message : `Таблица доступна${data ? ` (${data.length} записей)` : ''}`,
          details: error || data
        });
      } catch (err) {
        results.push({
          test: 'Таблица users',
          status: 'error',
          message: 'Ошибка доступа к таблице',
          details: err
        });
      }

      // Тест 3: Проверка вставки тестового пользователя
      console.log('🔄 Test 3: Test user insert');
      try {
        const testUser = {
          telegram_id: 999999999,
          first_name: 'Test User',
          last_name: 'Debug',
          username: 'testuser',
          language_code: 'ru',
          is_premium: false
        };

        const { data, error } = await supabase
          .from('users')
          .insert(testUser)
          .select()
          .single();

        if (!error && data) {
          // Удаляем тестового пользователя
          await supabase.from('users').delete().eq('id', data.id);
        }

        results.push({
          test: 'Создание пользователя',
          status: error ? 'error' : 'success',
          message: error ? error.message : 'Создание и удаление работает',
          details: error || 'Тестовый пользователь создан и удален'
        });
      } catch (err) {
        results.push({
          test: 'Создание пользователя',
          status: 'error',
          message: 'Ошибка создания пользователя',
          details: err
        });
      }

      // Тест 4: Проверка переменных окружения
      console.log('🔄 Test 4: Environment variables');
      const envCheck = {
        VITE_SUPABASE_URL: !!import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
        url_value: import.meta.env.VITE_SUPABASE_URL || 'NOT_SET',
        key_length: import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0
      };

      results.push({
        test: 'Переменные окружения',
        status: envCheck.VITE_SUPABASE_URL && envCheck.VITE_SUPABASE_ANON_KEY ? 'success' : 'error',
        message: 'Проверка конфигурации',
        details: envCheck
      });

    } catch (err) {
      results.push({
        test: 'Общая ошибка',
        status: 'error',
        message: 'Неожиданная ошибка',
        details: err
      });
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">🔧 Диагностика Supabase</h3>
      
      <button
        onClick={runTests}
        disabled={isLoading}
        className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 mb-4"
      >
        {isLoading ? '🔄 Тестирование...' : '🚀 Запустить тесты'}
      </button>

      {testResults.length > 0 && (
        <div className="space-y-3">
          {testResults.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${
                result.status === 'success'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  {result.status === 'success' ? '✅' : '❌'} {result.test}
                </h4>
              </div>
              <p className="text-sm text-gray-600 mt-1">{result.message}</p>
              {result.details && (
                <details className="mt-2">
                  <summary className="text-xs text-gray-500 cursor-pointer">Детали</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 