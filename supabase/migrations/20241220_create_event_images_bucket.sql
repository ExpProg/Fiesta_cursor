-- Создание bucket для изображений мероприятий
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880, -- 5MB в байтах
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Политика для загрузки изображений (только авторизованные пользователи)
CREATE POLICY "Users can upload their own images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'event-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Политика для просмотра изображений (публичный доступ)
CREATE POLICY "Public can view event images" ON storage.objects
FOR SELECT USING (bucket_id = 'event-images');

-- Политика для удаления изображений (только владелец)
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'event-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Политика для обновления изображений (только владелец)
CREATE POLICY "Users can update their own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'event-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
); 