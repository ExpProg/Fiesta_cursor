-- ===============================================
-- ДОБАВЛЕНИЕ СИСТЕМЫ ОТКЛИКОВ НА МЕРОПРИЯТИЯ
-- ===============================================

-- Создаем ENUM тип для статуса отклика
DO $$ BEGIN
    CREATE TYPE response_status AS ENUM ('attending', 'not_attending', 'maybe');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Создаем таблицу откликов на мероприятия
CREATE TABLE IF NOT EXISTS event_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID NOT NULL,
    user_telegram_id BIGINT NOT NULL,
    user_first_name TEXT NOT NULL,
    user_last_name TEXT,
    user_username TEXT,
    response_status response_status NOT NULL DEFAULT 'attending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Один пользователь может иметь только один отклик на мероприятие
    UNIQUE(event_id, user_telegram_id)
);

-- Создаем индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_event_responses_event_id ON event_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_event_responses_user_id ON event_responses(user_telegram_id);
CREATE INDEX IF NOT EXISTS idx_event_responses_status ON event_responses(response_status);
CREATE INDEX IF NOT EXISTS idx_event_responses_created_at ON event_responses(created_at);

-- Включаем RLS (Row Level Security)
ALTER TABLE event_responses ENABLE ROW LEVEL SECURITY;

-- Политики доступа
CREATE POLICY "event_responses_select_policy" ON event_responses 
    FOR SELECT USING (true);

CREATE POLICY "event_responses_insert_policy" ON event_responses 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "event_responses_update_policy" ON event_responses 
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "event_responses_delete_policy" ON event_responses 
    FOR DELETE USING (true);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_event_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для обновления updated_at
DROP TRIGGER IF EXISTS update_event_responses_updated_at ON event_responses;
CREATE TRIGGER update_event_responses_updated_at
    BEFORE UPDATE ON event_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_event_responses_updated_at();

-- Функция для обновления счетчика участников в таблице events
CREATE OR REPLACE FUNCTION update_event_participants_count()
RETURNS TRIGGER AS $$
BEGIN
    -- При добавлении/изменении отклика
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE events 
        SET current_participants = (
            SELECT COUNT(*) 
            FROM event_responses 
            WHERE event_id = NEW.event_id 
            AND response_status = 'attending'
        )
        WHERE id = NEW.event_id;
        
        RETURN NEW;
    END IF;
    
    -- При удалении отклика
    IF TG_OP = 'DELETE' THEN
        UPDATE events 
        SET current_participants = (
            SELECT COUNT(*) 
            FROM event_responses 
            WHERE event_id = OLD.event_id 
            AND response_status = 'attending'
        )
        WHERE id = OLD.event_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления счетчика участников
DROP TRIGGER IF EXISTS update_participants_on_response_insert ON event_responses;
CREATE TRIGGER update_participants_on_response_insert
    AFTER INSERT ON event_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_event_participants_count();

DROP TRIGGER IF EXISTS update_participants_on_response_update ON event_responses;
CREATE TRIGGER update_participants_on_response_update
    AFTER UPDATE ON event_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_event_participants_count();

DROP TRIGGER IF EXISTS update_participants_on_response_delete ON event_responses;
CREATE TRIGGER update_participants_on_response_delete
    AFTER DELETE ON event_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_event_participants_count();

-- Функция для получения участников мероприятия
CREATE OR REPLACE FUNCTION get_event_participants(p_event_id UUID)
RETURNS TABLE (
    telegram_id BIGINT,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    response_status response_status,
    responded_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        er.user_telegram_id,
        er.user_first_name,
        er.user_last_name,
        er.user_username,
        er.response_status,
        er.created_at
    FROM event_responses er
    WHERE er.event_id = p_event_id
    AND er.response_status = 'attending'
    ORDER BY er.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Функция для получения статуса отклика пользователя
CREATE OR REPLACE FUNCTION get_user_response_status(p_event_id UUID, p_user_telegram_id BIGINT)
RETURNS response_status AS $$
DECLARE
    user_status response_status;
BEGIN
    SELECT response_status INTO user_status
    FROM event_responses
    WHERE event_id = p_event_id
    AND user_telegram_id = p_user_telegram_id;
    
    RETURN user_status;
END;
$$ LANGUAGE plpgsql;

-- Проверяем, что все создано успешно
SELECT 'Система откликов на мероприятия создана успешно!' as result;

-- ===============================================
-- ИНСТРУКЦИИ ПО ПРИМЕНЕНИЮ:
-- ===============================================
-- 
-- 1. Скопируйте этот SQL код
-- 2. Откройте Supabase Dashboard → SQL Editor
-- 3. Вставьте код и выполните
-- 4. Проверьте, что таблица event_responses создана
-- 
-- ИСПОЛЬЗОВАНИЕ:
-- 
-- Добавить отклик:
-- INSERT INTO event_responses (event_id, user_telegram_id, user_first_name, response_status)
-- VALUES ('event-uuid', 123456789, 'Иван', 'attending');
-- 
-- Получить участников:
-- SELECT * FROM get_event_participants('event-uuid');
-- 
-- Проверить статус пользователя:
-- SELECT get_user_response_status('event-uuid', 123456789);
-- 