-- Скрипт для проверки производительности базы данных
-- Запустите этот скрипт в Supabase SQL Editor для диагностики

-- ========================================
-- ПРОВЕРКА ИНДЕКСОВ
-- ========================================

-- Проверяем существование оптимизационных индексов
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('events', 'event_responses')
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ========================================
-- ПРОВЕРКА RPC ФУНКЦИЙ
-- ========================================

-- Проверяем существование оптимизированных функций
SELECT 
    routine_name,
    routine_type,
    created
FROM information_schema.routines 
WHERE routine_name LIKE '%_optimized'
    AND routine_schema = 'public'
ORDER BY routine_name;

-- ========================================
-- ТЕСТИРОВАНИЕ ПРОИЗВОДИТЕЛЬНОСТИ
-- ========================================

-- Тест 1: Простой запрос всех событий
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM events 
ORDER BY created_at DESC 
LIMIT 5;

-- Тест 2: Запрос активных событий
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM events 
WHERE status = 'active' 
    AND date >= CURRENT_DATE 
ORDER BY created_at DESC 
LIMIT 5;

-- Тест 3: Проверка оптимизированной функции (если существует)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_available_events_optimized') THEN
        RAISE NOTICE 'Testing optimized function...';
        PERFORM get_available_events_optimized(5, 0);
    ELSE
        RAISE NOTICE 'Optimized function not found - using legacy queries';
    END IF;
END $$;

-- ========================================
-- СТАТИСТИКА ТАБЛИЦ
-- ========================================

-- Размеры таблиц
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_stat_get_tuples_returned(c.oid) as tuples_returned,
    pg_stat_get_tuples_fetched(c.oid) as tuples_fetched
FROM pg_tables pt
JOIN pg_class c ON c.relname = pt.tablename
WHERE tablename IN ('events', 'event_responses')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Статистика использования индексов
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes 
WHERE tablename IN ('events', 'event_responses')
ORDER BY idx_scan DESC;

-- ========================================
-- РЕКОМЕНДАЦИИ
-- ========================================

SELECT 'PERFORMANCE CHECK COMPLETED' as status,
       CASE 
           WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_events_status_date') 
           THEN '✅ Optimized indexes found'
           ELSE '❌ Missing optimized indexes - run performance_optimization.sql'
       END as index_status,
       CASE 
           WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_available_events_optimized') 
           THEN '✅ Optimized functions found'
           ELSE '❌ Missing optimized functions - run performance_optimization.sql'
       END as function_status; 