# Обновление Схемы Базы Данных

## Исправление Ошибки: Зарезервированное Слово `time`

### Проблема
PostgreSQL выдавал ошибку синтаксиса:
```
ERROR: 42601: syntax error at or near "time"
LINE 402: time TIME,
```

### Причина
`time` является зарезервированным словом в PostgreSQL и не может использоваться как имя столбца без кавычек.

### Решение
Переименовали столбец `time` в `event_time` во всех местах:

#### Изменения в базе данных (`database/schema.sql`):
- Таблица `events`: `time TIME NOT NULL` → `event_time TIME NOT NULL`
- Функция `search_events`: возвращаемое поле `time` → `event_time`
- Представление `bookings_with_details`: `e.time as event_time` → `e.event_time`

#### Изменения в типах TypeScript (`src/types/database.ts`):
- `DatabaseEvent.time` → `DatabaseEvent.event_time`
- `DatabaseEventInsert.time` → `DatabaseEventInsert.event_time`
- `DatabaseEventUpdate.time` → `DatabaseEventUpdate.event_time`
- `SearchEventResult.time` → `SearchEventResult.event_time`
- `CreateEventData.time` → `CreateEventData.event_time`
- `BookingWithDetails.event_time` (уже было правильно)

### Влияние на код
Если у вас есть компоненты или хуки, которые используют поле `time` из объектов событий, их нужно обновить:

**Было:**
```typescript
const eventTime = event.time;
```

**Стало:**
```typescript
const eventTime = event.event_time;
```

### Проверка после обновления
1. Запустите SQL скрипт в Supabase
2. Убедитесь, что нет ошибок синтаксиса
3. Проверьте TypeScript на отсутствие ошибок типов
4. Обновите компоненты, если они используют поле времени

### Миграция данных
Данные мигрируются автоматически - PostgreSQL переименует столбец, сохранив все существующие значения. 