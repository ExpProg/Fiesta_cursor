import React from 'react';
import { useTelegram } from './TelegramProvider';

interface DebugInfoProps {
  className?: string;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ className = '' }) => {
  const telegram = useTelegram();

  // Проверяем переменные окружения
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const debugData = {
    // Telegram
    telegramInitialized: telegram.isInitialized,
    telegramLoading: telegram.isLoading,
    telegramError: telegram.error,
    telegramUser: telegram.user,
    // Environment
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseKey: !!supabaseKey,
    nodeEnv: import.meta.env.MODE,
    // Window
    hasWindow: typeof window !== 'undefined',
    hasTelegramWebApp: typeof window !== 'undefined' && 'Telegram' in window,
    // Location
    currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
    hasWebAppData: typeof window !== 'undefined' && 
      (window.location.search.includes('tgWebAppData') || 
       window.location.hash.includes('tgWebAppData')),
  };

  return (
    <div className={`bg-gray-100 p-4 rounded-lg text-xs font-mono space-y-2 ${className}`}>
      <h3 className="font-bold text-sm">🔧 Debug Info</h3>
      
      <div className="space-y-1">
        <h4 className="font-semibold text-green-700">🟢 Telegram</h4>
        <div>Initialized: {debugData.telegramInitialized ? '✅' : '❌'}</div>
        <div>Loading: {debugData.telegramLoading ? '⏳' : '✅'}</div>
        <div>Error: {debugData.telegramError || '✅ None'}</div>
        <div>User ID: {debugData.telegramUser?.id || '❌ No user'}</div>
        <div>Has WebApp: {debugData.hasTelegramWebApp ? '✅' : '❌'}</div>
        <div>Has WebApp Data: {debugData.hasWebAppData ? '✅' : '❌'}</div>
      </div>

      <div className="space-y-1">
        <h4 className="font-semibold text-blue-700">🔗 Supabase</h4>
        <div>URL: {debugData.hasSupabaseUrl ? '✅ Set' : '❌ Missing'}</div>
        <div>Key: {debugData.hasSupabaseKey ? '✅ Set' : '❌ Missing'}</div>
        {debugData.hasSupabaseUrl && (
          <div className="text-xs break-all">
            URL: {supabaseUrl?.substring(0, 30)}...
          </div>
        )}
      </div>

      <div className="space-y-1">
        <h4 className="font-semibold text-purple-700">🌍 Environment</h4>
        <div>Mode: {debugData.nodeEnv}</div>
        <div>Window: {debugData.hasWindow ? '✅' : '❌'}</div>
        <div className="text-xs break-all">URL: {debugData.currentUrl}</div>
      </div>

      {debugData.telegramUser && (
        <div className="space-y-1">
          <h4 className="font-semibold text-yellow-700">👤 User</h4>
          <div>ID: {debugData.telegramUser.id}</div>
          <div>Name: {debugData.telegramUser.first_name} {debugData.telegramUser.last_name}</div>
          <div>Username: @{debugData.telegramUser.username || 'none'}</div>
          <div>Lang: {debugData.telegramUser.language_code}</div>
          <div>Premium: {debugData.telegramUser.is_premium ? '⭐' : '❌'}</div>
        </div>
      )}
    </div>
  );
}; 