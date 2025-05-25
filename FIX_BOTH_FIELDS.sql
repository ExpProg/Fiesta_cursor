-- ===============================================
-- БЫСТРОЕ ИСПРАВЛЕНИЕ ПОЛЕЙ MAX_GUESTS И PRICE_PER_PERSON
-- ===============================================

-- Исправляем проблемы с обязательными полями
DO $$
BEGIN
    RAISE NOTICE 'Исправляем поля max_guests и price_per_person...';

    -- 1. Исправляем поле max_guests
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND table_schema = 'public' 
        AND column_name = 'max_guests'
        AND is_nullable = 'NO'
    ) THEN
        RAISE NOTICE '⚠️ Поле max_guests обязательное - делаем его необязательным';
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
        ALTER TABLE events ADD COLUMN max_guests INTEGER;
        RAISE NOTICE '✅ Создано поле max_guests';
    END IF;

    -- 2. Исправляем поле price_per_person
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'events' 
        AND table_schema = 'public' 
        AND column_name = 'price_per_person'
        AND is_nullable = 'NO'
    ) THEN
        RAISE NOTICE '⚠️ Поле price_per_person обязательное - делаем его необязательным';
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
        ALTER TABLE events ADD COLUMN price_per_person DECIMAL(10,2);
        RAISE NOTICE '✅ Создано поле price_per_person';
    END IF;

    RAISE NOTICE '🎉 Исправление всех полей завершено!';
END $$;

-- Проверяем результат
SELECT 
    '✅ ГОТОВО!' as result,
    'Поля max_guests и price_per_person исправлены' as status;

-- Показываем информацию о полях
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND table_schema = 'public' 
    AND column_name IN ('max_guests', 'price_per_person')
ORDER BY column_name; 