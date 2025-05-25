-- ===============================================
-- ИСПРАВЛЕНИЕ ВСЕХ ОБЯЗАТЕЛЬНЫХ ПОЛЕЙ EVENTS
-- ===============================================

-- Делаем все проблемные поля необязательными
DO $$
BEGIN
    RAISE NOTICE 'Исправляем все обязательные поля в таблице events...';

    -- 1. Исправляем поле event_time
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND table_schema = 'public' 
        AND column_name = 'event_time'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE events ALTER COLUMN event_time DROP NOT NULL;
        RAISE NOTICE '✅ Поле event_time теперь необязательное';
    END IF;

    -- 2. Исправляем поле location
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND table_schema = 'public' 
        AND column_name = 'location'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE events ALTER COLUMN location DROP NOT NULL;
        RAISE NOTICE '✅ Поле location теперь необязательное';
    END IF;

    -- 3. Исправляем поле description (если обязательное)
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND table_schema = 'public' 
        AND column_name = 'description'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE events ALTER COLUMN description DROP NOT NULL;
        RAISE NOTICE '✅ Поле description теперь необязательное';
    END IF;

    -- 4. Исправляем поле image_url (если обязательное)
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND table_schema = 'public' 
        AND column_name = 'image_url'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE events ALTER COLUMN image_url DROP NOT NULL;
        RAISE NOTICE '✅ Поле image_url теперь необязательное';
    END IF;

    -- 5. Исправляем поле max_participants (если обязательное)
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND table_schema = 'public' 
        AND column_name = 'max_participants'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE events ALTER COLUMN max_participants DROP NOT NULL;
        RAISE NOTICE '✅ Поле max_participants теперь необязательное';
    END IF;

    -- 6. Исправляем поле price (если обязательное)
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND table_schema = 'public' 
        AND column_name = 'price'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE events ALTER COLUMN price DROP NOT NULL;
        RAISE NOTICE '✅ Поле price теперь необязательное';
    END IF;

    -- Добавляем недостающие поля если их нет
    
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

    -- Поле current_participants
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'current_participants'
    ) THEN
        ALTER TABLE events ADD COLUMN current_participants INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Добавлено поле current_participants';
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

    -- Обновляем NULL значения в event_time
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND table_schema = 'public' 
        AND column_name = 'event_time'
    ) THEN
        UPDATE events 
        SET event_time = (EXTRACT(HOUR FROM date) || ':' || LPAD(EXTRACT(MINUTE FROM date)::text, 2, '0') || ':00')::time
        WHERE event_time IS NULL;
        RAISE NOTICE '✅ Обновлены NULL значения event_time';
    END IF;

    RAISE NOTICE '🎉 Все исправления завершены!';
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
    '🎯 ВСЕ ИСПРАВЛЕНИЯ ЗАВЕРШЕНЫ!' as result,
    'Таблица events готова к работе!' as status;

-- Показываем обязательные поля после исправления
SELECT 
    '⚠️ ОСТАВШИЕСЯ ОБЯЗАТЕЛЬНЫЕ ПОЛЯ:' as info;

SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND table_schema = 'public' 
    AND is_nullable = 'NO'
ORDER BY ordinal_position; 