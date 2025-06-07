import { DatabaseEvent } from '../types/database';

export type EventStatus = 'planned' | 'active' | 'completed';

export interface EventStatusInfo {
  status: EventStatus;
  label: string;
  className: string;
  bgClassName: string;
  textClassName: string;
  description: string;
}

/**
 * Определяет статус мероприятия на основе дат
 */
export function getEventStatus(event: DatabaseEvent): EventStatusInfo {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Парсим дату начала мероприятия
  const eventDate = new Date(event.date);
  const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  
  // Парсим дату окончания (если есть)
  let endDate = null;
  if (event.end_date) {
    endDate = new Date(event.end_date);
  }
  
  // Определяем статус
  if (endDate) {
    // Многодневное мероприятие
    const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    if (today < eventDateOnly) {
      // Еще не началось
      return {
        status: 'planned',
        label: 'Запланировано',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        bgClassName: 'bg-blue-100',
        textClassName: 'text-blue-800',
        description: 'Мероприятие еще не началось'
      };
    } else if (today >= eventDateOnly && today <= endDateOnly) {
      // Идет сейчас
      return {
        status: 'active',
        label: 'Активно',
        className: 'bg-green-100 text-green-800 border-green-200 animate-pulse',
        bgClassName: 'bg-green-100',
        textClassName: 'text-green-800',
        description: 'Мероприятие проходит сейчас'
      };
    } else {
      // Завершилось
      return {
        status: 'completed',
        label: 'Завершено',
        className: 'bg-gray-100 text-gray-600 border-gray-200',
        bgClassName: 'bg-gray-100',
        textClassName: 'text-gray-600',
        description: 'Мероприятие завершено'
      };
    }
  } else {
    // Однодневное мероприятие
    if (today < eventDateOnly) {
      return {
        status: 'planned',
        label: 'Запланировано',
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        bgClassName: 'bg-blue-100',
        textClassName: 'text-blue-800',
        description: 'Мероприятие еще не началось'
      };
    } else if (today.getTime() === eventDateOnly.getTime()) {
      return {
        status: 'active',
        label: 'Активно',
        className: 'bg-green-100 text-green-800 border-green-200 animate-pulse',
        bgClassName: 'bg-green-100',
        textClassName: 'text-green-800',
        description: 'Мероприятие проходит сегодня'
      };
    } else {
      return {
        status: 'completed',
        label: 'Завершено',
        className: 'bg-gray-100 text-gray-600 border-gray-200',
        bgClassName: 'bg-gray-100',
        textClassName: 'text-gray-600',
        description: 'Мероприятие завершено'
      };
    }
  }
}

/**
 * Проверяет, является ли мероприятие завершенным
 */
export function isEventCompleted(event: DatabaseEvent): boolean {
  return getEventStatus(event).status === 'completed';
}

/**
 * Проверяет, является ли мероприятие активным
 */
export function isEventActive(event: DatabaseEvent): boolean {
  return getEventStatus(event).status === 'active';
}

/**
 * Проверяет, является ли мероприятие запланированным
 */
export function isEventPlanned(event: DatabaseEvent): boolean {
  return getEventStatus(event).status === 'planned';
}

/**
 * Получает CSS классы для статуса мероприятия
 */
export function getStatusBadgeClasses(status: EventStatus): string {
  switch (status) {
    case 'planned':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'active':
      return 'bg-green-100 text-green-800 border-green-200 animate-pulse';
    case 'completed':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
}

/**
 * Форматирует период проведения мероприятия
 */
export function formatEventPeriod(event: DatabaseEvent): string {
  const startDate = new Date(event.date);
  const startDateStr = startDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short'
  });
  
  if (event.end_date) {
    const endDate = new Date(event.end_date);
    const endDateStr = endDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
    
    return `${startDateStr} - ${endDateStr}`;
  }
  
  return startDateStr;
} 