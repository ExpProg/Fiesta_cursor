# 🎉 Fiesta - Telegram WebApp для бронирования вечеринок

Современное веб-приложение для поиска и бронирования вечеринок, интегрированное с Telegram.

## 🚀 Технологии

- **React 18** - для создания пользовательского интерфейса
- **TypeScript** - для типизации и безопасности кода
- **Tailwind CSS** - для стилизации
- **Vite** - для быстрой разработки и сборки
- **@telegram-apps/sdk** - для интеграции с Telegram WebApp
- **Supabase** - для базы данных и аутентификации
- **React Hook Form + Zod** - для работы с формами и валидации

## 📁 Структура проекта

```
src/
├── components/          # React компоненты
│   └── ui/             # Переиспользуемые UI компоненты
├── hooks/              # Пользовательские хуки
├── services/           # Сервисы для работы с API
├── types/              # TypeScript типы
├── utils/              # Вспомогательные функции
├── App.tsx             # Главный компонент приложения
├── main.tsx            # Точка входа
└── index.css           # Глобальные стили
```

## ⚙️ Установка и запуск

1. **Клонируйте репозиторий:**
   ```bash
   git clone <repository-url>
   cd fiesta-telegram-webapp
   ```

2. **Установите зависимости:**
   ```bash
   npm install
   ```

3. **Настройте переменные окружения:**
   Создайте файл `.env` на основе `.env.example`:
   ```bash
   cp .env.example .env
   ```
   
   Заполните следующие переменные:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Запустите проект в режиме разработки:**
   ```bash
   npm run dev
   ```

5. **Соберите проект для продакшена:**
   ```bash
   npm run build
   ```

## 🗄️ Настройка базы данных

Создайте следующие таблицы в Supabase:

### Таблица `users`
```sql
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT,
  language_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Таблица `parties`
```sql
CREATE TABLE parties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  location TEXT NOT NULL,
  max_guests INTEGER NOT NULL,
  current_guests INTEGER DEFAULT 0,
  price_per_person DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  host_id UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Таблица `bookings`
```sql
CREATE TABLE bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  party_id UUID REFERENCES parties(id),
  user_id UUID REFERENCES users(id),
  guests_count INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Интеграция с Telegram

1. **Создайте Telegram бота** через [@BotFather](https://t.me/BotFather)
2. **Настройте WebApp** командой `/newapp`
3. **Укажите URL** вашего развернутого приложения
4. **Настройте меню бота** с кнопкой для запуска WebApp

## 🎨 Особенности дизайна

- Адаптивный дизайн для мобильных устройств
- Поддержка темной и светлой темы Telegram
- Использование цветовой схемы Telegram
- Оптимизация для WebApp интерфейса

## 📱 Функциональность

- **Просмотр вечеринок** - список доступных событий
- **Бронирование** - возможность забронировать место
- **Управление бронированиями** - просмотр и отмена бронирований
- **Профиль пользователя** - настройки аккаунта
- **Поиск и фильтрация** - поиск событий по параметрам

## 🔒 Безопасность

- Валидация данных на клиенте и сервере
- Защита от XSS и других атак
- Безопасное хранение токенов
- Проверка подлинности Telegram данных

## 🚀 Развертывание

Приложение можно развернуть на любой платформе, поддерживающей статические сайты:

- **Vercel** (рекомендуется)
- **Netlify**
- **GitHub Pages**
- **Firebase Hosting**

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🤝 Содействие

Приветствуются Pull Request'ы и Issue'ы! Пожалуйста, ознакомьтесь с [руководством по содействию](CONTRIBUTING.md) перед началом работы.

## 📞 Поддержка

Если у вас возникли вопросы или проблемы, создайте Issue в этом репозитории. 