-- ===============================================
-- ПРОВЕРКА НАСТРОЙКИ СИСТЕМЫ ОТКЛИКОВ
-- ===============================================

-- Проверяем, существует ли таблица event_responses
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'event_responses';

-- Проверяем структуру таблицы event_responses
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'event_responses'
ORDER BY ordinal_position;

-- Проверяем существование ENUM типа response_status
SELECT 
    t.typname,
    e.enumlabel
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'response_status'
ORDER BY e.enumsortorder;

-- Проверяем существование триггеров
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'event_responses'
ORDER BY trigger_name;

-- Проверяем существование функций
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'update_event_participants_count',
    'update_event_responses_updated_at',
    'get_event_participants',
    'get_user_response_status'
)
ORDER BY routine_name;

-- Проверяем политики RLS для event_responses
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'event_responses';

-- Проверяем индексы
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'event_responses'
ORDER BY indexname;

-- Тестовый запрос - получаем несколько записей из events для проверки
SELECT 
    id,
    title,
    current_participants,
    max_participants,
    created_by,
    status
FROM events 
WHERE status = 'active'
LIMIT 3;

-- Проверяем есть ли записи в event_responses
SELECT 
    COUNT(*) as total_responses,
    response_status,
    COUNT(*) FILTER (WHERE response_status = 'attending') as attending_count
FROM event_responses 
GROUP BY response_status;

SELECT 'Проверка завершена! Проанализируйте результаты выше.' as result; 