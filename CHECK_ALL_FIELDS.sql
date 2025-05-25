-- ===============================================
-- ПОЛНАЯ ДИАГНОСТИКА ТАБЛИЦЫ EVENTS
-- ===============================================

-- 1. Проверяем существование таблицы
SELECT 
    '🔍 ПРОВЕРКА ТАБЛИЦЫ EVENTS' as info;

-- 2. Показываем ВСЕ столбцы с подробной информацией
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'events' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Проверяем ограничения NOT NULL
SELECT 
    '⚠️ ОБЯЗАТЕЛЬНЫЕ ПОЛЯ (NOT NULL):' as constraints_info;

SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND table_schema = 'public' 
    AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- 4. Проверяем поля связанные с датой и временем
SELECT 
    '📅 ПОЛЯ ДАТЫ И ВРЕМЕНИ:' as datetime_fields;

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

-- 5. Проверяем ограничения таблицы
SELECT 
    '🔒 ОГРАНИЧЕНИЯ ТАБЛИЦЫ:' as table_constraints;

SELECT 
    tc.constraint_name,
    tc.constraint_type,
    ccu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
    ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'events' 
    AND tc.table_schema = 'public'
ORDER BY tc.constraint_type, ccu.column_name;

-- 6. Показываем примеры данных если есть
SELECT 
    '💾 ПРИМЕРЫ ДАННЫХ (первые 3 записи):' as sample_data;

SELECT 
    id,
    title,
    date,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'events' 
            AND table_schema = 'public' 
            AND column_name = 'event_time'
        ) THEN 'event_time field exists'
        ELSE 'event_time field missing'
    END as event_time_status
FROM events 
LIMIT 3;

-- 7. Финальная рекомендация
SELECT 
    '🎯 СЛЕДУЮЩИЕ ШАГИ:' as recommendations; 