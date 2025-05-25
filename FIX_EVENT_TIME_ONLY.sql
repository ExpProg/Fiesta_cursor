-- ===============================================
-- БЫСТРОЕ ИСПРАВЛЕНИЕ ПОЛЯ EVENT_TIME
-- ===============================================

-- Простое решение проблемы с event_time
DO $$
BEGIN
    RAISE NOTICE 'Исправляем поле event_time...';

    -- Проверяем, существует ли поле event_time и является ли оно обязательным
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND table_schema = 'public' 
        AND column_name = 'event_time'
        AND is_nullable = 'NO'
    ) THEN
        RAISE NOTICE '⚠️ Поле event_time обязательное - делаем его необязательным';
        
        -- Делаем поле необязательным
        ALTER TABLE events ALTER COLUMN event_time DROP NOT NULL;
        RAISE NOTICE '✅ Поле event_time теперь необязательное';
        
        -- Обновляем NULL значения корректным временем
        UPDATE events 
        SET event_time = (EXTRACT(HOUR FROM date) || ':' || LPAD(EXTRACT(MINUTE FROM date)::text, 2, '0') || ':00')::time
        WHERE event_time IS NULL;
        RAISE NOTICE '✅ Обновлены записи с NULL event_time';
        
    ELSIF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND table_schema = 'public' 
        AND column_name = 'event_time'
    ) THEN
        RAISE NOTICE 'ℹ️ Поле event_time уже существует и необязательное';
        
        -- Все равно обновляем NULL значения на всякий случай
        UPDATE events 
        SET event_time = (EXTRACT(HOUR FROM date) || ':' || LPAD(EXTRACT(MINUTE FROM date)::text, 2, '0') || ':00')::time
        WHERE event_time IS NULL;
        RAISE NOTICE '✅ Обновлены NULL значения event_time';
        
    ELSE
        RAISE NOTICE 'ℹ️ Поле event_time не существует - создаем как необязательное';
        
        -- Создаем поле как необязательное
        ALTER TABLE events ADD COLUMN event_time TIME;
        RAISE NOTICE '✅ Создано поле event_time';
        
        -- Заполняем для всех существующих записей
        UPDATE events 
        SET event_time = (EXTRACT(HOUR FROM date) || ':' || LPAD(EXTRACT(MINUTE FROM date)::text, 2, '0') || ':00')::time;
        RAISE NOTICE '✅ Заполнено время для всех записей';
    END IF;

    RAISE NOTICE '🎉 Исправление event_time завершено!';
END $$;

-- Проверяем результат
SELECT 
    '✅ ГОТОВО!' as result,
    'Поле event_time исправлено' as status;

-- Показываем информацию о поле
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND table_schema = 'public' 
    AND column_name = 'event_time'; 