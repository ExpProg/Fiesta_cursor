# Yandex Metrika Events Documentation

Документация по всем событиям Yandex Metrika в приложении Fiesta.

## Общие события

### Инициализация пользователя
- **user_initialized** - Успешная авторизация пользователя через Telegram
  - `telegram_id` - ID пользователя в Telegram
  - `first_name` - Имя пользователя  
  - `username` - Username пользователя (если есть)
  - `language_code` - Код языка

### Telegram WebApp
- **telegram_webapp_init** - Инициализация в Telegram WebApp
  - `platform` - Платформа Telegram
  - `version` - Версия Telegram

## Навигация по вкладкам

### Переключение вкладок
- **tab_switched** - Переключение между вкладками
  - `from_tab` - Предыдущая вкладка
  - `to_tab` - Новая вкладка
  - `tab_name` - Название новой вкладки

### Загрузка списков
- **events_list_loaded** - Загрузка списка мероприятий
  - `tab` - Активная вкладка
  - `tab_name` - Название вкладки
  - `user_id` - ID пользователя

## События создания мероприятий

### Страница создания
- **create_event_start** - Нажатие кнопки "Создать" в header
- **create_event_page_opened** - Открытие страницы создания мероприятия

### Изменения в форме
- **create_event_form_first_change** - Первое изменение в форме создания

### Отправка формы
- **create_event_form_submit_attempt** - Попытка отправки формы
- **create_event_form_validation_failed** - Ошибка валидации
  - `errors_count` - Количество ошибок
- **create_event_form_submit_failed** - Ошибка отправки
  - `error` - Тип ошибки
- **create_event_form_submit_success** - Успешное создание
  - `event_id` - ID созданного мероприятия
  - `has_image` - Есть ли изображение
  - `has_location` - Есть ли место проведения
  - `has_map_url` - Есть ли ссылка на карту
  - `has_max_participants` - Есть ли ограничение участников
  - `is_private` - Является ли мероприятие частным
  - `invited_users_count` - Количество приглашенных пользователей
- **create_event_form_submit_error** - Ошибка при создании
  - `error` - Текст ошибки

### Загрузка изображений
- **image_upload_attempt** - Попытка загрузки изображения
  - `file_size` - Размер файла в байтах
  - `file_type` - MIME тип файла
  - `user_id` - ID пользователя
- **image_upload_success** - Успешная загрузка изображения
  - `image_url` - URL загруженного изображения
  - `user_id` - ID пользователя
- **image_upload_error** - Ошибка загрузки изображения
  - `error` - Текст ошибки
  - `user_id` - ID пользователя
- **image_remove_attempt** - Попытка удаления изображения
  - `image_url` - URL удаляемого изображения
  - `user_id` - ID пользователя
- **image_remove_success** - Успешное удаление изображения
  - `user_id` - ID пользователя
- **image_remove_error** - Ошибка удаления изображения
  - `error` - Текст ошибки
  - `user_id` - ID пользователя

### Навигация и отмена
- **create_event_back_clicked** - Нажатие кнопки "Назад"
- **create_event_cancel_declined** - Отказ от отмены при наличии изменений
- **create_event_cancelled_with_changes** - Отмена с изменениями
- **create_event_cancelled_no_changes** - Отмена без изменений
- **create_event_form_cancelled** - Нажатие кнопки "Отмена" в форме

### Экран успеха
- **create_event_form_submitted_success** - Успешная отправка формы
  - `event_id` - ID мероприятия
- **create_event_success_create_another** - Создать еще одно мероприятие
- **create_event_success_close** - Закрыть экран успеха

## События редактирования мероприятий

### Страница редактирования
- **edit_event_page_opened** - Открытие страницы редактирования
  - `event_id` - ID мероприятия
  - `event_title` - Название мероприятия (30 символов)

### Изменения в форме
- **edit_event_form_first_change** - Первое изменение в форме
  - `event_id` - ID мероприятия

