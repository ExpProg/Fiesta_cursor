-- Исправление типов данных в оптимизированных функциях
-- Запустите этот скрипт в Supabase SQL Editor для исправления ошибок типов

-- ========================================
-- ИСПРАВЛЕННЫЕ RPC ФУНКЦИИ
-- ========================================

-- Функция для получения событий пользователя (исправленная)
CREATE OR REPLACE FUNCTION get_user_events_optimized(
    user_telegram_id BIGINT,
    events_limit INTEGER DEFAULT 5,
    events_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    image_url TEXT,
    date DATE,
    event_time TIME,
    end_date DATE,
    end_time TIME,
    location TEXT,
    map_url TEXT,
    max_participants INTEGER,
    current_participants INTEGER,
    status TEXT,
    created_by BIGINT,
    host_id UUID,  -- Исправлено: UUID вместо BIGINT
    gradient_background TEXT,
    is_private BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT combined_events.id, combined_events.title, combined_events.description, 
           combined_events.image_url, combined_events.date, combined_events.event_time,
           combined_events.end_date, combined_events.end_time, combined_events.location, 
           combined_events.map_url, combined_events.max_participants,
           combined_events.current_participants, combined_events.status, 
           combined_events.created_by, combined_events.host_id,
           combined_events.gradient_background, combined_events.is_private, 
           combined_events.created_at, combined_events.updated_at
    FROM (
        -- События, на которые пользователь откликнулся
        SELECT DISTINCT e.id, e.title, e.description, e.image_url, e.date, e.event_time,
               e.end_date, e.end_time, e.location, e.map_url, e.max_participants,
               e.current_participants, e.status, e.created_by, e.host_id,
               e.gradient_background, e.is_private, e.created_at, e.updated_at
        FROM events e
        INNER JOIN event_responses er ON e.id = er.event_id
        WHERE er.user_telegram_id = user_telegram_id
          AND er.response_status = 'attending'
          AND e.date >= CURRENT_DATE
          AND e.status = 'active'
        
        UNION
        
        -- Частные события, созданные пользователем
        SELECT e.id, e.title, e.description, e.image_url, e.date, e.event_time,
               e.end_date, e.end_time, e.location, e.map_url, e.max_participants,
               e.current_participants, e.status, e.created_by, e.host_id,
               e.gradient_background, e.is_private, e.created_at, e.updated_at
        FROM events e
        WHERE e.created_by = user_telegram_id
          AND e.is_private = true
          AND e.date >= CURRENT_DATE
          AND e.status = 'active'
    ) AS combined_events
    ORDER BY combined_events.created_at DESC
    LIMIT events_limit OFFSET events_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Функция для получения архива событий пользователя (исправленная)
CREATE OR REPLACE FUNCTION get_user_archive_optimized(
    user_telegram_id BIGINT,
    events_limit INTEGER DEFAULT 5,
    events_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    image_url TEXT,
    date DATE,
    event_time TIME,
    end_date DATE,
    end_time TIME,
    location TEXT,
    map_url TEXT,
    max_participants INTEGER,
    current_participants INTEGER,
    status TEXT,
    created_by BIGINT,
    host_id UUID,  -- Исправлено: UUID вместо BIGINT
    gradient_background TEXT,
    is_private BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT combined_events.id, combined_events.title, combined_events.description, 
           combined_events.image_url, combined_events.date, combined_events.event_time,
           combined_events.end_date, combined_events.end_time, combined_events.location, 
           combined_events.map_url, combined_events.max_participants,
           combined_events.current_participants, combined_events.status, 
           combined_events.created_by, combined_events.host_id,
           combined_events.gradient_background, combined_events.is_private, 
           combined_events.created_at, combined_events.updated_at
    FROM (
        -- Прошедшие события, на которые пользователь откликнулся
        SELECT DISTINCT e.id, e.title, e.description, e.image_url, e.date, e.event_time,
               e.end_date, e.end_time, e.location, e.map_url, e.max_participants,
               e.current_participants, e.status, e.created_by, e.host_id,
               e.gradient_background, e.is_private, e.created_at, e.updated_at
        FROM events e
        INNER JOIN event_responses er ON e.id = er.event_id
        WHERE er.user_telegram_id = user_telegram_id
          AND er.response_status = 'attending'
          AND e.date < CURRENT_DATE
        
        UNION
        
        -- Прошедшие частные события, созданные пользователем
        SELECT e.id, e.title, e.description, e.image_url, e.date, e.event_time,
               e.end_date, e.end_time, e.location, e.map_url, e.max_participants,
               e.current_participants, e.status, e.created_by, e.host_id,
               e.gradient_background, e.is_private, e.created_at, e.updated_at
        FROM events e
        WHERE e.created_by = user_telegram_id
          AND e.is_private = true
          AND e.date < CURRENT_DATE
    ) AS combined_events
    ORDER BY combined_events.created_at DESC
    LIMIT events_limit OFFSET events_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Функция для быстрого получения доступных событий (исправленная)
CREATE OR REPLACE FUNCTION get_available_events_optimized(
    events_limit INTEGER DEFAULT 5,
    events_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    image_url TEXT,
    date DATE,
    event_time TIME,
    end_date DATE,
    end_time TIME,
    location TEXT,
    map_url TEXT,
    max_participants INTEGER,
    current_participants INTEGER,
    status TEXT,
    created_by BIGINT,
    host_id UUID,  -- Исправлено: UUID вместо BIGINT
    gradient_background TEXT,
    is_private BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT e.id, e.title, e.description, e.image_url, e.date, e.event_time,
           e.end_date, e.end_time, e.location, e.map_url, e.max_participants,
           e.current_participants, e.status, e.created_by, e.host_id,
           e.gradient_background, e.is_private, e.created_at, e.updated_at
    FROM events e
    WHERE e.status = 'active'
      AND e.date >= CURRENT_DATE
      AND e.is_private = false
      AND (e.max_participants IS NULL OR e.current_participants < e.max_participants)
    ORDER BY e.created_at DESC
    LIMIT events_limit OFFSET events_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- ========================================
-- ТЕСТ ИСПРАВЛЕННЫХ ФУНКЦИЙ
-- ========================================

-- Тестируем исправленные функции
DO $$
BEGIN
    RAISE NOTICE 'Testing corrected functions...';
    
    -- Тест get_available_events_optimized
    PERFORM get_available_events_optimized(5, 0);
    RAISE NOTICE '✅ get_available_events_optimized - OK';
    
    -- Тест get_user_events_optimized (с тестовым ID)
    PERFORM get_user_events_optimized(123456789, 5, 0);
    RAISE NOTICE '✅ get_user_events_optimized - OK';
    
    -- Тест get_user_archive_optimized (с тестовым ID)
    PERFORM get_user_archive_optimized(123456789, 5, 0);
    RAISE NOTICE '✅ get_user_archive_optimized - OK';
    
    RAISE NOTICE '🎉 All functions are working correctly!';
END $$;

-- ========================================
-- ПРОВЕРКА РЕЗУЛЬТАТА
-- ========================================

SELECT 'FUNCTIONS FIXED' as status,
       'All RPC functions now have correct data types' as message; 