-- ===============================================
-- БЫСТРОЕ ИСПРАВЛЕНИЕ ПОЛЯ MAX_GUESTS
-- ===============================================

-- Исправляем проблему с обязательным полем max_guests
DO $$
BEGIN
    RAISE NOTICE 'Исправляем поле max_guests...';

    -- Проверяем, существует ли поле max_guests и является ли оно обязательным
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND table_schema = 'public' 
        AND column_name = 'max_guests'
        AND is_nullable = 'NO'
    ) THEN
        RAISE NOTICE '⚠️ Поле max_guests обязательное - делаем его необязательным';
        
        -- Делаем поле необязательным
        ALTER TABLE events ALTER COLUMN max_guests DROP NOT NULL;
        RAISE NOTICE '✅ Поле max_guests теперь необязательное';
        
    ELSIF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND table_schema = 'public' 
        AND column_name = 'max_guests'
    ) THEN
        RAISE NOTICE 'ℹ️ Поле max_guests уже существует и необязательное';
        
    ELSE
        RAISE NOTICE 'ℹ️ Поле max_guests не существует - создаем как необязательное';
        
        -- Создаем поле как необязательное
        ALTER TABLE events ADD COLUMN max_guests INTEGER;
        RAISE NOTICE '✅ Создано поле max_guests';
    END IF;

    RAISE NOTICE '🎉 Исправление max_guests завершено!';
END $$;

-- Проверяем результат
SELECT 
    '✅ ГОТОВО!' as result,
    'Поле max_guests исправлено' as status;

-- Показываем информацию о поле
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND table_schema = 'public' 
    AND column_name = 'max_guests'; 