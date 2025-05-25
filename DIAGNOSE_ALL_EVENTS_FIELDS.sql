-- ===============================================
-- ПОЛНАЯ ДИАГНОСТИКА ТАБЛИЦЫ EVENTS
-- ===============================================

SELECT 
    '🔍 ДИАГНОСТИКА ТАБЛИЦЫ EVENTS' as info;

-- Показываем ВСЕ поля таблицы events
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Показываем только обязательные поля
SELECT 
    '⚠️ ОБЯЗАТЕЛЬНЫЕ ПОЛЯ (NOT NULL):' as warning;

SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND table_schema = 'public' 
    AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- Проверяем foreign keys
SELECT 
    '🔗 FOREIGN KEYS:' as info;

SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name='events';

-- Показываем индексы
SELECT 
    '📊 ИНДЕКСЫ:' as info;

SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'events' 
    AND schemaname = 'public';

-- Показываем примеры данных (если есть)
SELECT 
    '📋 ПРИМЕР ДАННЫХ:' as info;

SELECT 
    id,
    title,
    date,
    event_time,
    created_by,
    host_id,
    max_guests,
    price_per_person,
    status
FROM events 
LIMIT 3; 