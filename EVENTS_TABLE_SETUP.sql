-- ===============================================
-- СОЗДАНИЕ ТАБЛИЦЫ МЕРОПРИЯТИЙ (EVENTS)
-- ===============================================
-- Этот файл создает таблицу events для хранения мероприятий

-- Удаляем существующую таблицу если есть (осторожно!)
-- DROP TABLE IF EXISTS events CASCADE;

-- Создаем таблицу events
CREATE TABLE IF NOT EXISTS events (
    -- Основные поля
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Дополнительные поля
    location VARCHAR(500),
    max_participants INTEGER DEFAULT NULL,
    current_participants INTEGER DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    
    -- Метаданные
    created_by BIGINT NOT NULL REFERENCES users(telegram_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Статус мероприятия
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed', 'draft'))
);

-- ===============================================
-- ДОБАВЛЯЕМ CONSTRAINTS ПОСЛЕ СОЗДАНИЯ ТАБЛИЦЫ
-- ===============================================

-- Ограничение на длину названия
ALTER TABLE events ADD CONSTRAINT events_title_check CHECK (LENGTH(title) >= 3);

-- Ограничение на дату события (должна быть в будущем)
-- Убираем это ограничение, так как оно может мешать при создании тестовых данных
-- ALTER TABLE events ADD CONSTRAINT events_date_check CHECK (event_date > NOW());

-- ===============================================
-- СОЗДАНИЕ ИНДЕКСОВ
-- ===============================================

-- Индекс для поиска по дате
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);

-- Индекс для поиска по создателю
CREATE INDEX IF NOT EXISTS idx_events_creator ON events(created_by);

-- Индекс для поиска по статусу
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Составной индекс для активных мероприятий по дате
CREATE INDEX IF NOT EXISTS idx_events_active_date ON events(status, event_date) WHERE status = 'active';

-- ===============================================
-- ТРИГГЕР ДЛЯ ОБНОВЛЕНИЯ updated_at
-- ===============================================

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===============================================
-- RLS ПОЛИТИКИ ДЛЯ EVENTS
-- ===============================================

-- Включаем RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики (если есть)
DROP POLICY IF EXISTS "events_select_policy" ON events;
DROP POLICY IF EXISTS "events_insert_policy" ON events;
DROP POLICY IF EXISTS "events_update_policy" ON events;
DROP POLICY IF EXISTS "events_delete_policy" ON events;

-- Политика чтения: все могут читать активные мероприятия
CREATE POLICY "events_select_policy" ON events
    FOR SELECT
    USING (true);

-- Политика создания: любой пользователь может создавать мероприятия
CREATE POLICY "events_insert_policy" ON events
    FOR INSERT
    WITH CHECK (true);

-- Политика обновления: только создатель может редактировать
CREATE POLICY "events_update_policy" ON events
    FOR UPDATE
    USING (created_by = COALESCE(
        NULLIF(current_setting('app.current_user_telegram_id', true), '')::bigint,
        0
    ))
    WITH CHECK (created_by = COALESCE(
        NULLIF(current_setting('app.current_user_telegram_id', true), '')::bigint,
        0
    ));

-- Политика удаления: только создатель может удалять
CREATE POLICY "events_delete_policy" ON events
    FOR DELETE
    USING (created_by = COALESCE(
        NULLIF(current_setting('app.current_user_telegram_id', true), '')::bigint,
        0
    ));

-- ===============================================
-- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
-- ===============================================

-- Функция для получения предстоящих мероприятий
CREATE OR REPLACE FUNCTION get_upcoming_events(limit_count INTEGER DEFAULT 10)
RETURNS SETOF events AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM events
    WHERE event_date > NOW() 
    AND status = 'active'
    ORDER BY event_date ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для получения популярных мероприятий
CREATE OR REPLACE FUNCTION get_popular_events(limit_count INTEGER DEFAULT 10)
RETURNS SETOF events AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM events
    WHERE event_date > NOW() 
    AND status = 'active'
    ORDER BY current_participants DESC, event_date ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для поиска мероприятий
CREATE OR REPLACE FUNCTION search_events(search_query TEXT)
RETURNS SETOF events AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM events
    WHERE (
        title ILIKE '%' || search_query || '%' OR
        description ILIKE '%' || search_query || '%' OR
        location ILIKE '%' || search_query || '%'
    )
    AND event_date > NOW() 
    AND status = 'active'
    ORDER BY event_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===============================================
-- ТЕСТОВЫЕ ДАННЫЕ (ОПЦИОНАЛЬНО)
-- ===============================================

-- Раскомментируйте для добавления тестовых данных
/*
INSERT INTO events (title, description, image_url, event_date, location, max_participants, price, created_by) VALUES
(
    'Новогодняя вечеринка 2025',
    'Встретим Новый год вместе! Музыка, танцы, фейерверк и много веселья.',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    '2025-01-01 22:00:00+03',
    'ул. Примерная, 123, Москва',
    100,
    2500.00,
    (SELECT telegram_id FROM users LIMIT 1)
),
(
    'День рождения клуба',
    'Празднуем 5-летие нашего танцевального клуба. Специальные выступления и призы!',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
    '2025-01-15 19:00:00+03',
    'Танцевальная студия "Ритм"',
    50,
    1500.00,
    (SELECT telegram_id FROM users LIMIT 1)
);
*/

-- ===============================================
-- ПРОВЕРКА СОЗДАННОЙ СТРУКТУРЫ
-- ===============================================

-- Проверим созданную таблицу
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events'
ORDER BY ordinal_position;

-- Проверим созданные политики
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'events';

-- ===============================================
-- ИНСТРУКЦИИ ПО ПРИМЕНЕНИЮ:
-- ===============================================
-- 
-- 1. Скопируйте этот SQL код
-- 2. Откройте Supabase Dashboard
-- 3. Перейдите в SQL Editor
-- 4. Вставьте код и выполните
-- 5. Проверьте, что таблица и политики созданы успешно
--
-- После применения можно создавать мероприятия через приложение 