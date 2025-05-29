-- Добавляем поле map_url в таблицу events
ALTER TABLE events 
ADD COLUMN map_url TEXT DEFAULT NULL;

-- Добавляем комментарий к полю
COMMENT ON COLUMN events.map_url IS 'Ссылка на карту (Яндекс.Карты, Google Maps и т.д.)'; 