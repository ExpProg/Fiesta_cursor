# 🌐 Настройка переменных окружения в Netlify

## Способы настройки переменных

### 1. Через файл netlify.toml (рекомендуется для публичных переменных)

Ваши переменные уже настроены в файле `netlify.toml`:

```toml
[build.environment]
  NODE_VERSION = "18"
  VITE_SUPABASE_URL = "https://xajclkhhskkrgqwzhlnz.supabase.co"
  VITE_SUPABASE_ANON_KEY = "ey..."
  VITE_DEBUG_MODE = "false"
  VITE_TELEGRAM_BOT_USERNAME = "your_real_bot_username"
```

**Для настройки Telegram бота:**
1. Замените `your_real_bot_username` на имя вашего реального бота
2. Например: `VITE_TELEGRAM_BOT_USERNAME = "FiestaEventBot"`
3. Коммитите изменения в Git
4. Netlify автоматически пересоберет проект

### 2. Через веб-интерфейс Netlify (для секретных переменных)

**Пошаговая инструкция:**

1. **Откройте ваш сайт в Netlify**
   - Перейдите на https://app.netlify.com
   - Выберите ваш проект (Fiesta-cursor)

2. **Перейдите в настройки**
   - Нажмите на вкладку **"Site settings"**
   - В левом меню выберите **"Environment variables"**

3. **Добавьте переменную**
   - Нажмите **"Add variable"**
   - **Key**: `VITE_TELEGRAM_BOT_USERNAME`
   - **Value**: имя вашего бота без символа @ (например: `FiestaEventBot`)
   - Выберите **"Same value for all deploy contexts"**
   - Нажмите **"Create variable"**

4. **Пересоберите сайт**
   - Перейдите в **"Deploys"**
   - Нажмите **"Trigger deploy"** → **"Deploy site"**

## Где взять имя Telegram бота

### Если у вас уже есть бот:
1. Откройте чат с вашим ботом в Telegram
2. Посмотрите на его username (после символа @)
3. Используйте это имя без @ символа

### Если нужно создать нового бота:
1. Напишите @BotFather в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям BotFather
4. Получите username бота (например: `FiestaEventBot`)

## Приоритет переменных

Netlify использует следующий приоритет:
1. **Environment variables** (веб-интерфейс) - высший приоритет
2. **netlify.toml** файл - средний приоритет  
3. **.env файлы** - низший приоритет (не работают на Netlify)

## Текущие настройки

Ваши текущие переменные в `netlify.toml`:
- ✅ `VITE_SUPABASE_URL` - настроен
- ✅ `VITE_SUPABASE_ANON_KEY` - настроен  
- ✅ `VITE_DEBUG_MODE` - настроен
- ⚠️ `VITE_TELEGRAM_BOT_USERNAME` - нужно заменить на реальное имя бота

## Проверка настроек

После настройки переменной:

1. **В консоли браузера** на продакшене должно появиться:
   ```
   ✅ Telegram-ссылка скопирована: https://t.me/YourBot?startapp=event_123
   ```
   Вместо:
   ```
   ⚠️ VITE_TELEGRAM_BOT_USERNAME не настроен, используется обычная веб-ссылка
   ```

2. **Кнопка "Скопировать"** будет генерировать Telegram-ссылки

## Troubleshooting

### Переменная не работает
- Убедитесь, что имя начинается с `VITE_`
- Проверьте, что нет опечаток в имени переменной
- Пересоберите сайт после изменений

### Бот не найден
- Убедитесь, что бот существует и активен
- Проверьте, что username указан правильно (без @)
- Убедитесь, что бот настроен как Web App

### Ссылки не работают  
- Проверьте настройки Web App в @BotFather
- Убедитесь, что URL приложения корректный
- Проверьте права доступа бота

## Пример правильной настройки

```toml
# netlify.toml
[build.environment]
  VITE_TELEGRAM_BOT_USERNAME = "FiestaEventBot"
```

Или через веб-интерфейс:
- Key: `VITE_TELEGRAM_BOT_USERNAME`  
- Value: `FiestaEventBot`

После этого ссылки будут вида:
`https://t.me/FiestaEventBot?startapp=event_abc123` 