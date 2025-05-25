-- ===============================================
-- БЫСТРОЕ ИСПРАВЛЕНИЕ ПОЛЯ PRICE_PER_PERSON
-- ===============================================

-- Исправляем проблему с обязательным полем price_per_person
DO $$
BEGIN
    RAISE NOTICE 'Исправляем поле price_per_person...';

    -- Проверяем, существует ли поле price_per_person и является ли оно обязательным
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND table_schema = 'public' 
        AND column_name = 'price_per_person'
        AND is_nullable = 'NO'
    ) THEN
        RAISE NOTICE '⚠️ Поле price_per_person обязательное - делаем его необязательным';
        
        -- Делаем поле необязательным
        ALTER TABLE events ALTER COLUMN price_per_person DROP NOT NULL;
        RAISE NOTICE '✅ Поле price_per_person теперь необязательное';
        
    ELSIF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND table_schema = 'public' 
        AND column_name = 'price_per_person'
    ) THEN
        RAISE NOTICE 'ℹ️ Поле price_per_person уже существует и необязательное';
        
    ELSE
        RAISE NOTICE 'ℹ️ Поле price_per_person не существует - создаем как необязательное';
        
        -- Создаем поле как необязательное
        ALTER TABLE events ADD COLUMN price_per_person DECIMAL(10,2);
        RAISE NOTICE '✅ Создано поле price_per_person';
    END IF;

    RAISE NOTICE '🎉 Исправление price_per_person завершено!';
END $$;

-- Проверяем результат
SELECT 
    '✅ ГОТОВО!' as result,
    'Поле price_per_person исправлено' as status;

-- Показываем информацию о поле
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND table_schema = 'public' 
    AND column_name = 'price_per_person'; 