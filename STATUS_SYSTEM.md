# 🎯 Улучшенная система статусов мероприятий

## Автоматическое определение статуса

Система автоматически определяет статус мероприятия на основе дат:

- **🔵 Запланировано** - мероприятие еще не началось
- **🟢 Активно** - мероприятие проходит сейчас (с анимацией!)  
- **⚫ Завершено** - мероприятие закончилось (попадает в архив)

## Ключевые особенности

✅ **Автоматическая фильтрация**: Завершенные мероприятия автоматически попадают в архив

✅ **Визуальное выделение**: Активные мероприятия выделяются пульсацией и зеленым цветом

✅ **Поддержка многодневных**: Корректная обработка мероприятий с датой окончания

✅ **Умное форматирование**: Автоматическое форматирование периодов проведения

## Файлы

- `src/utils/eventStatus.ts` - основная логика статусов
- `src/components/EventCard.tsx` - новый компонент карточки с статусом  
- `src/components/EventsList.tsx` - обновлен для фильтрации по статусу

## Использование

```typescript
import { getEventStatus, isEventCompleted } from '../utils/eventStatus';

const status = getEventStatus(event);
// status.label - "Активно", "Запланировано", "Завершено"  
// status.className - CSS классы
// status.description - описание для tooltip
``` 