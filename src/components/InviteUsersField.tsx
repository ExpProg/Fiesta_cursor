import React, { useState } from 'react';
import { Plus, X, Users, UserCheck, Phone, Search } from 'lucide-react';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { useYandexMetrika } from '@/hooks/useYandexMetrika';
import { UserService } from '@/services/userService';
import type { InvitedUser } from '@/types/database';

interface InviteUsersFieldProps {
  invitedUsers: InvitedUser[];
  onInvitedUsersChange: (users: InvitedUser[]) => void;
  isPrivate: boolean;
  className?: string;
}

export const InviteUsersField: React.FC<InviteUsersFieldProps> = ({
  invitedUsers,
  onInvitedUsersChange,
  isPrivate,
  className = ''
}) => {
  const { switchInlineQuery } = useTelegramWebApp();
  const { reachGoal } = useYandexMetrika();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    telegram_id: '',
    first_name: '',
    last_name: '',
    username: ''
  });

  const handleAddUser = () => {
    const telegramId = parseInt(newUser.telegram_id);
    
    if (!telegramId || !newUser.first_name.trim()) {
      alert('Пожалуйста, заполните обязательные поля: Telegram ID и Имя');
      return;
    }

    // Проверяем, не добавлен ли уже этот пользователь
    if (invitedUsers.some(user => user.telegram_id === telegramId)) {
      alert('Этот пользователь уже добавлен в список приглашенных');
      return;
    }

    const invitedUser: InvitedUser = {
      telegram_id: telegramId,
      first_name: newUser.first_name.trim(),
      last_name: newUser.last_name.trim() || null,
      username: newUser.username.trim() || null
    };

    onInvitedUsersChange([...invitedUsers, invitedUser]);
    
    // Сбрасываем форму
    resetForm();
    setShowAddForm(false);
    setShowSearchForm(false);
  };

  const handleRemoveUser = (telegramId: number) => {
    onInvitedUsersChange(invitedUsers.filter(user => user.telegram_id !== telegramId));
  };

  const handleInviteFromContacts = async () => {
    try {
      reachGoal('invite_users_share_invitation_attempt');
      
      console.log('=== Диагностика Telegram WebApp ===');
      console.log('window:', typeof window);
      console.log('window.Telegram:', typeof window !== 'undefined' ? window.Telegram : 'undefined');
      console.log('window.Telegram.WebApp:', typeof window !== 'undefined' && window.Telegram ? window.Telegram.WebApp : 'undefined');
      // @ts-ignore
      console.log('switchInlineQuery:', typeof window !== 'undefined' && window.Telegram?.WebApp ? window.Telegram.WebApp.switchInlineQuery : 'undefined');
      
      // Проверяем доступность Telegram WebApp API
      if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
        throw new Error('Telegram WebApp недоступен');
      }
      
      // @ts-ignore
      if (!window.Telegram.WebApp.switchInlineQuery) {
        throw new Error('switchInlineQuery функция недоступна в данной версии Telegram');
      }
      
      // Формируем сообщение приглашения
      const inviteMessage = '🎉 Приглашаю тебя на мероприятие! Присоединяйся через бота.';
      
      console.log('Вызываем switchInlineQuery с параметрами:', inviteMessage, ['users']);
      
      // Вызываем switchInlineQuery напрямую
      // @ts-ignore
      window.Telegram.WebApp.switchInlineQuery(inviteMessage, ['users']);
      
      reachGoal('invite_users_share_invitation_success');
      
      // Показываем уведомление об успехе
      alert('Выберите контакт для отправки приглашения');
      
    } catch (error) {
      console.error('=== Ошибка sharing invitation ===');
      console.error('Error object:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      reachGoal('invite_users_share_invitation_error');
      
      // Обрабатываем специфичную ошибку WebAppInlineModeDisabled
      if (error instanceof Error && error.message.includes('WebAppInlineModeDisabled')) {
        // Генерируем ссылку для ручной отправки
        const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'your_bot'; 
        const startParam = 'invite'; // Параметр для идентификации приглашения
        const inviteLink = `https://t.me/${botUsername}?start=${startParam}`;
        
        // Копируем ссылку в буфер обмена
        try {
          await navigator.clipboard.writeText(inviteLink);
          alert(`📋 Ссылка-приглашение скопирована в буфер обмена!\n\n${inviteLink}\n\nТеперь вы можете отправить её любому контакту в Telegram.`);
          reachGoal('invite_users_link_copied_success');
        } catch (clipboardError) {
          // Если копирование не удалось, показываем ссылку для ручного копирования
          alert(`📋 Скопируйте эту ссылку и отправьте её своим друзьям:\n\n${inviteLink}\n\n(Автоматическое копирование не поддерживается)`);
          reachGoal('invite_users_link_shown');
        }
        
        return;
      }
      
      // Обработка других ошибок
      if (error instanceof Error) {
        if (error.message.includes('Telegram WebApp недоступен')) {
          alert('Функция отправки приглашений доступна только в Telegram. Попробуйте добавить пользователей вручную или поделиться ссылкой на мероприятие.');
        } else if (error.message.includes('switchInlineQuery функция недоступна')) {
          alert('Функция отправки приглашений недоступна в данной версии Telegram. Попробуйте обновить Telegram или добавить пользователей вручную.');
        } else {
          alert(`Ошибка: ${error.message}`);
        }
      } else {
        alert('Произошла ошибка при отправке приглашения. Попробуйте добавить пользователей вручную.');
      }
    }
  };

  // Обработчик поиска пользователя по username
  const handleSearchByUsername = async () => {
    if (!newUser.username.trim()) {
      return;
    }

    setIsSearchingUser(true);
    reachGoal('invite_users_search_by_username_attempt');

    try {
      const result = await UserService.getByUsername(newUser.username);
      
      if (result.error) {
        console.error('Error searching user:', result.error);
        reachGoal('invite_users_search_by_username_error');
        return;
      }

      if (!result.data) {
        reachGoal('invite_users_search_by_username_not_found');
        return;
      }

      // Пользователь найден - автозаполняем поля
      setNewUser({
        telegram_id: result.data.telegram_id.toString(),
        first_name: result.data.first_name,
        last_name: result.data.last_name || '',
        username: result.data.username || ''
      });

      reachGoal('invite_users_search_by_username_success', {
        found_user_id: result.data.telegram_id
      });
    } catch (error) {
      console.error('Exception searching user:', error);
      reachGoal('invite_users_search_by_username_error');
    } finally {
      setIsSearchingUser(false);
    }
  };

  const resetForm = () => {
    setNewUser({
      telegram_id: '',
      first_name: '',
      last_name: '',
      username: ''
    });
  };

  const formatUserDisplay = (user: InvitedUser): string => {
    let display = user.first_name;
    if (user.last_name) {
      display += ` ${user.last_name}`;
    }
    if (user.username) {
      display += ` (@${user.username})`;
    }
    return display;
  };

  if (!isPrivate) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <Users className="w-4 h-4 mr-2" />
          Приглашенные пользователи *
        </label>
        <span className="text-xs text-gray-500">
          {invitedUsers.length} чел.
        </span>
      </div>

      {/* Список приглашенных пользователей */}
      {invitedUsers.length > 0 && (
        <div className="mb-4 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
          {invitedUsers.map((user) => (
            <div
              key={user.telegram_id}
              className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center flex-1 min-w-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {formatUserDisplay(user)}
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {user.telegram_id}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveUser(user.telegram_id)}
                className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                title="Удалить из списка"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Форма поиска по username */}
      {showSearchForm ? (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 mb-3">
          <h4 className="font-medium text-blue-800 mb-3 flex items-center">
            <Search className="w-4 h-4 mr-2" />
            Поиск пользователя по username
          </h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Username пользователя
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value.replace('@', '') })}
                  placeholder="Введите username (без @)"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchByUsername();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleSearchByUsername}
                  disabled={isSearchingUser || !newUser.username.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSearchingUser ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    'Найти'
                  )}
                </button>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Мы найдем пользователя в базе данных и автоматически заполним все поля
              </p>
            </div>

            {/* Показываем найденные данные */}
            {newUser.telegram_id && newUser.first_name && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">✅ Пользователь найден:</p>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Имя:</strong> {newUser.first_name} {newUser.last_name}</p>
                  <p><strong>Username:</strong> @{newUser.username}</p>
                  <p><strong>Telegram ID:</strong> {newUser.telegram_id}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {newUser.telegram_id && newUser.first_name ? (
                <button
                  type="button"
                  onClick={handleAddUser}
                  className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Добавить пользователя
                </button>
              ) : null}
              
              <button
                type="button"
                onClick={() => {
                  setShowSearchForm(false);
                  resetForm();
                }}
                className="px-3 py-2 text-gray-600 bg-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Форма добавления нового пользователя */}
      {showAddForm ? (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 mb-3">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Telegram ID *
              </label>
              <input
                type="number"
                value={newUser.telegram_id}
                onChange={(e) => setNewUser({ ...newUser, telegram_id: e.target.value })}
                placeholder="123456789"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Численный ID пользователя в Telegram
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Имя *
                </label>
                <input
                  type="text"
                  value={newUser.first_name}
                  onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                  placeholder="Иван"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Фамилия
                </label>
                <input
                  type="text"
                  value={newUser.last_name}
                  onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                  placeholder="Иванов"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value.replace('@', '') })}
                placeholder="username (без @)"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleAddUser}
                className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Добавить
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="px-3 py-2 text-gray-600 bg-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Кнопка поиска по username */}
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Search className="w-5 h-5 mr-2" />
            Найти по username
          </button>
          
          {/* Кнопка отправки приглашений из контактов */}
          <button
            type="button"
            onClick={handleInviteFromContacts}
            className="w-full flex items-center justify-center py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Phone className="w-5 h-5 mr-2" />
            Создать ссылку-приглашение
          </button>
          
          {/* Кнопка ручного добавления */}
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Добавить вручную (Telegram ID)
          </button>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        <p>🎯 <strong>Как работают приглашения:</strong></p>
        <p>• <strong>Добавьте пользователей</strong> в список приглашенных</p>
        <p>• <strong>Они увидят приглашение</strong> в разделе "Приглашения" приложения</p>
        <p>• <strong>Смогут принять или отклонить</strong> приглашение</p>
        <p>• <strong>Только приглашенные</strong> увидят это частное мероприятие</p>
        
        <p className="mt-2">💡 <strong>Способы добавления пользователей:</strong></p>
        <p>• <strong>Найти по username</strong> - автоматический поиск в базе данных</p>
        <p>• <strong>Ссылка-приглашение</strong> - создайте ссылку для отправки друзьям</p>
        <p>• <strong>Вручную</strong> - введите Telegram ID пользователя</p>
        
        <p className="mt-2">🔍 <strong>Поиск по username:</strong></p>
        <p>• Введите username без символа @</p>
        <p>• Система найдет пользователя в базе данных</p>
        <p>• Автоматически заполнит все поля</p>
        <p>• Пользователь должен ранее заходить в приложение</p>
        
        <p className="mt-2">📱 <strong>Как найти Telegram ID:</strong></p>
        <p>• Напишите боту @userinfobot</p>
        <p>• Найдите в настройках Telegram (некоторые клиенты)</p>
        <p>• Попросите друга проверить свой ID</p>
        
        <p className="mt-2">🔗 <strong>Как работает ссылка-приглашение:</strong></p>
        <p>• Создается персональная ссылка на ваш бот</p>
        <p>• Отправьте ее любому контакту в Telegram</p>
        <p>• Получатель перейдет в бота и увидит мероприятие</p>
        <p>• Автоматически добавится в список приглашенных</p>
      </div>
    </div>
  );
}; 