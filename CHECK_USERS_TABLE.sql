-- ===============================================
-- ПРОВЕРКА ТАБЛИЦЫ USERS И СОЗДАНИЕ СВЯЗИ
-- ===============================================

-- Проверяем, существует ли таблица users
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'users' AND table_schema = 'public';

-- Проверяем структуру таблицы users
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Если таблица users существует, добавляем foreign key constraint
-- (Раскомментируйте следующую строку если users таблица существует)
-- ALTER TABLE events ADD CONSTRAINT fk_events_created_by FOREIGN KEY (created_by) REFERENCES users(telegram_id) ON DELETE CASCADE;

-- Альтернативно: создаем таблицу events без foreign key constraint
-- CREATE TABLE IF NOT EXISTS events (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     title VARCHAR(255) NOT NULL,
--     description TEXT,
--     image_url TEXT,
--     event_date TIMESTAMP WITH TIME ZONE NOT NULL,
--     location VARCHAR(500),
--     max_participants INTEGER,
--     current_participants INTEGER DEFAULT 0,
--     price DECIMAL(10,2) DEFAULT 0,
--     created_by BIGINT NOT NULL, -- БЕЗ FOREIGN KEY
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     status VARCHAR(50) DEFAULT 'active'
-- );

-- ===============================================
-- ИНСТРУКЦИИ:
-- ===============================================
-- 
-- 1. Сначала выполните этот скрипт для проверки
-- 2. Если таблица users существует - используйте EVENTS_TABLE_SIMPLE.sql
-- 3. Если таблицы users нет - используйте версию без foreign key выше
-- 