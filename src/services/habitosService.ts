import { supabase } from './supabase';
import { Habit, DailyLog, DayOfWeek } from '../types';

export const habitosService = {
  // Get all habits for the current user
  async getHabits(): Promise<Habit[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get today's completion logs for the current user
  async getTodayLogs(dateString: string): Promise<DailyLog[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('log_date', dateString);

    if (error) throw error;
    return data || [];
  },

  // Get all historical logs for streak calculation
  async getAllLogs(): Promise<DailyLog[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('log_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create a new habit
  async createHabit(
    title: string,
    description: string | null = null,
    frequency: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    color_hex: string = '#3498db'
  ): Promise<Habit> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('habits')
      .insert([
        {
          user_id: userData.user.id,
          title,
          description,
          frequency,
          color_hex,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update an existing habit
  async updateHabit(
    habitId: string,
    updates: {
      title?: string;
      description?: string | null;
      frequency?: DayOfWeek[];
      color_hex?: string;
    }
  ): Promise<Habit> {
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', habitId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mark a habit as done for a specific date
  async markHabitAsDone(habitId: string, dateString: string): Promise<DailyLog> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('daily_logs')
      .insert([
        {
          habit_id: habitId,
          user_id: userData.user.id,
          log_date: dateString,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Unmark a habit (delete the daily log for a specific date)
  async unmarkHabit(dailyLogId: string): Promise<void> {
    const { error } = await supabase
      .from('daily_logs')
      .delete()
      .eq('id', dailyLogId);

    if (error) throw error;
  },

  // Optional: Delete a habit completely
  async deleteHabit(habitId: string): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId);

    if (error) throw error;
  },

  // Fetch all logs for a specific habit
  async getLogsByHabit(habitId: string): Promise<DailyLog[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userData.user.id)
      .eq('habit_id', habitId)
      .order('log_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Fetch logs in a date range (inclusive)
  async getLogsInRange(startDate: string, endDate: string): Promise<DailyLog[]> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userData.user.id)
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get user overall stats (total habits, total completions)
  async getStats(): Promise<{ totalHabits: number, totalCompletions: number }> {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) throw new Error('User not authenticated');

    const [{ count: habitsCount, error: habitsError }, { count: logsCount, error: logsError }] = await Promise.all([
      supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', userData.user.id),
      supabase.from('daily_logs').select('*', { count: 'exact', head: true }).eq('user_id', userData.user.id)
    ]);

    if (habitsError) throw habitsError;
    if (logsError) throw logsError;

    return {
      totalHabits: habitsCount || 0,
      totalCompletions: logsCount || 0
    };
  }
};
