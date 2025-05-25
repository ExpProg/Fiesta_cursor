-- ===============================================
-- ПРОСТАЯ ДИАГНОСТИКА ТАБЛИЦЫ EVENTS
-- ===============================================

-- 1. Проверяем существование таблицы
SELECT 
    '🔍 ТАБЛИЦА EVENTS' as info,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events' AND table_schema = 'public')
        THEN '✅ СУЩЕСТВУЕТ'
        ELSE '❌ НЕ НАЙДЕНА'
    END as table_status;

-- 2. Показываем ВСЕ столбцы 
SELECT 
    '📋 ВСЕ СТОЛБЦЫ ТАБЛИЦЫ:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'events' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Обязательные поля (NOT NULL)
SELECT 
    '⚠️ ОБЯЗАТЕЛЬНЫЕ ПОЛЯ:' as info;

SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND table_schema = 'public' 
    AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 4. Поля даты и времени
SELECT 
    '📅 ПОЛЯ ДАТЫ И ВРЕМЕНИ:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND table_schema = 'public' 
    AND (column_name LIKE '%date%' OR column_name LIKE '%time%')
ORDER BY ordinal_position;

-- 5. Проверяем конкретные поля
SELECT 
    '🔍 ПРОВЕРКА КЛЮЧЕВЫХ ПОЛЕЙ:' as info;

SELECT 
    'created_by' as field_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'created_by'
        ) THEN '✅ НАЙДЕНО'
        ELSE '❌ ОТСУТСТВУЕТ'
    END as status

UNION ALL

SELECT 
    'event_time' as field_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'event_time'
        ) THEN '✅ НАЙДЕНО'
        ELSE '❌ ОТСУТСТВУЕТ'
    END as status

UNION ALL

SELECT 
    'title' as field_name,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'title'
        ) THEN '✅ НАЙДЕНО'
        ELSE '❌ ОТСУТСТВУЕТ'
    END as status;

-- 6. Количество записей
SELECT 
    '💾 ДАННЫЕ В ТАБЛИЦЕ:' as info;

SELECT 
    COUNT(*) as total_records,
    CASE 
        WHEN COUNT(*) = 0 THEN 'Таблица пустая'
        ELSE CONCAT('В таблице ', COUNT(*), ' записей')
    END as status
FROM events;

-- 7. Первые записи (если есть)
SELECT 
    '📄 ПРИМЕРЫ ДАННЫХ:' as info;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM events LIMIT 1) THEN
        RAISE NOTICE 'В таблице есть данные - показываем примеры в следующем запросе';
    ELSE
        RAISE NOTICE 'Таблица пустая - данных нет';
    END IF;
END $$;

-- Показываем примеры только если есть данные
SELECT 
    id,
    title,
    date,
    created_by,
    status
FROM events 
LIMIT 3; 