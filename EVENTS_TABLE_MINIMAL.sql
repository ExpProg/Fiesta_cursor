-- ===============================================
-- МИНИМАЛЬНАЯ ВЕРСИЯ - ТОЛЬКО ТАБЛИЦА
-- ===============================================

-- Удаляем если есть
DROP TABLE IF EXISTS events;

-- Создаем минимальную таблицу
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active'
);

-- Простые политики доступа
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON events FOR ALL USING (true) WITH CHECK (true);

-- Проверка
SELECT 'Минимальная таблица создана!' as result; 