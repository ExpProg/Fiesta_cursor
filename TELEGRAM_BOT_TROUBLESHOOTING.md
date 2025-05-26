# 🔧 Troubleshooting Telegram WebApp

## 🚨 Проблема: "Something went wrong" при открытии ссылки с параметрами

### Симптомы
- Простое приложение открывается в Telegram нормально
- При переходе по ссылке вида `https://t.me/bot?startapp=event_123` показывается "something went wrong"
- Параметры события не передаются в приложение

### Возможные причины

#### 1. Неправильная настройка URL в BotFather

**Проверьте настройки бота:**
1. Откройте @BotFather в Telegram
2. Отправьте `/mybots`
3. Выберите вашего бота
4. Нажмите "Bot Settings" → "Menu Button"
5. **Убедитесь, что URL точно соответствует вашему домену:**
   ```
   ✅ Правильно: https://fiesta-cursor.netlify.app
   ❌ Неправильно: https://fiesta-cursor.netlify.app/
   ❌ Неправильно: http://fiesta-cursor.netlify.app
   ❌ Неправильно: fiesta-cursor.netlify.app
   ```

#### 2. Проблемы с обработкой параметров

**Диагностика параметров:**
1. Откройте: `https://fiesta-cursor.netlify.app/param-test.html`
2. Проверьте, передаются ли параметры в разных секциях
3. Обратите внимание на секцию "Event ID Extraction"

**Ожидаемые результаты:**
- В секции "Parameter Detection" должен быть `start_param: "event_123"`
- В секции "Event ID Extraction" должен быть `finalEventId: "123"`

#### 3. Проблемы с HTTPS/SSL

**Проверьте:**
- URL должен использовать HTTPS (не HTTP)
- Сертификат должен быть валидным
- Нет смешанного контента (mixed content)

### Пошаговая диагностика

#### Шаг 1: Проверьте базовую работу WebApp
```
https://fiesta-cursor.netlify.app/test.html
```
Должно показать: "✅ Telegram WebApp успешно загружен!"

#### Шаг 2: Проверьте передачу параметров
```
https://fiesta-cursor.netlify.app/param-test.html
```
Откройте через ссылку с параметрами и проверьте все секции.

#### Шаг 3: Проверьте настройки бота
1. В @BotFather: `/mybots` → ваш бот → "Bot Settings" → "Menu Button"
2. URL должен быть: `https://fiesta-cursor.netlify.app`
3. Без слэша в конце!

#### Шаг 4: Тестирование с реальными параметрами
Создайте тестовую ссылку:
```
https://t.me/Fiesta_cursor_bot?startapp=event_test123
```

### Решения

#### Решение 1: Исправить URL в BotFather
1. @BotFather → `/mybots` → ваш бот
2. "Bot Settings" → "Menu Button" 
3. Введите точный URL: `https://fiesta-cursor.netlify.app`
4. Сохраните изменения

#### Решение 2: Проверить обработку параметров
Если параметры не передаются, проблема может быть в:
- Неправильном парсинге `initData`
- Отсутствии `start_param` в Telegram WebApp
- Проблемах с кодировкой параметров

#### Решение 3: Альтернативный способ передачи параметров
Если `startapp` не работает, можно использовать обычные URL параметры:
```
https://fiesta-cursor.netlify.app?event=123
```

### Дополнительные инструменты диагностики

#### Консоль браузера
Откройте Developer Tools и проверьте:
```javascript
// Проверка Telegram WebApp
console.log('Telegram:', window.Telegram);
console.log('WebApp:', window.Telegram?.WebApp);
console.log('InitData:', window.Telegram?.WebApp?.initData);
console.log('Start Param:', window.Telegram?.WebApp?.initDataUnsafe?.start_param);
```

#### Логи в приложении
В консоли должны появиться сообщения:
```
🔍 Telegram start param detection: {...}
✅ Event ID extracted from Telegram start param: 123
```

### Частые ошибки

#### ❌ URL с слэшем в конце
```
https://fiesta-cursor.netlify.app/  ← Неправильно
https://fiesta-cursor.netlify.app   ← Правильно
```

#### ❌ HTTP вместо HTTPS
```
http://fiesta-cursor.netlify.app   ← Неправильно
https://fiesta-cursor.netlify.app  ← Правильно
```

#### ❌ Неправильный формат startapp
```
?startapp=123                      ← Неправильно
?startapp=event_123               ← Правильно
```

### Если ничего не помогает

1. **Временное решение**: Используйте обычные URL параметры
   ```
   https://fiesta-cursor.netlify.app?event=123
   ```

2. **Пересоздайте бота**: Иногда помогает создать нового бота в @BotFather

3. **Проверьте региональные ограничения**: В некоторых регионах могут быть ограничения на WebApp

4. **Обратитесь в поддержку Telegram**: Если проблема критическая

### Полезные ссылки

- [Telegram WebApp Documentation](https://core.telegram.org/bots/webapps)
- [BotFather Commands](https://core.telegram.org/bots#6-botfather)
- Диагностические страницы:
  - `/test.html` - базовая проверка WebApp
  - `/param-test.html` - детальная диагностика параметров
  - `/telegram-debug.html` - полная диагностика Telegram интеграции 