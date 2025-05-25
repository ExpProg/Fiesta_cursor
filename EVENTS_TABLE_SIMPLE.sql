-- ===============================================
-- ПРОСТОЕ СОЗДАНИЕ ТАБЛИЦЫ EVENTS
-- ===============================================
-- Упрощенная версия без сложных constraints

-- Создаем таблицу events
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(500),
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active'
);

-- Включаем RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Простые политики RLS
CREATE POLICY "events_select_policy" ON events FOR SELECT USING (true);
CREATE POLICY "events_insert_policy" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "events_update_policy" ON events FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "events_delete_policy" ON events FOR DELETE USING (true);

-- Базовые индексы
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_creator ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Проверяем результат
SELECT 'Таблица events успешно создана!' as result;

-- ===============================================
-- ИНСТРУКЦИИ ПО ПРИМЕНЕНИЮ:
-- ===============================================
-- 
-- 1. Скопируйте этот SQL код
-- 2. Откройте Supabase Dashboard
-- 3. Перейдите в SQL Editor
-- 4. Вставьте код и выполните
-- 5. Если получите ошибку о foreign key - сначала создайте таблицу users
--
-- После применения можно создавать мероприятия через приложение 