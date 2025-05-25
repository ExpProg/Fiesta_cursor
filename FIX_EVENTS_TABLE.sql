-- ===============================================
-- ИСПРАВЛЕНИЕ ТАБЛИЦЫ EVENTS - ДОБАВЛЕНИЕ СТОЛБЦОВ
-- ===============================================

-- Добавляем недостающие столбцы к существующей таблице events
DO $$
BEGIN
    -- Добавляем столбец created_by если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE events ADD COLUMN created_by BIGINT NOT NULL DEFAULT 0;
        RAISE NOTICE 'Добавлен столбец created_by ✅';
    ELSE
        RAISE NOTICE 'Столбец created_by уже существует ✅';
    END IF;

    -- Добавляем столбец title если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'title'
    ) THEN
        ALTER TABLE events ADD COLUMN title TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Добавлен столбец title ✅';
    ELSE
        RAISE NOTICE 'Столбец title уже существует ✅';
    END IF;

    -- Добавляем столбец description если его нет  
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'description'
    ) THEN
        ALTER TABLE events ADD COLUMN description TEXT;
        RAISE NOTICE 'Добавлен столбец description ✅';
    ELSE
        RAISE NOTICE 'Столбец description уже существует ✅';
    END IF;

    -- Добавляем столбец image_url если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE events ADD COLUMN image_url TEXT;
        RAISE NOTICE 'Добавлен столбец image_url ✅';
    ELSE
        RAISE NOTICE 'Столбец image_url уже существует ✅';
    END IF;

    -- Добавляем столбец event_date если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'event_date'
    ) THEN
        ALTER TABLE events ADD COLUMN event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Добавлен столбец event_date ✅';
    ELSE
        RAISE NOTICE 'Столбец event_date уже существует ✅';
    END IF;

    -- Добавляем столбец location если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'location'
    ) THEN
        ALTER TABLE events ADD COLUMN location TEXT;
        RAISE NOTICE 'Добавлен столбец location ✅';
    ELSE
        RAISE NOTICE 'Столбец location уже существует ✅';
    END IF;

    -- Добавляем столбец max_participants если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'max_participants'
    ) THEN
        ALTER TABLE events ADD COLUMN max_participants INTEGER;
        RAISE NOTICE 'Добавлен столбец max_participants ✅';
    ELSE
        RAISE NOTICE 'Столбец max_participants уже существует ✅';
    END IF;

    -- Добавляем столбец current_participants если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'current_participants'
    ) THEN
        ALTER TABLE events ADD COLUMN current_participants INTEGER DEFAULT 0;
        RAISE NOTICE 'Добавлен столбец current_participants ✅';
    ELSE
        RAISE NOTICE 'Столбец current_participants уже существует ✅';
    END IF;

    -- Добавляем столбец price если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'price'
    ) THEN
        ALTER TABLE events ADD COLUMN price DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Добавлен столбец price ✅';
    ELSE
        RAISE NOTICE 'Столбец price уже существует ✅';
    END IF;

    -- Добавляем столбец created_at если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE events ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Добавлен столбец created_at ✅';
    ELSE
        RAISE NOTICE 'Столбец created_at уже существует ✅';
    END IF;

    -- Добавляем столбец updated_at если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE events ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Добавлен столбец updated_at ✅';
    ELSE
        RAISE NOTICE 'Столбец updated_at уже существует ✅';
    END IF;

    -- Добавляем столбец status если его нет
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'status'
    ) THEN
        ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE 'Добавлен столбец status ✅';
    ELSE
        RAISE NOTICE 'Столбец status уже существует ✅';
    END IF;

    RAISE NOTICE 'Обновление таблицы events завершено! 🎉';
END $$;

-- Создаем индексы если их нет
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
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
        RAISE NOTICE 'Создана политика allow_all_events ✅';
    ELSE
        RAISE NOTICE 'Политика allow_all_events уже существует ✅';
    END IF;
END $$;

-- Финальная проверка
SELECT 
    'ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!' as result,
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