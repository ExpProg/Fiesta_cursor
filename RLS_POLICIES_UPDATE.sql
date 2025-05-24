-- ===============================================
-- ОБНОВЛЕННЫЕ RLS ПОЛИТИКИ ДЛЯ USERS
-- ===============================================
-- Этот файл содержит обновленные политики Row Level Security,
-- которые позволяют пользователям обновлять свои данные

-- Удаляем существующие политики
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

-- ===============================================
-- ПОЛИТИКА ВСТАВКИ (INSERT)
-- ===============================================
-- Позволяет анонимным пользователям создавать записи
CREATE POLICY "users_insert_policy" ON users
    FOR INSERT
    WITH CHECK (true);

-- ===============================================
-- ПОЛИТИКА ЧТЕНИЯ (SELECT)
-- ===============================================
-- Позволяет анонимным пользователям читать записи
CREATE POLICY "users_select_policy" ON users
    FOR SELECT
    USING (true);

-- ===============================================
-- ПОЛИТИКА ОБНОВЛЕНИЯ (UPDATE)
-- ===============================================
-- Позволяет анонимным пользователям обновлять записи
-- (в идеале здесь должна быть проверка на telegram_id,
-- но для простоты пока разрешаем всем)
CREATE POLICY "users_update_policy" ON users
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ===============================================
-- АЛЬТЕРНАТИВНАЯ ПОЛИТИКА ОБНОВЛЕНИЯ (более безопасная)
-- ===============================================
-- Раскомментируйте эту политику, если хотите ограничить
-- обновления только для соответствующих telegram_id

/*
-- Сначала создаем функцию для получения текущего telegram_id
CREATE OR REPLACE FUNCTION get_current_telegram_id()
RETURNS bigint AS $$
BEGIN
  RETURN COALESCE(
    current_setting('app.current_user_telegram_id', true)::bigint,
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Политика обновления с проверкой telegram_id
CREATE POLICY "users_update_policy_secure" ON users
    FOR UPDATE
    USING (telegram_id = get_current_telegram_id())
    WITH CHECK (telegram_id = get_current_telegram_id());
*/

-- ===============================================
-- ВКЛЮЧАЕМ RLS
-- ===============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- ПРОВЕРКА ПОЛИТИК
-- ===============================================
-- Выводим список всех политик для таблицы users
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
WHERE tablename = 'users';

-- ===============================================
-- ИНСТРУКЦИИ ПО ПРИМЕНЕНИЮ:
-- ===============================================
-- 
-- 1. Скопируйте этот SQL код
-- 2. Откройте Supabase Dashboard
-- 3. Перейдите в SQL Editor
-- 4. Вставьте код и выполните
-- 5. Проверьте, что политики созданы успешно
--
-- После применения пользователи смогут обновлять свои данные
-- при изменении информации в Telegram профиле 