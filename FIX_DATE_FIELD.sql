-- ===============================================
-- ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С ПОЛЕМ ДАТЫ
-- ===============================================

-- Исправляем проблему с полем даты в таблице events
DO $$
BEGIN
    -- Проверяем, какое поле даты существует и исправляем
    
    -- ВАРИАНТ 1: Если есть поле "date" но нет "event_date"
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'date'
    ) AND NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'event_date'
    ) THEN
        -- Переименовываем "date" в "event_date"
        ALTER TABLE events RENAME COLUMN date TO event_date;
        RAISE NOTICE '✅ Переименовано поле "date" → "event_date"';
        
    -- ВАРИАНТ 2: Если есть оба поля
    ELSIF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'date'
    ) AND EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'event_date'
    ) THEN
        -- Удаляем дублирующее поле "date"
        ALTER TABLE events DROP COLUMN date;
        RAISE NOTICE '✅ Удалено дублирующее поле "date"';
        
    -- ВАРИАНТ 3: Если есть только "event_date"
    ELSIF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'event_date'
    ) THEN
        RAISE NOTICE '✅ Поле "event_date" уже существует - всё в порядке';
        
    -- ВАРИАНТ 4: Если нет ни одного поля даты
    ELSE
        -- Создаем поле "event_date"
        ALTER TABLE events ADD COLUMN event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
        RAISE NOTICE '✅ Создано поле "event_date"';
    END IF;

    -- Добавляем отсутствующие поля если нужно
    
    -- Поле created_by
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE events ADD COLUMN created_by BIGINT NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ Добавлено поле "created_by"';
    END IF;

    -- Поле title
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'title'
    ) THEN
        ALTER TABLE events ADD COLUMN title TEXT NOT NULL DEFAULT '';
        RAISE NOTICE '✅ Добавлено поле "title"';
    END IF;

    -- Поле description
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'description'
    ) THEN
        ALTER TABLE events ADD COLUMN description TEXT;
        RAISE NOTICE '✅ Добавлено поле "description"';
    END IF;

    -- Поле image_url
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE events ADD COLUMN image_url TEXT;
        RAISE NOTICE '✅ Добавлено поле "image_url"';
    END IF;

    -- Поле location
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'location'
    ) THEN
        ALTER TABLE events ADD COLUMN location TEXT;
        RAISE NOTICE '✅ Добавлено поле "location"';
    END IF;

    -- Поле max_participants
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'max_participants'
    ) THEN
        ALTER TABLE events ADD COLUMN max_participants INTEGER;
        RAISE NOTICE '✅ Добавлено поле "max_participants"';
    END IF;

    -- Поле current_participants
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'current_participants'
    ) THEN
        ALTER TABLE events ADD COLUMN current_participants INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Добавлено поле "current_participants"';
    END IF;

    -- Поле price
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'price'
    ) THEN
        ALTER TABLE events ADD COLUMN price DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Добавлено поле "price"';
    END IF;

    -- Поле status
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'status'
    ) THEN
        ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE '✅ Добавлено поле "status"';
    END IF;

    -- Поле created_at
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE events ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Добавлено поле "created_at"';
    END IF;

    -- Поле updated_at
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE events ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Добавлено поле "updated_at"';
    END IF;

    RAISE NOTICE '🎉 Исправление полей завершено!';
END $$;

-- Создаем индексы
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_creator ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Включаем RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Создаем базовую политику доступа
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'events' 
        AND policyname = 'allow_all_events'
    ) THEN
        CREATE POLICY "allow_all_events" ON events FOR ALL USING (true) WITH CHECK (true);
        RAISE NOTICE '✅ Создана политика доступа';
    END IF;
END $$;

-- Финальная проверка
SELECT 
    '🎯 ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!' as result,
    'Таблица events готова к работе!' as status;

-- Показываем финальную структуру
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' AND table_schema = 'public'
ORDER BY ordinal_position; 