### Отправка формы
- **edit_event_form_submit_attempt** - Попытка отправки формы
  - `event_id` - ID мероприятия
  - `event_title` - Название мероприятия (30 символов)
- **edit_event_form_validation_failed** - Ошибка валидации
  - `event_id` - ID мероприятия
  - `errors_count` - Количество ошибок
- **edit_event_form_submit_success** - Успешное обновление
  - `event_id` - ID мероприятия
  - `changes_made` - Объект с флагами изменений
- **edit_event_form_submit_error** - Ошибка при обновлении
  - `event_id` - ID мероприятия
  - `error` - Текст ошибки

### Навигация и отмена
- **edit_event_back_clicked** - Нажатие кнопки "Назад"
  - `event_id` - ID мероприятия
- **edit_event_cancel_declined** - Отказ от отмены при наличии изменений
- **edit_event_cancelled_with_changes** - Отмена с изменениями
  - `event_id` - ID мероприятия
- **edit_event_form_cancelled** - Нажатие кнопки "Отмена" в форме
  - `event_id` - ID мероприятия

## События просмотра мероприятий

### Просмотр страницы
- **event_page_viewed** - Просмотр страницы мероприятия
  - `event_id` - ID мероприятия
  - `event_title` - Название мероприятия (30 символов)
  - `is_creator` - Является ли пользователь создателем
  - `has_image` - Есть ли изображение
  - `has_location` - Есть ли место проведения
  - `participant_count` - Количество участников

### Навигация
- **event_view** - Переход к просмотру мероприятия из списка
  - `event_id` - ID мероприятия
  - `event_title` - Название мероприятия (50 символов)
- **event_back_clicked** - Нажатие кнопки "Назад"
  - `event_id` - ID мероприятия

### Действия с мероприятием
- **event_edit_clicked** - Нажатие кнопки "Редактировать"
  - `event_id` - ID мероприятия
  - `event_title` - Название мероприятия (30 символов)
- **event_delete_clicked** - Нажатие кнопки "Удалить"
  - `event_id` - ID мероприятия
  - `event_title` - Название мероприятия (30 символов)
- **event_delete_confirmed** - Подтверждение удаления
  - `event_id` - ID мероприятия
  - `event_title` - Название мероприятия (30 символов)
- **event_delete_cancelled** - Отмена удаления
  - `event_id` - ID мероприятия

## События откликов на мероприятия

### Отклики пользователей
- **event_response** - Отклик пользователя на мероприятие
  - `event_id` - ID мероприятия
  - `response_status` - Статус отклика (attending/not_attending)
  - `event_title` - Название мероприятия (30 символов)

## События участников

### Просмотр участников
- **event_participants_toggle** - Показ/скрытие списка участников
  - `event_id` - ID мероприятия
  - `action` - Действие (show/hide)
  - `participant_count` - Количество участников
  - `attending_count` - Количество идущих
  - `not_attending_count` - Количество не идущих

## События поделиться

### Поделиться мероприятием
- **event_share_clicked** - Нажатие кнопки "Поделиться"
  - `event_id` - ID мероприятия
  - `event_title` - Название мероприятия (30 символов)
  - `share_method` - Метод поделиться
- **event_share_success** - Успешное поделиться
  - `event_id` - ID мероприятия
  - `share_method` - Использованный метод
  - `event_title` - Название мероприятия (30 символов)
- **event_share_failed** - Ошибка поделиться
  - `event_id` - ID мероприятия
  - `error` - Тип ошибки

### Копирование ссылки
- **event_copy_link_clicked** - Нажатие кнопки "Копировать ссылку"
  - `event_id` - ID мероприятия
  - `event_title` - Название мероприятия (30 символов)
  - `link_type` - Тип ссылки (telegram/web)
- **event_copy_link_success** - Успешное копирование
  - `event_id` - ID мероприятия
  - `link_type` - Тип ссылки
  - `event_title` - Название мероприятия (30 символов)
