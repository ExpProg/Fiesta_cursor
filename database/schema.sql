-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Удаляем таблицы если они существуют (для переустановки)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Создаем ENUM типы
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('card', 'telegram_stars', 'wallet');

-- Таблица пользователей
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    telegram_id BIGINT NOT NULL UNIQUE,
    username TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    language_code TEXT DEFAULT 'en',
    avatar_url TEXT,
    phone TEXT,
    email TEXT,
    bio TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица событий/вечеринок
CREATE TABLE events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    event_time TIME NOT NULL,
    location TEXT NOT NULL,
    address TEXT,
    coordinates POINT,
    max_guests INTEGER NOT NULL CHECK (max_guests > 0),
    current_guests INTEGER DEFAULT 0 CHECK (current_guests >= 0),
    price_per_person DECIMAL(10,2) NOT NULL CHECK (price_per_person >= 0),
    currency TEXT DEFAULT 'USD',
    image_url TEXT,
    images TEXT[], -- массив дополнительных изображений
    category TEXT,
    tags TEXT[],
    requirements TEXT,
    host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    min_age INTEGER,
    max_age INTEGER,
    dress_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_guest_count CHECK (current_guests <= max_guests),
    CONSTRAINT valid_datetime CHECK (date >= CURRENT_DATE),
    CONSTRAINT valid_age_range CHECK (min_age IS NULL OR max_age IS NULL OR min_age <= max_age)
);

-- Таблица бронирований
CREATE TABLE bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    guests_count INTEGER NOT NULL CHECK (guests_count > 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status booking_status DEFAULT 'pending',
    special_requests TEXT,
    booking_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(event_id, user_id) -- один пользователь может забронировать событие только один раз
);

-- Таблица платежей
CREATE TABLE payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency TEXT DEFAULT 'USD',
    status payment_status DEFAULT 'pending',
    payment_method payment_method NOT NULL,
    
    -- Поля для интеграции с платежными системами
    stripe_payment_intent_id TEXT,
    telegram_payment_charge_id TEXT,
    wallet_transaction_hash TEXT,
    
    -- Метаданные платежа
    payment_data JSONB DEFAULT '{}',
    failure_reason TEXT,
    refund_amount DECIMAL(10,2) DEFAULT 0,
    refunded_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индексы для оптимизации запросов
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_username ON users(username);

