-- ===============================================
-- ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С ПОЛЕМ EVENT_TIME
-- ===============================================

-- Решаем проблему с обязательным полем event_time
DO $$
BEGIN
    RAISE NOTICE 'Проверяем поле event_time...';

    -- Проверяем, существует ли поле event_time
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND table_schema = 'public' 
        AND column_name = 'event_time'
    ) THEN
        RAISE NOTICE 'ℹ️ Поле event_time найдено';
        
        -- Проверяем, является ли поле обязательным
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'events' 
            AND table_schema = 'public' 
            AND column_name = 'event_time'
            AND is_nullable = 'NO'
        ) THEN
            RAISE NOTICE '⚠️ Поле event_time обязательное (NOT NULL)';
            
            -- ВАРИАНТ 1: Делаем поле необязательным
            ALTER TABLE events ALTER COLUMN event_time DROP NOT NULL;
            RAISE NOTICE '✅ Поле event_time теперь необязательное';
            
            -- Устанавливаем значение по умолчанию для существующих записей
            UPDATE events 
            SET event_time = EXTRACT(HOUR FROM date) || ':' || LPAD(EXTRACT(MINUTE FROM date)::text, 2, '0')
            WHERE event_time IS NULL;
            RAISE NOTICE '✅ Обновлены существующие записи с event_time';
            
        ELSE
            RAISE NOTICE 'ℹ️ Поле event_time уже необязательное';
        END IF;
        
    ELSE
        RAISE NOTICE 'ℹ️ Поле event_time не существует';
        
        -- Создаем поле event_time как необязательное
        ALTER TABLE events ADD COLUMN event_time TEXT;
        RAISE NOTICE '✅ Создано поле event_time как необязательное';
    END IF;

    -- Добавляем другие недостающие поля если нужно
    
    -- Поле created_by
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE events ADD COLUMN created_by BIGINT NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ Добавлено поле created_by';
    END IF;

    -- Поле title
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'title'
    ) THEN
        ALTER TABLE events ADD COLUMN title TEXT NOT NULL DEFAULT '';
        RAISE NOTICE '✅ Добавлено поле title';
    END IF;

    -- Поле description
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'description'
    ) THEN
        ALTER TABLE events ADD COLUMN description TEXT;
        RAISE NOTICE '✅ Добавлено поле description';
    END IF;

    -- Поле image_url
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE events ADD COLUMN image_url TEXT;
        RAISE NOTICE '✅ Добавлено поле image_url';
    END IF;

    -- Поле location
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'location'
    ) THEN
        ALTER TABLE events ADD COLUMN location TEXT;
        RAISE NOTICE '✅ Добавлено поле location';
    END IF;

    -- Поле max_participants
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'max_participants'
    ) THEN
        ALTER TABLE events ADD COLUMN max_participants INTEGER;
        RAISE NOTICE '✅ Добавлено поле max_participants';
    END IF;

    -- Поле current_participants
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'current_participants'
    ) THEN
        ALTER TABLE events ADD COLUMN current_participants INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Добавлено поле current_participants';
    END IF;

    -- Поле price
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'price'
    ) THEN
        ALTER TABLE events ADD COLUMN price DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Добавлено поле price';
    END IF;

    -- Поле status
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'status'
    ) THEN
        ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE '✅ Добавлено поле status';
    END IF;

    -- Поле created_at
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE events ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Добавлено поле created_at';
    END IF;

    -- Поле updated_at
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE events ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Добавлено поле updated_at';
    END IF;

    RAISE NOTICE '🎉 Исправление завершено!';
END $$;

-- Создаем индексы если их нет
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_creator ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Включаем RLS если не включен
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Создаем политику если её нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'events' 
        AND policyname = 'allow_all_events'
    ) THEN
        CREATE POLICY "allow_all_events" ON events FOR ALL USING (true) WITH CHECK (true);
        RAISE NOTICE '✅ Создана политика allow_all_events';
    ELSE
        RAISE NOTICE 'ℹ️ Политика allow_all_events уже существует';
    END IF;
END $$;

-- Финальная проверка
SELECT 
    '🎯 ИСПРАВЛЕНИЕ EVENT_TIME ЗАВЕРШЕНО!' as result,
    'Таблица events готова к работе!' as status;

-- Показываем финальную структуру
SELECT 
    '📋 ОБНОВЛЕННАЯ СТРУКТУРА:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' AND table_schema = 'public'
ORDER BY ordinal_position; 