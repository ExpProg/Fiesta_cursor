# Решение проблем с Telegram WebApp

## Проблема: Ссылка не открывается в Telegram

Если ваше приложение не открывается при клике на ссылку в Telegram, проверьте следующие моменты:

### 1. Настройки безопасности (X-Frame-Options)

**Проблема**: Заголовок `X-Frame-Options: DENY` блокирует загрузку приложения в iframe Telegram.

**Решение**: В файле `netlify.toml` измените настройки заголовков:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"  # Вместо "DENY"
    Content-Security-Policy = "frame-ancestors 'self' https://web.telegram.org https://telegram.org"
```

### 2. Настройка бота в BotFather

**Проблема**: Неправильно настроен домен WebApp в BotFather.

**Решение**:
1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Выберите команду `/mybots`
3. Выберите вашего бота
4. Нажмите `Bot Settings` → `Menu Button` → `Configure Menu Button`
5. Укажите правильный URL: `https://ваш-домен.netlify.app`

### 3. HTTPS сертификат

**Проблема**: Telegram WebApp работает только с HTTPS.

**Решение**: Убедитесь, что ваше приложение развернуто на HTTPS (Netlify автоматически предоставляет SSL).

### 4. Мета-теги для Telegram WebApp

**Проблема**: Отсутствуют необходимые мета-теги.

**Решение**: Добавьте в `index.html`:

```html
<meta name="theme-color" content="#0088cc" />
<meta name="color-scheme" content="light dark" />
<meta name="telegram-web-app" content="true" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

### 5. Подключение Telegram WebApp SDK

**Проблема**: Не подключен или неправильно подключен SDK.

**Решение**: Добавьте в `<head>` секцию `index.html`:

```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

## Диагностика проблем

### Использование диагностической страницы

1. Откройте `https://ваш-домен.netlify.app/telegram-debug.html` в браузере
2. Проверьте все параметры на странице диагностики
3. Обратите внимание на:
   - Доступность Telegram API
   - Данные пользователя
   - Параметры URL
   - User Agent

### Проверка в консоли браузера

Откройте Developer Tools (F12) и проверьте:

1. **Console**: Ошибки JavaScript
2. **Network**: Блокированные запросы
3. **Application/Storage**: Доступность localStorage

### Логирование в приложении

В коде добавлено подробное логирование:

```javascript
console.log('🔍 Telegram WebApp Detection:', {
  isInTelegram,
  userAgent: navigator.userAgent,
  referrer: document.referrer,
  location: window.location.href,
  // ... другие параметры
});
```

## Частые проблемы и решения

### 1. "Telegram WebApp не обнаружен"

**Причины**:
- Приложение открыто не через Telegram
- Неправильная настройка бота
- Проблемы с определением Telegram среды

**Решение**:
- Убедитесь, что открываете через кнопку меню бота
- Проверьте настройки бота в BotFather
- Используйте диагностическую страницу

### 2. "Пользователь недоступен"

**Причины**:
- Telegram не передает данные пользователя
- Проблемы с initData

**Решение**:
- Проверьте настройки приватности в Telegram
- Убедитесь, что бот имеет права на получение данных пользователя

### 3. Приложение не адаптируется к теме Telegram

**Причины**:
- Не используются CSS переменные Telegram
- Неправильная инициализация темы

**Решение**:
- Используйте `TelegramThemeAdapter` компонент
- Применяйте CSS переменные `--tg-theme-*`

### 4. Не работают кнопки Telegram (MainButton, BackButton)

**Причины**:
- Неправильная инициализация WebApp
- Версия Telegram не поддерживает функцию

**Решение**:
- Вызовите `WebApp.ready()` и `WebApp.expand()`
- Проверьте версию Telegram WebApp

## Тестирование

### Локальное тестирование

1. Запустите `npm run dev`
2. Используйте ngrok для HTTPS туннеля:
   ```bash
   npx ngrok http 5173
   ```
3. Настройте временный URL в BotFather

### Тестирование на продакшене

1. Деплой на Netlify
2. Обновите URL в BotFather
3. Протестируйте через бота

## Полезные ссылки

- [Telegram WebApp Documentation](https://core.telegram.org/bots/webapps)
- [BotFather](https://t.me/BotFather)
- [Telegram WebApp Examples](https://github.com/telegram-mini-apps)

## Контакты для поддержки

Если проблема не решается:
1. Проверьте логи в консоли браузера
2. Используйте диагностическую страницу
3. Создайте issue с подробным описанием проблемы 