#!/bin/bash

# Скрипт для применения оптимизаций производительности к базе данных Supabase
# Использование: ./apply_optimizations.sh

set -e

echo "🚀 Применение оптимизаций производительности к базе данных..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Проверяем наличие файла оптимизаций
if [ ! -f "performance_optimization.sql" ]; then
    log_error "Файл performance_optimization.sql не найден!"
    exit 1
fi

log_info "Файл оптимизаций найден"

# Проверяем переменные окружения
if [ ! -f ".env.local" ]; then
    log_error "Файл .env.local не найден!"
    exit 1
fi

# Загружаем переменные окружения
source .env.local

if [ -z "$VITE_SUPABASE_URL" ]; then
    log_error "VITE_SUPABASE_URL не установлен в .env.local"
    exit 1
fi

log_info "Переменные окружения загружены"

# Извлекаем project ID из URL
PROJECT_ID=$(echo $VITE_SUPABASE_URL | sed 's/https:\/\/\([^.]*\).*/\1/')
log_info "Project ID: $PROJECT_ID"

echo ""
log_warning "ВАЖНО: Для применения оптимизаций необходимо выполнить SQL скрипт в Supabase Dashboard"
echo ""

echo "📋 Инструкции по применению:"
echo "1. Откройте Supabase Dashboard: https://supabase.com/dashboard/project/$PROJECT_ID"
echo "2. Перейдите в раздел 'SQL Editor'"
echo "3. Создайте новый запрос"
echo "4. Скопируйте и вставьте содержимое файла performance_optimization.sql"
echo "5. Выполните запрос"

echo ""
log_info "Содержимое файла для копирования:"
echo "----------------------------------------"
cat performance_optimization.sql
echo "----------------------------------------"

echo ""
log_warning "После применения SQL скрипта, проверьте результат:"
echo ""

echo "-- Проверка созданных индексов:"
echo "SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';"
echo ""

echo "-- Проверка созданных функций:"
echo "SELECT routine_name, routine_type FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE '%_optimized';"
echo ""

echo "-- Тестирование функций (замените 123456789 на реальный telegram_id):"
echo "SELECT * FROM get_user_events_optimized(123456789, 5);"
echo "SELECT * FROM get_available_events_optimized(5);"

echo ""
log_success "Инструкции подготовлены! Следуйте указаниям выше для применения оптимизаций."

# Проверяем, установлен ли Supabase CLI
if command -v supabase &> /dev/null; then
    echo ""
    log_info "Supabase CLI обнаружен. Альтернативный способ применения:"
    echo "supabase db reset --linked"
    echo "supabase db push"
else
    log_warning "Supabase CLI не установлен. Используйте веб-интерфейс для применения оптимизаций."
fi

echo ""
log_info "🔗 Полезные ссылки:"
echo "   • Supabase Dashboard: https://supabase.com/dashboard/project/$PROJECT_ID"
echo "   • SQL Editor: https://supabase.com/dashboard/project/$PROJECT_ID/sql"
echo "   • Документация: database/PERFORMANCE_OPTIMIZATION.md"

echo ""
log_success "Готово! 🎉" 