- **event_copy_link_failed** - Ошибка копирования
  - `event_id` - ID мероприятия
  - `error` - Тип ошибки

## События карты

### Клики по карте
- **map_click** - Нажатие кнопки "На карте" в списке мероприятий
  - `event_id` - ID мероприятия
  - `event_title` - Название мероприятия (30 символов)
- **event_location_map_clicked** - Клик по ссылке места на странице мероприятия
  - `event_id` - ID мероприятия
  - `event_title` - Название мероприятия (30 символов)
  - `location` - Место проведения (50 символов)

## События частных мероприятий и приглашений

### Просмотр приглашений
- **invitations_list_loaded** - Загрузка списка приглашений
  - `invitations_count` - Количество приглашений
  - `user_id` - ID пользователя

### Ответы на приглашения
- **invitation_response_attempt** - Попытка ответа на приглашение
  - `invitation_id` - ID приглашения
  - `response` - Тип ответа (accepted/declined)
- **invitation_response_success** - Успешный ответ на приглашение
  - `invitation_id` - ID приглашения
  - `response` - Тип ответа (accepted/declined)
- **invitation_response_error** - Ошибка ответа на приглашение
  - `invitation_id` - ID приглашения
  - `response` - Тип ответа (accepted/declined)
  - `error` - Текст ошибки

### Создание частных мероприятий
- **private_event_create_attempt** - Попытка создания частного мероприятия
  - `invited_users_count` - Количество приглашенных пользователей
- **private_event_invitations_sent** - Приглашения отправлены
  - `event_id` - ID мероприятия
  - `invited_users_count` - Количество приглашений
  - `successful_invitations` - Количество успешных приглашений

## Настройка Yandex Metrika

### Конфигурация
- **Counter ID**: 102291721
- **Функции**: clickmap, trackLinks, accurateTrackBounce, webvisor
- **Интеграция**: React хук `useYandexMetrika`

### Автоматическое обогащение данных
Все события автоматически обогащаются контекстом Telegram WebApp:
- `telegram_platform` - Платформа Telegram
- `telegram_version` - Версия Telegram  
- `is_telegram_webapp` - Флаг Telegram WebApp
- Размеры viewport
- ID пользователя Telegram

### Использование в коде
```typescript
const { reachGoal } = useYandexMetrika();

// Отправка события
reachGoal('event_name', {
  parameter1: 'value1',
  parameter2: 'value2'
});
```

Все события логируются в консоль для отладки и автоматически адаптируются для Telegram WebApp окружения.

## События приглашений (Invitations Events)

### invite_users_request_contact_attempt
**Описание**: Попытка запроса контакта пользователя через Telegram WebApp API  
**Контекст**: Форма создания частного мероприятия, поле приглашенных пользователей  
**Параметры**: нет  

### invite_users_request_contact_success  
**Описание**: Успешный запрос контакта пользователя  
**Контекст**: Пользователь поделился своим контактом для добавления в приглашения  
**Параметры**: нет  

### invite_users_request_contact_failed
**Описание**: Неудачный запрос контакта (пользователь отказался)  
**Контекст**: Пользователь отказался делиться контактом  
**Параметры**: нет  

### invite_users_request_contact_error
**Описание**: Ошибка при запросе контакта  
**Контекст**: Техническая ошибка при выполнении запроса контакта  
**Параметры**: нет  

### invite_users_share_invitation_attempt
**Описание**: Попытка отправки приглашения через Telegram inline query  
**Контекст**: Форма создания частного мероприятия, кнопка "Пригласить из контактов"  
**Параметры**: нет  

### invite_users_share_invitation_success
**Описание**: Успешная инициация отправки приглашения  
**Контекст**: Telegram inline query успешно запущен для выбора контакта  
**Параметры**: нет  

### invite_users_share_invitation_error
**Описание**: Ошибка при попытке отправки приглашения  
**Контекст**: Техническая ошибка при вызове Telegram inline query  
**Параметры**: нет  

