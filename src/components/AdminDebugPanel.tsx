import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Bug, Database, MessageSquare, Eye, EyeOff, Calendar } from 'lucide-react';
import { DebugInfo } from './DebugInfo';
import { SupabaseTest } from './SupabaseTest';
import { EventStatusDebug } from './EventStatusDebug';
import { useAdminStatus } from '@/hooks/useAdminStatus';

export const AdminDebugPanel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isAdmin, isLoading: adminLoading } = useAdminStatus();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'debug' | 'supabase' | 'telegram' | 'events'>('debug');

  // Показываем только администраторам
  if (!isAdmin || adminLoading) {
    return null;
  }

  const tabs = [
    { id: 'debug' as const, label: 'Debug Info', icon: Bug },
    { id: 'events' as const, label: 'Event Status', icon: Calendar },
    { id: 'supabase' as const, label: 'Supabase Test', icon: Database },
    { id: 'telegram' as const, label: 'Telegram Debug', icon: MessageSquare },
  ];

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-red-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-red-800">
            🔧 Панель отладки (только для администраторов)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <EyeOff className="w-4 h-4 text-red-600" />
          ) : (
            <Eye className="w-4 h-4 text-red-600" />
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-red-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-red-600" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-red-200">
          {/* Вкладки */}
          <div className="flex border-b border-red-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-red-100 text-red-800 border-b-2 border-red-600'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Контент вкладок */}
          <div className="p-3">
            {activeTab === 'debug' && <DebugInfo className="m-0" />}
            {activeTab === 'events' && <EventStatusDebug className="m-0" />}
            {activeTab === 'supabase' && <SupabaseTest />}
            {activeTab === 'telegram' && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-red-800">Ссылки для диагностики</h4>
                <div className="space-y-2">
                  <a
                    href="/telegram-debug.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-blue-500 text-white px-3 py-2 rounded text-xs text-center hover:bg-blue-600 transition-colors"
                  >
                    🔍 Диагностика Telegram WebApp
                  </a>
                  <a
                    href="/debug.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-purple-500 text-white px-3 py-2 rounded text-xs text-center hover:bg-purple-600 transition-colors"
                  >
                    🔧 Полная диагностика системы
                  </a>
                  <button
                    onClick={async () => {
                      try {
                        console.log('🔄 Testing Supabase connection...');
                        const { supabase } = await import('@/hooks/useSupabase');
                        const { data, error } = await supabase.from('users').select('count').limit(1);
                        if (error) {
                          console.error('❌ Supabase test failed:', error);
                          alert(`Ошибка Supabase: ${error.message}`);
                        } else {
                          console.log('✅ Supabase connection OK');
                          alert('✅ Подключение к Supabase работает');
                        }
                      } catch (err) {
                        console.error('❌ Supabase test error:', err);
                        alert(`Ошибка тестирования: ${err}`);
                      }
                    }}
                    className="w-full bg-green-500 text-white px-3 py-2 rounded text-xs hover:bg-green-600 transition-colors"
                  >
                    🔧 Быстрый тест Supabase
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 