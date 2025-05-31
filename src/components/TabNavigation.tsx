import React from 'react';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';

export type TabType = 'all' | 'available' | 'my' | 'archive';

interface Tab {
  id: TabType;
  label: string;
  icon: string;
}

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: Tab[] = [
  { id: 'all', label: 'Все', icon: '' },
  { id: 'available', label: 'Доступные', icon: '' },
  { id: 'my', label: 'Мои', icon: '' },
  { id: 'archive', label: 'Архив', icon: '' }
];

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  const { reachGoal } = useYandexMetrika();
  
  console.log('🎯 TabNavigation rendering with activeTab:', activeTab);
  
  const handleTabClick = (tabId: TabType) => {
    console.log('🎯 Tab clicked:', tabId);
    
    // Отслеживаем переключение вкладок
    reachGoal('tab_switched', {
      from_tab: activeTab,
      to_tab: tabId,
      tab_name: tabs.find(t => t.id === tabId)?.label || tabId
    });
    
    onTabChange(tabId);
  };

  return (
    <div 
      className="bg-white border-b-2 border-blue-200 sticky top-0 z-50 shadow-sm"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 999,
        backgroundColor: '#ffffff',
        borderBottom: '2px solid #dbeafe',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="max-w-6xl mx-auto px-2">
        <div className="flex space-x-0" style={{ display: 'flex', width: '100%' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex-1 flex items-center justify-center py-4 px-2 text-sm font-medium border-b-3 transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50 shadow-sm'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              style={{
                minHeight: '60px',
                borderBottomWidth: activeTab === tab.id ? '3px' : '1px',
                borderBottomColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
                backgroundColor: activeTab === tab.id ? '#eff6ff' : 'transparent',
                color: activeTab === tab.id ? '#2563eb' : '#4b5563',
                flex: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: 'none',
                outline: 'none'
              }}
            >
              <span className="text-sm font-semibold">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 