### invite_users_link_copied_success
**Описание**: Успешное копирование ссылки-приглашения в буфер обмена  
**Контекст**: Альтернативное решение при недоступности inline-режима  
**Параметры**: нет  

### invite_users_link_shown
**Описание**: Отображение ссылки-приглашения для ручного копирования  
**Контекст**: Fallback при невозможности автоматического копирования  
**Параметры**: нет  

### invitations_list_loaded 

## Основные события

### Навигация по мероприятиям
- `event_view` - Просмотр мероприятия
  - Параметры: `event_id`, `event_title`

### Создание мероприятий
- `event_created` - Мероприятие создано
  - Параметры: `event_id`

### Дэшборд и пользовательское меню
- `user_menu_opened` - Открыто пользовательское меню
- `user_menu_dashboard_clicked` - Клик по дэшборду в меню
- `user_menu_create_event_clicked` - Клик по созданию мероприятия в меню
- `header_dashboard_clicked` - Клик по дэшборду в хедере
- `header_create_event_clicked` - Клик по созданию мероприятия в хедере
- `dashboard_opened` - Открыт дэшборд
  - Параметры: `user_id`
- `dashboard_stats_loaded` - Загружена статистика дэшборда
  - Параметры: `user_id`, `total_events`, `active_events`, `completed_events`
- `dashboard_back_clicked` - Возврат из дэшборда
- `dashboard_create_event_clicked` - Создание мероприятия из дэшборда
- `dashboard_first_event_clicked` - Создание первого мероприятия из пустого состояния
- `dashboard_welcome_create_clicked` - Создание мероприятия из приветственного блока
- `dashboard_to_create_event` - Переход из дэшборда к созданию мероприятия

### Карты
- `map_click` - Клик по кнопке карты
  - Параметры: `event_id`, `event_title`

### Поделиться мероприятием
- `share_event_attempt` - Попытка поделиться мероприятием
  - Параметры: `event_id`, `event_title`, `method`
- `share_event_success` - Успешное поделиться мероприятием
  - Параметры: `event_id`, `event_title`, `method`
- `share_event_error` - Ошибка при попытке поделиться
  - Параметры: `event_id`, `event_title`, `method`, `error`

### Приглашения пользователей
- `invite_users_request_contact_attempt` - Попытка запроса контакта
  - Параметры: `event_id`
- `invite_users_request_contact_success` - Успешный запрос контакта
  - Параметры: `event_id`, `contact_data`
- `invite_users_request_contact_failed` - Неудачный запрос контакта
  - Параметры: `event_id`, `error`
- `invite_users_request_contact_error` - Ошибка запроса контакта
  - Параметры: `event_id`, `error`
- `invite_users_share_invitation_attempt` - Попытка поделиться приглашением
  - Параметры: `event_id`
- `invite_users_share_invitation_success` - Успешное поделиться приглашением
  - Параметры: `event_id`
- `invite_users_share_invitation_error` - Ошибка при поделиться приглашением
  - Параметры: `event_id`, `error`
- `invite_users_link_copied_success` - Ссылка приглашения скопирована
  - Параметры: `event_id`
- `invite_users_link_shown` - Показана ссылка приглашения для ручного копирования
  - Параметры: `event_id`

## Параметры пользователя (userParams)
- `telegram_id` - ID пользователя в Telegram
- `first_name` - Имя пользователя
- `username` - Username пользователя (или 'no_username')
- `language_code` - Код языка пользователя (или 'unknown')

## Примеры использования

```typescript
// Отслеживание открытия дэшборда
reachGoal('dashboard_opened', {
  user_id: currentUserId
});

// Отслеживание загрузки статистики
reachGoal('dashboard_stats_loaded', {
  user_id: currentUserId,
  total_events: events.length,
  active_events: activeEvents.length,
  completed_events: completedEvents.length
});

// Отслеживание действий в пользовательском меню
reachGoal('user_menu_dashboard_clicked');
reachGoal('user_menu_create_event_clicked');
``` 