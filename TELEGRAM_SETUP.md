# Настройка Telegram Web App

## 🤖 1. Создание Telegram бота

### Создайте бота через @BotFather:
1. Откройте Telegram
2. Найдите @BotFather
3. Отправьте команду `/newbot`
4. Введите название бота (например: "Fiesta Party Bot")
5. Введите username бота (например: "fiesta_party_bot")
6. **Сохраните токен бота** - он понадобится позже

### Настройте веб-приложение:
1. В чате с @BotFather отправьте `/newapp`
2. Выберите вашего бота
3. Введите название приложения: "Fiesta"
4. Введите описание: "Party booking app"
5. Загрузите иконку 512x512px (PNG)
6. **Введите URL вашего приложения** (пока оставьте пустым, заполним позже)

## 🌐 2. Получение публичного URL

Поскольку Telegram требует HTTPS, нужно сделать localhost доступным извне.

### Вариант A: Используйте ngrok (быстро для тестирования)
```bash
# Установите ngrok
brew install ngrok

# Запустите туннель к вашему localhost:5173
ngrok http 5173
```
Скопируйте HTTPS URL (например: https://abc123.ngrok.io)

### Вариант B: Деплой на Vercel (для постоянного использования)
```bash
# Установите Vercel CLI
npm i -g vercel

# Деплой приложения
vercel --prod
```

## 🔧 3. Настройка Web App URL

1. Вернитесь к @BotFather
2. Отправьте `/myapps`
3. Выберите ваше приложение
4. Нажмите "Edit Web App URL"
5. Вставьте ваш HTTPS URL (ngrok или Vercel)

## 📱 4. Тестирование

### Создайте меню с Web App:
1. В @BotFather отправьте `/mybots`
2. Выберите вашего бота
3. Bot Settings → Menu Button
4. Введите текст кнопки: "🎉 Open Fiesta"
5. Введите ваш Web App URL

### Протестируйте:
1. Найдите вашего бота в Telegram
2. Нажмите кнопку "🎉 Open Fiesta"
3. Приложение должно открыться внутри Telegram

## ⚙️ 5. Дополнительные команды для бота

Добавьте команды через @BotFather:
```
/mybots → Выберите бота → Edit Commands

start - Начать использование
party - Найти вечеринки
create - Создать событие
profile - Мой профиль
help - Помощь
```

## 🔐 6. Настройка переменных окружения

Добавьте в .env.local:
```env
VITE_TELEGRAM_BOT_TOKEN=your_bot_token_here
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
```

## 🛠️ 7. Режим разработки

Для разработки используйте ngrok:
```bash
# Терминал 1: Запустите приложение
npm run dev

# Терминал 2: Запустите ngrok
ngrok http 5173
```

Обновляйте URL в @BotFather каждый раз при перезапуске ngrok.

## 🚀 8. Продакшн деплой

Для финального деплоя рекомендуется:
- **Vercel** (бесплатно, автоматический деплой)
- **Netlify** (бесплатно)
- **GitHub Pages** (для статических сайтов) 