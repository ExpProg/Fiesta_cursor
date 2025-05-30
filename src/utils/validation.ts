import { z } from 'zod';


// Схема валидации для создания вечеринки
export const partyFormSchema = z.object({
  title: z
    .string()
    .min(3, 'Название должно содержать не менее 3 символов')
    .max(100, 'Название не должно превышать 100 символов'),
  description: z
    .string()
    .min(10, 'Описание должно содержать не менее 10 символов')
    .max(1000, 'Описание не должно превышать 1000 символов'),
  date: z
    .string()
    .refine((date: string) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, 'Дата не может быть в прошлом'),
  time: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Некорректный формат времени'),
  location: z
    .string()
    .min(5, 'Адрес должен содержать не менее 5 символов')
    .max(200, 'Адрес не должен превышать 200 символов'),
  max_participants: z
    .number()
    .min(2, 'Минимальное количество участников - 2')
    .max(100, 'Максимальное количество участников - 100')
    .optional(),
  image_url: z
    .string()
    .url('Некорректный URL изображения')
    .optional()
    .or(z.literal('')),
});

// Схема валидации профиля пользователя
export const userProfileSchema = z.object({
  first_name: z
    .string()
    .min(1, 'Имя обязательно')
    .max(50, 'Имя не должно превышать 50 символов'),
  last_name: z
    .string()
    .max(50, 'Фамилия не должна превышать 50 символов')
    .optional(),
  username: z
    .string()
    .max(32, 'Имя пользователя не должно превышать 32 символа')
    .optional(),
});

// Типы для форм на основе схем

export type PartyFormData = z.infer<typeof partyFormSchema>;
export type UserProfileData = z.infer<typeof userProfileSchema>; 