CREATE INDEX idx_events_host_id ON events(host_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_location ON events(location);
CREATE INDEX idx_events_active ON events(is_active);
CREATE INDEX idx_events_featured ON events(is_featured);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_tags ON events USING GIN(tags);
CREATE INDEX idx_events_coordinates ON events USING GIST(coordinates);

CREATE INDEX idx_bookings_event_id ON bookings(event_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_code ON bookings(booking_code);

CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_id ON payments(stripe_payment_intent_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для обновления updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Функция для обновления количества гостей при изменении бронирований
CREATE OR REPLACE FUNCTION update_event_guest_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
        UPDATE events 
        SET current_guests = current_guests + NEW.guests_count
        WHERE id = NEW.event_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
            UPDATE events 
            SET current_guests = current_guests + NEW.guests_count
            WHERE id = NEW.event_id;
        ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
            UPDATE events 
            SET current_guests = current_guests - OLD.guests_count
            WHERE id = NEW.event_id;
        ELSIF OLD.status = 'confirmed' AND NEW.status = 'confirmed' AND OLD.guests_count != NEW.guests_count THEN
            UPDATE events 
            SET current_guests = current_guests - OLD.guests_count + NEW.guests_count
            WHERE id = NEW.event_id;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
        UPDATE events 
        SET current_guests = current_guests - OLD.guests_count
        WHERE id = OLD.event_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления количества гостей
CREATE TRIGGER update_event_guest_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_event_guest_count();

-- Функция для автоматического заполнения confirmed_at
CREATE OR REPLACE FUNCTION set_booking_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
            NEW.confirmed_at = NOW();
        ELSIF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
            NEW.cancelled_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для заполнения временных меток бронирования
CREATE TRIGGER set_booking_timestamps_trigger
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION set_booking_timestamps();

-- Включаем Row Level Security для всех таблиц
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS политики для таблицы users
-- Пользователи могут видеть всех пользователей (для отображения хостов событий)
CREATE POLICY "Users can view all users" ON users
    FOR SELECT USING (true);

-- Пользователи могут обновлять только свои данные
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (
        telegram_id = COALESCE(
            (current_setting('app.current_user_telegram_id', true))::bigint,
            0
        )
    );

-- Пользователи могут вставлять только свои данные
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (
        telegram_id = COALESCE(
            (current_setting('app.current_user_telegram_id', true))::bigint,
            0
        )
    );

-- RLS политики для таблицы events
-- Все могут просматривать активные события
CREATE POLICY "Anyone can view active events" ON events
    FOR SELECT USING (is_active = true);

-- Хосты могут просматривать свои события (включая неактивные)
CREATE POLICY "Hosts can view own events" ON events
    FOR SELECT USING (
        host_id IN (
            SELECT id FROM users 
            WHERE telegram_id = COALESCE(
                (current_setting('app.current_user_telegram_id', true))::bigint,
                0
            )
        )
    );

-- Пользователи могут создавать события
CREATE POLICY "Users can create events" ON events
    FOR INSERT WITH CHECK (
        host_id IN (
            SELECT id FROM users 
            WHERE telegram_id = (current_setting('app.current_user_telegram_id', true))::bigint
        )
    );

-- Хосты могут обновлять свои события
CREATE POLICY "Hosts can update own events" ON events
    FOR UPDATE USING (
        host_id IN (
            SELECT id FROM users 
            WHERE telegram_id = (current_setting('app.current_user_telegram_id', true))::bigint
        )
    );

-- Хосты могут удалять свои события
CREATE POLICY "Hosts can delete own events" ON events
    FOR DELETE USING (
        host_id IN (
            SELECT id FROM users 
            WHERE telegram_id = (current_setting('app.current_user_telegram_id', true))::bigint
        )
    );

-- RLS политики для таблицы bookings
-- Пользователи могут видеть свои бронирования
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM users 
            WHERE telegram_id = (current_setting('app.current_user_telegram_id', true))::bigint
        )
    );

-- Хосты могут видеть бронирования своих событий
CREATE POLICY "Hosts can view event bookings" ON bookings
    FOR SELECT USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN users u ON e.host_id = u.id
            WHERE u.telegram_id = (current_setting('app.current_user_telegram_id', true))::bigint
        )
    );

-- Пользователи могут создавать бронирования
CREATE POLICY "Users can create bookings" ON bookings
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM users 
            WHERE telegram_id = (current_setting('app.current_user_telegram_id', true))::bigint
        )
    );

-- Пользователи могут обновлять свои бронирования
CREATE POLICY "Users can update own bookings" ON bookings
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM users 
            WHERE telegram_id = (current_setting('app.current_user_telegram_id', true))::bigint
        )
    );

-- Хосты могут обновлять статус бронирований своих событий
CREATE POLICY "Hosts can update booking status" ON bookings
    FOR UPDATE USING (
        event_id IN (
            SELECT e.id FROM events e
            JOIN users u ON e.host_id = u.id
            WHERE u.telegram_id = (current_setting('app.current_user_telegram_id', true))::bigint
        )
    );

-- RLS политики для таблицы payments
-- Пользователи могут видеть платежи своих бронирований
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (
        booking_id IN (
            SELECT b.id FROM bookings b
            JOIN users u ON b.user_id = u.id
            WHERE u.telegram_id = (current_setting('app.current_user_telegram_id', true))::bigint
        )
    );

-- Хосты могут видеть платежи за свои события
CREATE POLICY "Hosts can view event payments" ON payments
    FOR SELECT USING (
        booking_id IN (
            SELECT b.id FROM bookings b
            JOIN events e ON b.event_id = e.id
            JOIN users u ON e.host_id = u.id
            WHERE u.telegram_id = (current_setting('app.current_user_telegram_id', true))::bigint
        )
    );

