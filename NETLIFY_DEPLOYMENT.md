# 🚀 Netlify Deployment Guide

## Автоматический деплой настроен!

Проект автоматически деплоится на Netlify при каждом push в ветку `main`.

## 🔧 Настройка переменных окружения

### Метод 1: Через netlify.toml (Уже настроено)

Переменные окружения уже добавлены в файл `netlify.toml`:

```toml
[build.environment]
  NODE_VERSION = "18"
  VITE_SUPABASE_URL = "https://xajclkhhskkrgqwzhlnz.supabase.co"
  VITE_SUPABASE_ANON_KEY = "ваш_ключ_здесь"
  VITE_DEBUG_MODE = "false"
```

### Метод 2: Через Netlify Dashboard (Альтернативный способ)

1. Откройте ваш сайт в панели Netlify
2. Перейдите в **Site Settings** → **Environment Variables**
3. Добавьте следующие переменные:

| Переменная | Значение |
|------------|----------|
| `VITE_SUPABASE_URL` | `https://xajclkhhskkrgqwzhlnz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `VITE_DEBUG_MODE` | `false` |

### Метод 3: Через Netlify CLI

```bash
# Установите Netlify CLI
npm install -g netlify-cli

# Войдите в аккаунт
netlify login

# Установите переменные окружения
netlify env:set VITE_SUPABASE_URL "https://xajclkhhskkrgqwzhlnz.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your_anon_key_here"
netlify env:set VITE_DEBUG_MODE "false"
```

## 🔍 Проверка переменных окружения

После деплоя можете проверить переменные окружения на странице:
`https://your-site.netlify.app/src/test-env.html`

## 🛠️ Troubleshooting

### Ошибка: "Supabase URL и Anon Key должны быть определены"

**Причина:** Переменные окружения не загружаются при сборке

**Решение:**
1. Проверьте, что переменные добавлены в netlify.toml
2. Убедитесь, что имена переменных точно совпадают (с префиксом `VITE_`)
3. Проверьте, что нет лишних пробелов в значениях
4. Пересоберите проект

### Принудительная пересборка

```bash
# Пуш с пустым коммитом для trigger rebuild
git commit --allow-empty -m "trigger netlify rebuild"
git push origin main
```

## 📝 Процесс деплоя

1. **Git Push** → GitHub Repository
2. **Webhook** → Netlify получает уведомление
3. **Build** → `npm install` + `npm run build`
4. **Deploy** → Размещение `dist/` папки на CDN
5. **Live** → Сайт доступен по URL

## 🔒 Безопасность

- ✅ Anon Key безопасен для клиентского кода
- ✅ Права доступа ограничены Row Level Security (RLS)
- ❌ НИКОГДА не используйте service_role ключ в клиентском коде

## 📊 Мониторинг

- **Build logs:** Netlify Dashboard → Deploys
- **Function logs:** Netlify Dashboard → Functions
- **Site analytics:** Netlify Dashboard → Analytics 