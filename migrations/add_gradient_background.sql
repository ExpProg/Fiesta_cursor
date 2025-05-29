-- Добавляем поле gradient_background в таблицу events
ALTER TABLE events 
ADD COLUMN gradient_background TEXT DEFAULT NULL;

-- Добавляем комментарий к полю
COMMENT ON COLUMN events.gradient_background IS 'CSS градиент для фона мероприятия если нет изображения';

-- Обновляем существующие события без изображений - добавляем градиенты
UPDATE events 
SET gradient_background = CASE 
  WHEN (id::text || title)::bigint % 15 = 0 THEN 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  WHEN (id::text || title)::bigint % 15 = 1 THEN 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  WHEN (id::text || title)::bigint % 15 = 2 THEN 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  WHEN (id::text || title)::bigint % 15 = 3 THEN 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  WHEN (id::text || title)::bigint % 15 = 4 THEN 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  WHEN (id::text || title)::bigint % 15 = 5 THEN 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
  WHEN (id::text || title)::bigint % 15 = 6 THEN 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
  WHEN (id::text || title)::bigint % 15 = 7 THEN 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)'
  WHEN (id::text || title)::bigint % 15 = 8 THEN 'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)'
  WHEN (id::text || title)::bigint % 15 = 9 THEN 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
  WHEN (id::text || title)::bigint % 15 = 10 THEN 'linear-gradient(135deg, #ff8a80 0%, #ea80fc 100%)'
  WHEN (id::text || title)::bigint % 15 = 11 THEN 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
  WHEN (id::text || title)::bigint % 15 = 12 THEN 'linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)'
  WHEN (id::text || title)::bigint % 15 = 13 THEN 'linear-gradient(135deg, #ffd3a5 0%, #fd9853 100%)'
  WHEN (id::text || title)::bigint % 15 = 14 THEN 'linear-gradient(135deg, #c1dfc4 0%, #deecdd 100%)'
  ELSE 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
END
WHERE image_url IS NULL; 