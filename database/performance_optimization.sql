-- Оптимизация производительности для EventsList
-- Этот файл содержит индексы и функции для ускорения загрузки событий

-- ========================================
-- СОСТАВНЫЕ ИНДЕКСЫ ДЛЯ ОПТИМИЗАЦИИ ЗАПРОСОВ
-- ========================================

-- Индекс для быстрого поиска активных событий по дате
CREATE INDEX IF NOT EXISTS idx_events_status_date 
ON events(status, date) 
WHERE status = 'active';

-- Индекс для быстрого поиска событий пользователя
CREATE INDEX IF NOT EXISTS idx_events_created_by_private_date 
ON events(created_by, is_private, date);

-- Индекс для быстрого поиска откликов пользователя
CREATE INDEX IF NOT EXISTS idx_event_responses_user_status 
ON event_responses(user_telegram_id, response_status);

-- Составной индекс для event_responses с event_id
CREATE INDEX IF NOT EXISTS idx_event_responses_user_status_event 
ON event_responses(user_telegram_id, response_status, event_id);

-- Индекс для быстрого поиска по дате и статусу
CREATE INDEX IF NOT EXISTS idx_events_date_status 
ON events(date, status);

-- ========================================
-- ОПТИМИЗИРОВАННЫЕ RPC ФУНКЦИИ
-- ========================================

-- Функция для получения событий пользователя (оптимизированная)
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
    host_id BIGINT,
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

-- Функция для получения архива событий пользователя (оптимизированная)
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
    host_id BIGINT,
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

-- ========================================
-- ДОПОЛНИТЕЛЬНЫЕ ОПТИМИЗАЦИИ
-- ========================================

-- Функция для быстрого получения доступных событий
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
    host_id BIGINT,
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
-- СТАТИСТИКА И МОНИТОРИНГ
-- ========================================

-- Функция для получения статистики использования индексов
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE (
    schemaname TEXT,
    tablename TEXT,
    indexname TEXT,
    idx_scan BIGINT,
    idx_tup_read BIGINT,
    idx_tup_fetch BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::TEXT,
        s.tablename::TEXT,
        s.indexname::TEXT,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch
    FROM pg_stat_user_indexes s
    WHERE s.schemaname = 'public'
      AND s.tablename IN ('events', 'event_responses')
    ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ========================================
-- КОММЕНТАРИИ ДЛЯ ДОКУМЕНТАЦИИ
-- ========================================

COMMENT ON FUNCTION get_user_events_optimized(BIGINT, INTEGER, INTEGER) IS 
'Оптимизированная функция для получения событий пользователя с использованием UNION и составных индексов';

COMMENT ON FUNCTION get_user_archive_optimized(BIGINT, INTEGER, INTEGER) IS 
'Оптимизированная функция для получения архива событий пользователя';

COMMENT ON FUNCTION get_available_events_optimized(INTEGER, INTEGER) IS 
'Оптимизированная функция для получения доступных событий';

COMMENT ON INDEX idx_events_status_date IS 
'Составной индекс для быстрого поиска активных событий по дате';

COMMENT ON INDEX idx_events_created_by_private_date IS 
'Составной индекс для быстрого поиска событий пользователя';

COMMENT ON INDEX idx_event_responses_user_status IS 
'Составной индекс для быстрого поиска откликов пользователя'; 