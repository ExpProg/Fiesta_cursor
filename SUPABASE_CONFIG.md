# Настройка Supabase

## 🔑 Где найти VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY

### 1. Откройте Supabase Dashboard
- Перейдите на [supabase.com](https://supabase.com)
- Войдите в свой аккаунт
- Выберите ваш проект (или создайте новый)

### 2. Найдите настройки API
- В боковом меню слева найдите **"Settings"** (⚙️)
- Нажмите на **"API"**

### 3. Скопируйте параметры
В разделе **"Project Configuration"** вы найдете:

```
Project URL: https://your-project-ref.supabase.co
```

```
Project API keys:
anon public: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## 📝 Создайте файл .env.local

В корне проекта создайте файл `.env.local`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### ⚠️ Важно:
- Замените `your-project-ref` на ваш реальный project reference
- Замените ключ на ваш реальный **anon public** ключ (НЕ service_role!)
- Файл `.env.local` автоматически игнорируется Git'ом

## 🔄 Перезапустите проект

После создания `.env.local`:

```bash
npm run dev
```

## ✅ Проверка

Если всё настроено правильно, вы увидите в консоли браузера:
```
Supabase client initialized successfully
```

## 🛠️ Если возникают ошибки

1. **Убедитесь**, что файл называется именно `.env.local`
2. **Проверьте**, что нет лишних пробелов в URL и ключе
3. **Перезапустите** dev server после изменения .env файла 