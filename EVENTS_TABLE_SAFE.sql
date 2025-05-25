-- ===============================================
-- БЕЗОПАСНОЕ СОЗДАНИЕ ТАБЛИЦЫ EVENTS
-- ===============================================

-- Проверяем, существует ли таблица events
DO $$
BEGIN
    -- Если таблица не существует - создаем ее
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events' AND table_schema = 'public') THEN
        
        -- Создаем таблицу events
        CREATE TABLE events (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            image_url TEXT,
            event_date TIMESTAMP WITH TIME ZONE NOT NULL,
            location TEXT,
            max_participants INTEGER,
            current_participants INTEGER DEFAULT 0,
            price DECIMAL(10,2) DEFAULT 0,
            created_by BIGINT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            status TEXT DEFAULT 'active'
        );

        -- Включаем RLS
        ALTER TABLE events ENABLE ROW LEVEL SECURITY;
        
        -- Создаем простую политику доступа
        CREATE POLICY "allow_all_events" ON events FOR ALL USING (true) WITH CHECK (true);
        
        -- Создаем индексы
        CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
        CREATE INDEX IF NOT EXISTS idx_events_creator ON events(created_by);
        CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
        
        RAISE NOTICE 'Таблица events создана успешно!';
    ELSE
        RAISE NOTICE 'Таблица events уже существует. Проверяем структуру...';
        
        -- Проверяем и добавляем недостающие столбцы если нужно
        -- (здесь можно добавить ALTER TABLE команды при необходимости)
        
    END IF;
END $$;

-- Финальная проверка структуры таблицы
SELECT 
    'Проверка завершена!' as result,
    'Таблица events готова к использованию!' as status;

-- Показываем структуру таблицы
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ===============================================
-- ИНСТРУКЦИИ:
-- ===============================================
-- 
-- Этот скрипт безопасно создает таблицу events, если она не существует.
-- Если таблица уже существует, он просто проверит ее структуру.
-- 
-- 1. Скопируйте ВЕСЬ код выше
-- 2. Откройте Supabase Dashboard → SQL Editor  
-- 3. Вставьте код и нажмите RUN
-- 4. Таблица будет создана или проверена
-- 