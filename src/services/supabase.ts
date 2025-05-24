import { createClient } from '@supabase/supabase-js';
import type { User, Party, Booking, BookingFormData, PartyFormData } from '@/types';

// В продакшене эти значения должны быть в переменных окружения
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Сервис для работы с пользователями
export const userService = {
  async getOrCreateUser(telegramUser: any): Promise<User> {
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramUser.id)
      .single();

    if (existingUser) {
      return existingUser;
    }

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        telegram_id: telegramUser.id,
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        language_code: telegramUser.language_code,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return newUser;
  },

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data;
  },
};

// Сервис для работы с вечеринками
export const partyService = {
  async getParties(): Promise<Party[]> {
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('is_active', true)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch parties: ${error.message}`);
    }

    return data || [];
  },

  async getParty(id: string): Promise<Party> {
    const { data, error } = await supabase
      .from('parties')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Failed to fetch party: ${error.message}`);
    }

    return data;
  },

  async createParty(partyData: PartyFormData, hostId: string): Promise<Party> {
    const { data, error } = await supabase
      .from('parties')
      .insert({
        ...partyData,
        host_id: hostId,
        current_guests: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create party: ${error.message}`);
    }

    return data;
  },

  async updateParty(id: string, updates: Partial<Party>): Promise<Party> {
    const { data, error } = await supabase
      .from('parties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update party: ${error.message}`);
    }

    return data;
  },
};

// Сервис для работы с бронированиями
export const bookingService = {
  async getUserBookings(userId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, parties(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }

    return data || [];
  },

  async createBooking(partyId: string, userId: string, bookingData: BookingFormData): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        party_id: partyId,
        user_id: userId,
        guests_count: bookingData.guests_count,
        total_amount: 0, // Будет рассчитано в триггере базы данных
        status: 'pending',
        special_requests: bookingData.special_requests,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create booking: ${error.message}`);
    }

    return data;
  },

  async updateBookingStatus(bookingId: string, status: string): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update booking: ${error.message}`);
    }

    return data;
  },

  async cancelBooking(bookingId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) {
      throw new Error(`Failed to cancel booking: ${error.message}`);
    }
  },
}; 