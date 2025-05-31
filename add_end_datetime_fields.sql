-- Добавление полей для времени окончания мероприятий
-- Позволяет создавать многодневные мероприятия или мероприятия с определенным временем окончания

-- Добавляем поля end_date и end_time в таблицу events
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS end_time TIME;

-- Добавляем комментарии для документации
COMMENT ON COLUMN events.end_date IS 'Дата окончания мероприятия (для многодневных событий)';
COMMENT ON COLUMN events.end_time IS 'Время окончания мероприятия';

-- Добавляем проверочное ограничение: дата окончания не может быть раньше даты начала
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_end_date_after_start_date' 
        AND table_name = 'events'
    ) THEN
        ALTER TABLE events 
        ADD CONSTRAINT check_end_date_after_start_date 
        CHECK (end_date IS NULL OR end_date >= date);
    END IF;
END $$;

-- Добавляем индекс для оптимизации запросов по диапазону дат
CREATE INDEX IF NOT EXISTS idx_events_date_range ON events (date, end_date) WHERE end_date IS NOT NULL; 