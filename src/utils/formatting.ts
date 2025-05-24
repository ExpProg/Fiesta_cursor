/**
 * Форматирование даты в читаемый вид
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Форматирование времени
 */
export const formatTime = (timeString: string): string => {
  return timeString.slice(0, 5); // HH:MM
};

/**
 * Форматирование цены в рублях
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(amount);
};

/**
 * Склонение слов в зависимости от числа
 */
export const pluralize = (count: number, words: [string, string, string]): string => {
  const [one, few, many] = words;
  
  if (count % 10 === 1 && count % 100 !== 11) {
    return one;
  }
  
  if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) {
    return few;
  }
  
  return many;
};

/**
 * Обрезание текста до определенной длины
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
};

/**
 * Проверка валидности email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Получение инициалов из имени
 */
export const getInitials = (firstName: string, lastName?: string): string => {
  if (lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  return firstName.charAt(0).toUpperCase();
}; 