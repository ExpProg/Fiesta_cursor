import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Menu, 
  X, 
  BarChart3, 
  Plus, 
  User,
  LogOut
} from 'lucide-react';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';
import { useTelegram } from './TelegramProvider';

interface UserMenuProps {
  onDashboard: () => void;
  onCreateEvent: () => void;
  userFirstName?: string;
  userLastName?: string | null;
  userUsername?: string | null;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  onDashboard,
  onCreateEvent,
  userFirstName,
  userLastName,
  userUsername
}) => {
  const { impactOccurred } = useTelegram();
  const { reachGoal } = useYandexMetrika();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Вычисляем позицию меню относительно кнопки
  const updateMenuPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8, // 8px отступ
        right: window.innerWidth - rect.right
      });
    }
  };

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      updateMenuPosition();
      window.addEventListener('resize', updateMenuPosition);
      window.addEventListener('scroll', updateMenuPosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    impactOccurred('light');
    
    if (!isOpen) {
      reachGoal('user_menu_opened');
    }
  };

  const handleMenuAction = (action: string, callback: () => void) => {
    reachGoal(`user_menu_${action}_clicked`);
    setIsOpen(false);
    callback();
    impactOccurred('light');
  };

  const displayName = userFirstName 
    ? `${userFirstName}${userLastName ? ` ${userLastName}` : ''}`
    : 'Пользователь';

  // Компонент меню для портала
  const MenuContent = () => (
    <>
      {/* Overlay для мобильных устройств */}
      <div className="fixed inset-0 bg-black bg-opacity-25 z-[9998] md:hidden" />
      
      {/* Меню */}
      <div 
        ref={menuRef}
        className="fixed w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999]"
        style={{
          top: `${menuPosition.top}px`,
          right: `${menuPosition.right}px`
        }}
      >
        {/* Заголовок с информацией о пользователе */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {displayName}
              </p>
              {userUsername && (
                <p className="text-xs text-gray-500 truncate">
                  @{userUsername}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Пункты меню */}
        <div className="py-2">
          {/* Дэшборд */}
          <button
            onClick={() => handleMenuAction('dashboard', onDashboard)}
            className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="w-5 h-5 mr-3 text-blue-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">Дэшборд</div>
              <div className="text-xs text-gray-500">Статистика и аналитика</div>
            </div>
          </button>

          {/* Создать мероприятие */}
          <button
            onClick={() => handleMenuAction('create_event', onCreateEvent)}
            className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors"
          >
            <Plus className="w-5 h-5 mr-3 text-green-600" />
            <div>
              <div className="text-sm font-medium text-gray-900">Создать мероприятие</div>
              <div className="text-xs text-gray-500">Новое событие</div>
            </div>
          </button>
        </div>

        {/* Дополнительная информация */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            🎉 Fiesta - создавайте незабываемые события
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative">
      {/* Кнопка меню */}
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
        title="Меню пользователя"
      >
        {isOpen ? (
          <X className="w-5 h-5 text-gray-600" />
        ) : (
          <Menu className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Рендерим меню через портал в body */}
      {isOpen && createPortal(<MenuContent />, document.body)}
    </div>
  );
}; 