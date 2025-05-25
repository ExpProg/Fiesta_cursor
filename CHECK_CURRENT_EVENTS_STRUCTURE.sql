-- ===============================================
-- ПРОВЕРКА ТЕКУЩЕЙ СТРУКТУРЫ ТАБЛИЦЫ EVENTS
-- ===============================================

-- 1. Проверяем существование таблицы
SELECT 
    'Проверка таблицы events:' as check_info,
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events' AND table_schema = 'public')
        THEN '✅ ТАБЛИЦА СУЩЕСТВУЕТ'
        ELSE '❌ ТАБЛИЦА НЕ НАЙДЕНА'
    END as table_status;

-- 2. Показываем ВСЕ столбцы таблицы
SELECT 
    '📋 ТЕКУЩИЕ СТОЛБЦЫ:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'events' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Проверяем конкретные поля даты
SELECT 
    '📅 ПРОВЕРКА ПОЛЕЙ ДАТЫ:' as date_check;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'date'
        )
        THEN '✅ Поле "date" найдено'
        ELSE '❌ Поле "date" отсутствует'
    END as date_field_status;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'event_date'
        )
        THEN '✅ Поле "event_date" найдено'
        ELSE '❌ Поле "event_date" отсутствует'
    END as event_date_field_status;

-- 4. Проверяем другие важные поля
SELECT 
    '🔍 ПРОВЕРКА КЛЮЧЕВЫХ ПОЛЕЙ:' as key_fields_check;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'created_by'
        )
        THEN '✅ Поле "created_by" найдено'
        ELSE '❌ Поле "created_by" отсутствует'
    END as created_by_status;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'events' AND table_schema = 'public' AND column_name = 'title'
        )
        THEN '✅ Поле "title" найдено'
        ELSE '❌ Поле "title" отсутствует'
    END as title_status;

-- 5. Показываем данные если есть
SELECT 
    '💾 ДАННЫЕ В ТАБЛИЦЕ:' as data_info;

SELECT 
    COUNT(*) as total_events,
    CASE 
        WHEN COUNT(*) = 0 THEN 'Таблица пустая'
        ELSE CONCAT('В таблице ', COUNT(*), ' записей')
    END as status
FROM events;

-- 6. ВЫВОД ДИАГНОСТИКИ
SELECT 
    '🎯 СЛЕДУЮЩИЕ ШАГИ:' as next_steps;

SELECT 
    'Если поле называется "date" - нужно изменить код' as option_1;
    
SELECT 
    'Если поле называется "event_date" - нужно исправить запрос' as option_2; 