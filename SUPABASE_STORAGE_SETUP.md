# Настройка Supabase Storage для изображений

Этот документ описывает настройку Supabase Storage для загрузки и хранения изображений мероприятий.

## Автоматическая настройка

Приложение автоматически создает необходимый bucket при первом использовании функции загрузки изображений. Если автоматическая настройка не работает, выполните ручную настройку.

## Ручная настройка

### 1. Создание bucket

В Supabase Dashboard перейдите в раздел **Storage** и создайте новый bucket:

```sql
-- Выполните в SQL Editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880, -- 5MB в байтах
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);
```

### 2. Настройка политик безопасности

Создайте политики для управления доступом к изображениям:

```sql
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
```

### 3. Применение миграции

Если используете миграции Supabase, выполните:

```bash
supabase db push
```

Или примените миграцию вручную:

```bash
supabase db reset
```

## Структура хранения

Изображения сохраняются в следующей структуре:

```
event-images/
├── {user_id}/
│   ├── {timestamp}_{random}.jpg
│   ├── {timestamp}_{random}.png
│   └── {timestamp}_{random}.webp
```

Где:
- `{user_id}` - Telegram ID пользователя
- `{timestamp}` - Unix timestamp загрузки
- `{random}` - Случайная строка для уникальности

## Ограничения

- **Максимальный размер файла**: 5MB
- **Поддерживаемые форматы**: JPEG, PNG, WebP
- **Доступ**: Публичное чтение, загрузка только для владельца
- **Удаление**: Только владелец может удалить свои изображения

## Безопасность

1. **Аутентификация**: Загрузка требует авторизации через Telegram
2. **Изоляция пользователей**: Каждый пользователь может управлять только своими изображениями
3. **Валидация файлов**: Проверка типа и размера файла на клиенте и сервере
4. **Публичный доступ**: Изображения доступны для просмотра всем (для отображения в мероприятиях)

## Мониторинг

Для мониторинга использования Storage:

1. Перейдите в **Supabase Dashboard → Storage**
2. Выберите bucket `event-images`
3. Просмотрите статистику использования

## Очистка

Для очистки неиспользуемых изображений можно создать функцию:

```sql
-- Функция для удаления изображений удаленных мероприятий
CREATE OR REPLACE FUNCTION cleanup_unused_images()
RETURNS void AS $$
BEGIN
  -- Удаляем файлы изображений, которые не используются в мероприятиях
  DELETE FROM storage.objects 
  WHERE bucket_id = 'event-images' 
  AND name NOT IN (
    SELECT SUBSTRING(image_url FROM '.*/([^/]+)$') 
    FROM events 
    WHERE image_url IS NOT NULL 
    AND image_url LIKE '%supabase%'
  );
END;
$$ LANGUAGE plpgsql;
```

## Troubleshooting

### Ошибка "Bucket not found"
- Убедитесь, что bucket создан
- Проверьте правильность имени bucket в коде

### Ошибка "Permission denied"
- Проверьте политики безопасности
- Убедитесь, что пользователь авторизован

### Ошибка "File too large"
- Проверьте размер файла (максимум 5MB)
- Убедитесь, что `file_size_limit` установлен правильно

### Ошибка "Invalid file type"
- Проверьте, что файл имеет поддерживаемый формат
- Убедитесь, что `allowed_mime_types` настроены правильно 