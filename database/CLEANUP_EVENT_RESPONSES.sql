-- ===============================================
-- ОЧИСТКА СИСТЕМЫ ОТКЛИКОВ НА МЕРОПРИЯТИЯ
-- (Используйте только если нужно начать заново)
-- ===============================================

-- ⚠️  ВНИМАНИЕ: Этот скрипт удалит ВСЕ данные откликов!
-- Используйте только если хотите полностью переустановить систему

-- Удаляем триггеры
DROP TRIGGER IF EXISTS update_participants_on_response_insert ON event_responses;
DROP TRIGGER IF EXISTS update_participants_on_response_update ON event_responses;
DROP TRIGGER IF EXISTS update_participants_on_response_delete ON event_responses;
DROP TRIGGER IF EXISTS update_event_responses_updated_at ON event_responses;

-- Удаляем функции
DROP FUNCTION IF EXISTS update_event_participants_count();
DROP FUNCTION IF EXISTS update_event_responses_updated_at();
DROP FUNCTION IF EXISTS get_event_participants(UUID);
DROP FUNCTION IF EXISTS get_user_response_status(UUID, BIGINT);

-- Удаляем политики RLS
DROP POLICY IF EXISTS "event_responses_select_policy" ON event_responses;
DROP POLICY IF EXISTS "event_responses_insert_policy" ON event_responses;
DROP POLICY IF EXISTS "event_responses_update_policy" ON event_responses;
DROP POLICY IF EXISTS "event_responses_delete_policy" ON event_responses;

-- Удаляем таблицу (со всеми данными!)
DROP TABLE IF EXISTS event_responses;

-- Удаляем ENUM тип
DROP TYPE IF EXISTS response_status;

-- Сбрасываем счетчик участников в таблице events
UPDATE events SET current_participants = 0;

SELECT 'Система откликов полностью удалена. Теперь выполните ADD_EVENT_RESPONSES_SAFE.sql' as result; 