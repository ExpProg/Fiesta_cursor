/**
 * Утилиты для работы с откликами на мероприятия
 */

import { supabase } from '@/hooks/useSupabase';
import type { 
  EventResponse, 
  EventResponseInsert, 
  EventResponseUpdate, 
  EventParticipant,
  ResponseStatus 
} from '@/types/database';

/**
 * Получает статус отклика пользователя на мероприятие
 */
export async function getUserResponseStatus(
  eventId: string, 
  userTelegramId: number
): Promise<ResponseStatus | null> {
  try {
    const { data, error } = await supabase
      .from('event_responses')
      .select('response_status')
      .eq('event_id', eventId)
      .eq('user_telegram_id', userTelegramId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error getting user response status:', error);
      return null;
    }

    return data?.response_status || null;
  } catch (error) {
    console.error('Error getting user response status:', error);
    return null;
  }
}

/**
 * Добавляет или обновляет отклик пользователя на мероприятие
 */
export async function respondToEvent(
  eventId: string,
  userTelegramId: number,
  userFirstName: string,
  userLastName: string | null,
  userUsername: string | null,
  responseStatus: ResponseStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Responding to event:', { eventId, userTelegramId, responseStatus });
    
    const responseData: EventResponseInsert = {
      event_id: eventId,
      user_telegram_id: userTelegramId,
      user_first_name: userFirstName,
      user_last_name: userLastName,
      user_username: userUsername,
      response_status: responseStatus
    };

    console.log('Response data:', responseData);

    // Используем upsert для добавления или обновления
    const { data, error } = await supabase
      .from('event_responses')
      .upsert(responseData, {
        onConflict: 'event_id,user_telegram_id'
      })
      .select();

    if (error) {
      console.error('Error responding to event:', error);
      return { success: false, error: error.message };
    }

    console.log('Response saved successfully:', data);
    return { success: true };
  } catch (error) {
    console.error('Error responding to event:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Получает список участников мероприятия
 */
export async function getEventParticipants(eventId: string): Promise<EventParticipant[]> {
  try {
    const { data, error } = await supabase
      .from('event_responses')
      .select('*')
      .eq('event_id', eventId)
      .eq('response_status', 'attending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting event participants:', error);
      return [];
    }

    // Преобразуем данные в нужный формат
    return (data || []).map((response: EventResponse): EventParticipant => ({
      telegram_id: response.user_telegram_id,
      first_name: response.user_first_name,
      last_name: response.user_last_name,
      username: response.user_username,
      response_status: response.response_status,
      responded_at: response.created_at,
      display_name: formatParticipantName(response.user_first_name, response.user_last_name)
    }));
  } catch (error) {
    console.error('Error getting event participants:', error);
    return [];
  }
}

/**
 * Получает все отклики на мероприятие (включая "не буду")
 */
export async function getAllEventResponses(eventId: string): Promise<EventResponse[]> {
  try {
    const { data, error } = await supabase
      .from('event_responses')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error getting all event responses:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting all event responses:', error);
    return [];
  }
}

/**
 * Удаляет отклик пользователя на мероприятие
 */
export async function removeEventResponse(
  eventId: string, 
  userTelegramId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('event_responses')
      .delete()
      .eq('event_id', eventId)
      .eq('user_telegram_id', userTelegramId);

    if (error) {
      console.error('Error removing event response:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing event response:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Форматирует имя участника для отображения
 */
export function formatParticipantName(firstName: string, lastName: string | null): string {
  if (!lastName) {
    return firstName;
  }
  
  // Сокращаем фамилию до первой буквы
  const lastNameInitial = lastName.charAt(0).toUpperCase();
  return `${firstName} ${lastNameInitial}.`;
}

/**
 * Получает статистику откликов на мероприятие
 */
export async function getEventResponseStats(eventId: string): Promise<{
  attending: number;
  notAttending: number;
  maybe: number;
  total: number;
}> {
  try {
    const { data, error } = await supabase
      .from('event_responses')
      .select('response_status')
      .eq('event_id', eventId);

    if (error) {
      console.error('Error getting event response stats:', error);
      return { attending: 0, notAttending: 0, maybe: 0, total: 0 };
    }

    const stats = {
      attending: 0,
      notAttending: 0,
      maybe: 0,
      total: data?.length || 0
    };

    data?.forEach((response: { response_status: ResponseStatus }) => {
      switch (response.response_status) {
        case 'attending':
          stats.attending++;
          break;
        case 'not_attending':
          stats.notAttending++;
          break;
        case 'maybe':
          stats.maybe++;
          break;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting event response stats:', error);
    return { attending: 0, notAttending: 0, maybe: 0, total: 0 };
  }
}

/**
 * Проверяет, может ли пользователь откликнуться на мероприятие
 */
export function canUserRespond(
  eventStatus: string,
  currentParticipants: number,
  maxParticipants: number | null,
  userResponse: ResponseStatus | null
): boolean {
  // Мероприятие должно быть активным
  if (eventStatus !== 'active') {
    return false;
  }

  // Если пользователь уже откликнулся как "буду", он может изменить ответ
  if (userResponse === 'attending') {
    return true;
  }

  // Если есть лимит участников и он достигнут, новые участники не могут присоединиться
  // (но только если пользователь еще не участвует)
  if (maxParticipants && currentParticipants >= maxParticipants) {
    return false;
  }

  return true;
}

/**
 * Получает текст для отображения статуса отклика
 */
export function getResponseStatusText(status: ResponseStatus | null): string {
  switch (status) {
    case 'attending':
      return 'Буду';
    case 'not_attending':
      return 'Не буду';
    case 'maybe':
      return 'Возможно';
    default:
      return 'Не отвечено';
  }
}

/**
 * Получает CSS класс для кнопки отклика
 */
export function getResponseButtonClass(
  status: ResponseStatus, 
  currentUserResponse: ResponseStatus | null,
  disabled: boolean = false
): string {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  
  if (disabled) {
    return `${baseClasses} bg-gray-300 text-gray-500`;
  }

  const isSelected = currentUserResponse === status;
  
  switch (status) {
    case 'attending':
      return `${baseClasses} ${
        isSelected 
          ? 'bg-green-600 text-white' 
          : 'bg-green-100 text-green-700 hover:bg-green-200'
      }`;
    case 'not_attending':
      return `${baseClasses} ${
        isSelected 
          ? 'bg-red-600 text-white' 
          : 'bg-red-100 text-red-700 hover:bg-red-200'
      }`;
    case 'maybe':
      return `${baseClasses} ${
        isSelected 
          ? 'bg-yellow-600 text-white' 
          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
      }`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-700 hover:bg-gray-200`;
  }
}

/**
 * Обновляет информацию о мероприятии из базы данных
 */
export async function refreshEventData(eventId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error) {
      console.error('Error refreshing event data:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error refreshing event data:', error);
    return null;
  }
}

/**
 * Проверяет, существует ли таблица event_responses и доступна ли она
 */
export async function checkEventResponsesTable(): Promise<{
  exists: boolean;
  error?: string;
  canInsert?: boolean;
}> {
  try {
    // Пытаемся выполнить простой SELECT запрос
    const { data, error } = await supabase
      .from('event_responses')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Event responses table check failed:', error);
      
      // Проверяем, существует ли таблица
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return { 
          exists: false, 
          error: 'Таблица event_responses не создана. Выполните SQL из ADD_EVENT_RESPONSES.sql' 
        };
      }
      
      return { 
        exists: true, 
        error: `Ошибка доступа к таблице: ${error.message}`,
        canInsert: false
      };
    }

    console.log('Event responses table exists and is accessible');
    return { exists: true, canInsert: true };
    
  } catch (error) {
    console.error('Error checking event_responses table:', error);
    return { 
      exists: false, 
      error: `Неизвестная ошибка: ${String(error)}` 
    };
  }
} 