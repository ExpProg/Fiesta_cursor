# Пагинация и сортировка в EventsList

## Обзор изменений

Добавлена полноценная пагинация с сортировкой по дате создания во все списки мероприятий. Теперь события отображаются по 5 штук на страницу с возможностью навигации между страницами.

## Ключевые изменения

### 1. Сортировка по дате создания
- **Все списки** теперь сортируются по `created_at` в убывающем порядке (новые сначала)
- **Заменена сортировка** с `date` (дата мероприятия) на `created_at` (дата создания)
- **Консистентная сортировка** во всех методах API и SQL функциях

### 2. Пагинация
- **Размер страницы**: 5 мероприятий
- **Навигация**: кнопки "Назад"/"Вперед" + номера страниц
- **Адаптивный дизайн**: упрощенная версия для мобильных устройств
- **Автоскролл**: при смене страницы автоматически скроллит наверх

### 3. Точный подсчет событий
- **Новые методы API** для подсчета общего количества событий:
  - `getTotalCount()` - все мероприятия
  - `getAvailableTotalCount()` - доступные мероприятия
  - `getUserEventsTotalCount()` - мероприятия пользователя
  - `getUserArchiveTotalCount()` - архив пользователя

### 4. Обновленные SQL функции
- **Поддержка offset** во всех RPC функциях
- **Параметры пагинации**: `events_limit` и `events_offset`
- **Сортировка по created_at** в SQL запросах

## Технические детали

### Компонент Pagination
```typescript
interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}
```

**Особенности:**
- Показывает до 5 номеров страниц одновременно
- Умная навигация (показывает соседние страницы)
- Отключается при загрузке
- Скрывается если всего одна страница

### Кэширование с пагинацией
- **Ключи кэша**: `${tab}_page_${page}` (например, `all_page_1`)
- **Предзагрузка**: соседние страницы загружаются в фоне
- **TTL**: 2 минуты для каждой страницы
- **Очистка**: при смене пользователя

### API изменения

#### EventService методы
```typescript
// Обновленные методы с пагинацией
static async getAll(limit: number = 5, offset: number = 0)
static async getAvailable(limit: number = 5, offset: number = 0)
static async getUserEvents(telegramId: number, limit: number = 5, offset: number = 0)
static async getUserArchive(telegramId: number, limit: number = 5, offset: number = 0)

// Новые методы подсчета
static async getTotalCount(): Promise<ApiResponse<number>>
static async getAvailableTotalCount(): Promise<ApiResponse<number>>
static async getUserEventsTotalCount(telegramId: number): Promise<ApiResponse<number>>
static async getUserArchiveTotalCount(telegramId: number): Promise<ApiResponse<number>>
```

#### SQL функции
```sql
-- Обновленные функции с пагинацией
get_user_events_optimized(user_telegram_id BIGINT, events_limit INTEGER DEFAULT 5, events_offset INTEGER DEFAULT 0)
get_user_archive_optimized(user_telegram_id BIGINT, events_limit INTEGER DEFAULT 5, events_offset INTEGER DEFAULT 0)
get_available_events_optimized(events_limit INTEGER DEFAULT 5, events_offset INTEGER DEFAULT 0)
```

## Производительность

### Оптимизации
- **Параллельные запросы**: данные и подсчет загружаются одновременно
- **Кэширование страниц**: каждая страница кэшируется отдельно
- **Предзагрузка**: соседние страницы загружаются в фоне
- **Мемоизация**: React.memo для предотвращения лишних ре-рендеров

### Индексы базы данных
Используются существующие составные индексы:
- `idx_events_status_date` - для активных событий
- `idx_events_created_by_private_date` - для событий пользователя
- `idx_event_responses_user_status` - для откликов пользователя

## UX улучшения

### Информация о пагинации
- **Счетчик страниц**: "Страница X" в заголовке
- **Статистика**: "Показано 1-5 из 23 результатов"
- **Состояние загрузки**: кнопки отключаются при загрузке

### Навигация
- **Клавиатурная навигация**: поддержка Tab и Enter
- **Доступность**: ARIA-labels и screen reader support
- **Визуальная обратная связь**: активная страница выделена

## Применение изменений

### 1. Обновление базы данных
```bash
# Применить SQL оптимизации
cd database
bash apply_optimizations.sh
```

### 2. Копирование SQL в Supabase Dashboard
1. Открыть Supabase Dashboard → SQL Editor
2. Скопировать содержимое `database/performance_optimization.sql`
3. Выполнить запрос

### 3. Проверка работы
```sql
-- Проверить функции
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%_optimized';

-- Тестировать пагинацию
SELECT * FROM get_available_events_optimized(5, 0); -- первая страница
SELECT * FROM get_available_events_optimized(5, 5); -- вторая страница
```

## Совместимость

### Обратная совместимость
- **Fallback методы**: если RPC функции недоступны, используются legacy методы
- **Graceful degradation**: при ошибках подсчета используется примерное количество
- **Старые API**: сохранены для совместимости

### Миграция
- **Автоматическая**: новая логика включается автоматически
- **Без простоев**: изменения не требуют перезапуска
- **Постепенная**: кэш обновляется по мере использования

## Мониторинг

### Аналитика
Добавлены новые события:
- `events_list_loaded` - с информацией о странице и количестве
- `events_list_error` - с деталями ошибок пагинации

### Логирование
- Подробные логи загрузки каждой страницы
- Информация о кэше и предзагрузке
- Статистика производительности

## Будущие улучшения

### Возможные доработки
1. **Виртуальная прокрутка** для больших списков
2. **Бесконечная прокрутка** как альтернатива пагинации
3. **Фильтрация и поиск** с сохранением пагинации
4. **Настраиваемый размер страницы** (5/10/20 элементов)
5. **URL-параметры** для прямых ссылок на страницы

### Оптимизации
1. **Server-side пагинация** с точным подсчетом в SQL
2. **Cursor-based пагинация** для больших наборов данных
3. **Кэширование на уровне CDN**
4. **Prefetch следующей страницы** при скролле

## Заключение

Реализована полноценная пагинация с сортировкой по дате создания, которая:
- ✅ Улучшает производительность (загрузка по 5 элементов)
- ✅ Обеспечивает лучший UX (быстрая навигация)
- ✅ Масштабируется (работает с любым количеством событий)
- ✅ Совместима (fallback для старых версий)
- ✅ Оптимизирована (кэширование и предзагрузка) 