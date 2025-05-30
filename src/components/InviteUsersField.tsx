import React, { useState } from 'react';
import { Plus, X, Users, UserCheck } from 'lucide-react';
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
  const [showAddForm, setShowAddForm] = useState(false);
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
    setNewUser({
      telegram_id: '',
      first_name: '',
      last_name: '',
      username: ''
    });
    setShowAddForm(false);
  };

  const handleRemoveUser = (telegramId: number) => {
    onInvitedUsersChange(invitedUsers.filter(user => user.telegram_id !== telegramId));
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
                  setNewUser({ telegram_id: '', first_name: '', last_name: '', username: '' });
                }}
                className="px-3 py-2 text-gray-600 bg-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Добавить пользователя
        </button>
      )}

      {invitedUsers.length === 0 && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            ⚠️ Для частного мероприятия необходимо добавить хотя бы одного приглашенного пользователя
          </p>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        <p>💡 <strong>Как узнать Telegram ID:</strong></p>
        <p>• Напишите боту @userinfobot в Telegram</p>
        <p>• Или найдите ID в настройках некоторых Telegram клиентов</p>
      </div>
    </div>
  );
}; 