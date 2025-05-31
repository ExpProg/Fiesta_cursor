-- Добавление полей для времени окончания мероприятий
-- Позволяет создавать многодневные мероприятия или мероприятия с определенным временем окончания

-- Добавляем поля end_date и end_time в таблицу events
ALTER TABLE events 
ADD COLUMN end_date DATE,
ADD COLUMN end_time TIME;

-- Добавляем комментарии для документации
COMMENT ON COLUMN events.end_date IS 'Дата окончания мероприятия (для многодневных событий)';
COMMENT ON COLUMN events.end_time IS 'Время окончания мероприятия';

-- Добавляем проверочное ограничение: дата окончания не может быть раньше даты начала
ALTER TABLE events 
ADD CONSTRAINT check_end_date_after_start_date 
CHECK (end_date IS NULL OR end_date >= date);

-- Добавляем индекс для оптимизации запросов по диапазону дат
CREATE INDEX idx_events_date_range ON events (date, end_date) WHERE end_date IS NOT NULL;

-- Обновляем существующие записи: если end_date не указана, она равна date
UPDATE events 
SET end_date = date 
WHERE end_date IS NULL; 