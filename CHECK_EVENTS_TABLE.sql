-- ===============================================
-- ДИАГНОСТИКА ТАБЛИЦЫ EVENTS
-- ===============================================

-- Проверяем, существует ли таблица events
SELECT 
    CASE 
        WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'events' AND table_schema = 'public')
        THEN 'ТАБЛИЦА СУЩЕСТВУЕТ ✅'
        ELSE 'ТАБЛИЦА НЕ НАЙДЕНА ❌'
    END as table_status;

-- Показываем текущую структуру таблицы events
SELECT 
    'ТЕКУЩИЕ СТОЛБЦЫ ТАБЛИЦЫ EVENTS:' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Проверяем конкретно столбец created_by
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'events' 
            AND table_schema = 'public' 
            AND column_name = 'created_by'
        )
        THEN 'СТОЛБЕЦ created_by НАЙДЕН ✅'
        ELSE 'СТОЛБЕЦ created_by ОТСУТСТВУЕТ ❌'
    END as created_by_status;

-- Список всех столбцов которые должны быть в таблице events
SELECT 
    'ТРЕБУЕМЫЕ СТОЛБЦЫ ДЛЯ EVENTS:' as required_columns;

SELECT UNNEST(ARRAY[
    'id',
    'title', 
    'description',
    'image_url',
    'event_date',
    'location',
    'max_participants',
    'current_participants', 
    'price',
    'created_by',
    'created_at',
    'updated_at',
    'status'
]) as required_column; 