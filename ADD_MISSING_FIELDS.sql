-- ===============================================
-- ДОБАВЛЕНИЕ НЕДОСТАЮЩИХ ПОЛЕЙ В ТАБЛИЦУ EVENTS
-- ===============================================

-- Добавляем только недостающие поля без изменения существующих
DO $$
BEGIN
    RAISE NOTICE 'Начинаем добавление недостающих полей...';

    -- Добавляем поле created_by если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE events ADD COLUMN created_by BIGINT NOT NULL DEFAULT 0;
        RAISE NOTICE '✅ Добавлено поле created_by';
    ELSE
        RAISE NOTICE 'ℹ️ Поле created_by уже существует';
    END IF;

    -- Добавляем поле title если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'title'
    ) THEN
        ALTER TABLE events ADD COLUMN title TEXT NOT NULL DEFAULT '';
        RAISE NOTICE '✅ Добавлено поле title';
    ELSE
        RAISE NOTICE 'ℹ️ Поле title уже существует';
    END IF;

    -- Добавляем поле description если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'description'
    ) THEN
        ALTER TABLE events ADD COLUMN description TEXT;
        RAISE NOTICE '✅ Добавлено поле description';
    ELSE
        RAISE NOTICE 'ℹ️ Поле description уже существует';
    END IF;

    -- Добавляем поле image_url если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE events ADD COLUMN image_url TEXT;
        RAISE NOTICE '✅ Добавлено поле image_url';
    ELSE
        RAISE NOTICE 'ℹ️ Поле image_url уже существует';
    END IF;

    -- Добавляем поле location если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'location'
    ) THEN
        ALTER TABLE events ADD COLUMN location TEXT;
        RAISE NOTICE '✅ Добавлено поле location';
    ELSE
        RAISE NOTICE 'ℹ️ Поле location уже существует';
    END IF;

    -- Добавляем поле max_participants если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'max_participants'
    ) THEN
        ALTER TABLE events ADD COLUMN max_participants INTEGER;
        RAISE NOTICE '✅ Добавлено поле max_participants';
    ELSE
        RAISE NOTICE 'ℹ️ Поле max_participants уже существует';
    END IF;

    -- Добавляем поле current_participants если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'current_participants'
    ) THEN
        ALTER TABLE events ADD COLUMN current_participants INTEGER DEFAULT 0;
        RAISE NOTICE '✅ Добавлено поле current_participants';
    ELSE
        RAISE NOTICE 'ℹ️ Поле current_participants уже существует';
    END IF;

    -- Добавляем поле price если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'price'
    ) THEN
        ALTER TABLE events ADD COLUMN price DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE '✅ Добавлено поле price';
    ELSE
        RAISE NOTICE 'ℹ️ Поле price уже существует';
    END IF;

    -- Добавляем поле status если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'status'
    ) THEN
        ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE '✅ Добавлено поле status';
    ELSE
        RAISE NOTICE 'ℹ️ Поле status уже существует';
    END IF;

    -- Добавляем поле created_at если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE events ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Добавлено поле created_at';
    ELSE
        RAISE NOTICE 'ℹ️ Поле created_at уже существует';
    END IF;

    -- Добавляем поле updated_at если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE events ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE '✅ Добавлено поле updated_at';
    ELSE
        RAISE NOTICE 'ℹ️ Поле updated_at уже существует';
    END IF;

    RAISE NOTICE '🎉 Добавление полей завершено!';
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
    '🎯 ДОБАВЛЕНИЕ ЗАВЕРШЕНО!' as result,
    'Таблица events готова к работе!' as status;

-- Показываем финальную структуру
SELECT 
    '📋 СТРУКТУРА ТАБЛИЦЫ EVENTS:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' AND table_schema = 'public'
ORDER BY ordinal_position; 