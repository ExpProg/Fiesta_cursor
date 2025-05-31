-- Создание bucket для изображений мероприятий
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880, -- 5MB в байтах
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Включаем RLS для storage.objects если не включен
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Политика для публичного просмотра изображений
CREATE POLICY "Public can view event images" ON storage.objects
FOR SELECT USING (bucket_id = 'event-images');

-- Политика для загрузки изображений (публичная, так как у нас нет auth.uid() в Telegram WebApp)
-- В реальном приложении валидация происходит на уровне приложения
CREATE POLICY "Anyone can upload to event-images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'event-images');

-- Политика для удаления изображений (публичная, контроль на уровне приложения)
CREATE POLICY "Anyone can delete from event-images" ON storage.objects
FOR DELETE USING (bucket_id = 'event-images');

-- Политика для обновления изображений (публичная, контроль на уровне приложения)
CREATE POLICY "Anyone can update in event-images" ON storage.objects
FOR UPDATE USING (bucket_id = 'event-images'); 