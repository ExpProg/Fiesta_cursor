-- ===============================================
-- ЧИСТОЕ СОЗДАНИЕ ТАБЛИЦЫ EVENTS (ПОШАГОВО)
-- ===============================================

-- Шаг 1: Удаляем существующие объекты если есть
DROP TABLE IF EXISTS events CASCADE;

-- Шаг 2: Создаем таблицу events (БАЗОВАЯ ВЕРСИЯ)
CREATE TABLE events (
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

-- Шаг 3: Проверяем, что таблица создана
SELECT 'Шаг 3: Таблица создана успешно!' as step_3_result;

-- Шаг 4: Включаем RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Шаг 5: Создаем политики RLS
CREATE POLICY "events_select_policy" ON events FOR SELECT USING (true);

-- Шаг 6: Создаем политику для вставки
CREATE POLICY "events_insert_policy" ON events FOR INSERT WITH CHECK (true);

-- Шаг 7: Создаем политики для обновления и удаления
CREATE POLICY "events_update_policy" ON events FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "events_delete_policy" ON events FOR DELETE USING (true);

-- Шаг 8: Создаем индексы
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_creator ON events(created_by);
CREATE INDEX idx_events_status ON events(status);

-- Шаг 9: Финальная проверка
SELECT 
    'Таблица events создана успешно!' as result,
    'Можно создавать мероприятия!' as status;

-- Проверяем структуру таблицы
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
-- 1. Скопируйте ВЕСЬ код выше
-- 2. Откройте Supabase Dashboard → SQL Editor
-- 3. Вставьте код и нажмите RUN
-- 4. Должно выполниться без ошибок
-- 
-- ВНИМАНИЕ: Этот скрипт УДАЛИТ существующую таблицу events! 