-- Система может создавать платежи (для webhook'ов)
CREATE POLICY "System can create payments" ON payments
    FOR INSERT WITH CHECK (true);

-- Система может обновлять статус платежей
CREATE POLICY "System can update payments" ON payments
    FOR UPDATE USING (true);

-- Создаем представления для удобного получения данных
CREATE VIEW events_with_host AS
SELECT 
    e.*,
    u.first_name as host_first_name,
    u.last_name as host_last_name,
    u.username as host_username,
    u.avatar_url as host_avatar_url,
    u.is_verified as host_is_verified
FROM events e
JOIN users u ON e.host_id = u.id;

CREATE VIEW bookings_with_details AS
SELECT 
    b.*,
    e.title as event_title,
    e.date as event_date,
    e.event_time,
    e.location as event_location,
    e.image_url as event_image_url,
    u.first_name as user_first_name,
    u.last_name as user_last_name,
    u.username as user_username,
    u.avatar_url as user_avatar_url,
    host.first_name as host_first_name,
    host.last_name as host_last_name,
    host.username as host_username
FROM bookings b
JOIN events e ON b.event_id = e.id
JOIN users u ON b.user_id = u.id
JOIN users host ON e.host_id = host.id;

-- Функция для поиска событий
CREATE OR REPLACE FUNCTION search_events(
    search_query TEXT DEFAULT '',
    event_date DATE DEFAULT NULL,
    location_filter TEXT DEFAULT '',
    category_filter TEXT DEFAULT '',
    min_price DECIMAL DEFAULT 0,
    max_price DECIMAL DEFAULT 999999,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    date DATE,
    event_time TIME,
    location TEXT,
    max_guests INTEGER,
    current_guests INTEGER,
    price_per_person DECIMAL,
    image_url TEXT,
    category TEXT,
    tags TEXT[],
    host_first_name TEXT,
    host_last_name TEXT,
    host_username TEXT,
    host_avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.date,
        e.event_time,
        e.location,
        e.max_guests,
        e.current_guests,
        e.price_per_person,
        e.image_url,
        e.category,
        e.tags,
        u.first_name,
        u.last_name,
        u.username,
        u.avatar_url,
        e.created_at
    FROM events e
    JOIN users u ON e.host_id = u.id
    WHERE 
        e.is_active = true
        AND (event_date IS NULL OR e.date = event_date)
        AND (location_filter = '' OR e.location ILIKE '%' || location_filter || '%')
        AND (category_filter = '' OR e.category = category_filter)
        AND e.price_per_person BETWEEN min_price AND max_price
        AND (
            search_query = '' OR 
            e.title ILIKE '%' || search_query || '%' OR
            e.description ILIKE '%' || search_query || '%' OR
            e.location ILIKE '%' || search_query || '%' OR
            EXISTS (SELECT 1 FROM unnest(e.tags) AS tag WHERE tag ILIKE '%' || search_query || '%')
        )
    ORDER BY 
        CASE WHEN e.is_featured THEN 0 ELSE 1 END,
        e.date ASC,
        e.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Функция для получения статистики пользователя
CREATE OR REPLACE FUNCTION get_user_stats(user_telegram_id BIGINT)
RETURNS TABLE (
    total_events_hosted INTEGER,
    total_bookings_made INTEGER,
    total_amount_spent DECIMAL,
    total_amount_earned DECIMAL,
    upcoming_events INTEGER,
    upcoming_bookings INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE((
            SELECT COUNT(*)::INTEGER 
            FROM events e 
            JOIN users u ON e.host_id = u.id 
            WHERE u.telegram_id = user_telegram_id
        ), 0),
        COALESCE((
            SELECT COUNT(*)::INTEGER 
            FROM bookings b 
            JOIN users u ON b.user_id = u.id 
            WHERE u.telegram_id = user_telegram_id
        ), 0),
        COALESCE((
            SELECT SUM(b.total_amount) 
            FROM bookings b 
            JOIN users u ON b.user_id = u.id 
            WHERE u.telegram_id = user_telegram_id AND b.status = 'confirmed'
        ), 0),
        COALESCE((
            SELECT SUM(b.total_amount) 
            FROM bookings b 
            JOIN events e ON b.event_id = e.id 
            JOIN users u ON e.host_id = u.id 
            WHERE u.telegram_id = user_telegram_id AND b.status = 'confirmed'
        ), 0),
        COALESCE((
            SELECT COUNT(*)::INTEGER 
            FROM events e 
            JOIN users u ON e.host_id = u.id 
            WHERE u.telegram_id = user_telegram_id 
            AND e.is_active = true 
            AND e.date >= CURRENT_DATE
        ), 0),
        COALESCE((
            SELECT COUNT(*)::INTEGER 
            FROM bookings b 
            JOIN events e ON b.event_id = e.id 
            JOIN users u ON b.user_id = u.id 
            WHERE u.telegram_id = user_telegram_id 
            AND b.status = 'confirmed' 
            AND e.date >= CURRENT_DATE
        ), 0);
END;
$$ LANGUAGE plpgsql; 