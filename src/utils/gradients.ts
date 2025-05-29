// Набор красивых градиентов для фона мероприятий
export const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Фиолетово-синий
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Розово-красный
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Голубой
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Зелено-мятный
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Розово-желтый
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Мятно-розовый
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', // Нежно-розовый
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', // Лавандовый
  'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)', // Персиково-розовый
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // Персиковый
  'linear-gradient(135deg, #ff8a80 0%, #ea80fc 100%)', // Коралловый
  'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', // Мятно-голубой
  'linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)', // Салатовый
  'linear-gradient(135deg, #ffd3a5 0%, #fd9853 100%)', // Оранжевый
  'linear-gradient(135deg, #c1dfc4 0%, #deecdd 100%)', // Светло-зеленый
];

/**
 * Генерирует случайный градиент из предустановленных
 */
export function generateRandomGradient(): string {
  const randomIndex = Math.floor(Math.random() * GRADIENT_PRESETS.length);
  return GRADIENT_PRESETS[randomIndex];
}

/**
 * Генерирует градиент на основе строки (детерминированный)
 * Полезно для создания одинакового градиента для одного события
 */
export function generateGradientFromString(str: string): string {
  // Простой хеш функция для создания числа из строки
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Используем абсолютное значение хеша для выбора градиента
  const index = Math.abs(hash) % GRADIENT_PRESETS.length;
  return GRADIENT_PRESETS[index];
}

/**
 * Получает градиент для события - из базы данных или генерирует новый
 */
export function getEventGradient(event: { id: string; gradient_background?: string | null; title: string }): string {
  // Если есть сохраненный градиент, используем его
  if (event.gradient_background) {
    return event.gradient_background;
  }
  
  // Иначе генерируем детерминированный градиент на основе ID события
  return generateGradientFromString(event.id + event.title);
} 