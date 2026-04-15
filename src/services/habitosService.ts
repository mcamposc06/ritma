import { supabase } from './supabase';
import { Habit, DailyLog, DayOfWeek } from '../types';

const getUserIdOrThrow = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('Sesión no válida. Vuelve a iniciar sesión.');
  }
  return data.user.id;
};

const toFriendlyError = (error: any): Error => {
  if (!error) return new Error('Ocurrió un error inesperado.');
  if (error instanceof Error) return error;

  const code = typeof error.code === 'string' ? error.code : undefined;
  const message = typeof error.message === 'string' ? error.message : 'Ocurrió un error inesperado.';

  // Common Postgres error codes surfaced by PostgREST/Supabase.
  if (code === '23503') {
    return new Error(
      'No se pudo guardar porque falta tu perfil en la base de datos. Intenta cerrar sesión e iniciar sesión nuevamente.'
    );
  }

  if (code === '23505') {
    return new Error('Este registro ya existe.');
  }

  if (code === '42501' || /row[- ]level security/i.test(message)) {
    return new Error(
      'Permisos insuficientes (RLS) para esta acción. Revisa las policies en Supabase.'
    );
  }

  if (code === '42P01' || /does not exist/i.test(message) || /relation .* does not exist/i.test(message)) {
    return new Error(
      'Falta estructura en la base de datos (tablas o tipos). Ejecuta las migraciones de Supabase y vuelve a intentar.'
    );
  }

  return new Error(message);
};

export const habitosService = {
  // Get all habits for the current user
  async getHabits(): Promise<Habit[]> {
    const userId = await getUserIdOrThrow();

    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw toFriendlyError(error);
    return data || [];
  },

  // Get today's completion logs for the current user
  async getTodayLogs(dateString: string): Promise<DailyLog[]> {
    const userId = await getUserIdOrThrow();

    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', dateString);

    if (error) throw toFriendlyError(error);
    return data || [];
  },

  // Get all historical logs for streak calculation
  async getAllLogs(): Promise<DailyLog[]> {
    const userId = await getUserIdOrThrow();

    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false });

    if (error) throw toFriendlyError(error);
    return data || [];
  },

  // Create a new habit
  async createHabit(
    title: string,
    description: string | null = null,
    frequency: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    color_hex: string = '#3498db'
  ): Promise<Habit> {
    const userId = await getUserIdOrThrow();

    const { data, error } = await supabase
      .from('habits')
      .insert([
        {
          user_id: userId,
          title,
          description,
          frequency,
          color_hex,
        },
      ])
      .select()
      .single();

    if (error) throw toFriendlyError(error);
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
    const userId = await getUserIdOrThrow();
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', habitId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw toFriendlyError(error);
    return data;
  },

  // Mark a habit as done for a specific date
  async markHabitAsDone(habitId: string, dateString: string): Promise<DailyLog> {
    const userId = await getUserIdOrThrow();

    const { data, error } = await supabase
      .from('daily_logs')
      .insert([
        {
          habit_id: habitId,
          user_id: userId,
          log_date: dateString,
        },
      ])
      .select()
      .single();

    if (error) {
      // If the log already exists (unique constraint), return it (idempotent behavior).
      if (error.code === '23505') {
        const { data: existing, error: existingError } = await supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', userId)
          .eq('habit_id', habitId)
          .eq('log_date', dateString)
          .single();

        if (!existingError && existing) return existing;
      }
      throw toFriendlyError(error);
    }
    return data;
  },

  // Unmark a habit (delete the daily log for a specific date)
  async unmarkHabit(dailyLogId: string): Promise<void> {
    const userId = await getUserIdOrThrow();
    const { error } = await supabase
      .from('daily_logs')
      .delete()
      .eq('id', dailyLogId)
      .eq('user_id', userId);

    if (error) throw toFriendlyError(error);
  },

  // Optional: Delete a habit completely
  async deleteHabit(habitId: string): Promise<void> {
    const userId = await getUserIdOrThrow();
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);

    if (error) throw toFriendlyError(error);
  },

  // Fetch all logs for a specific habit
  async getLogsByHabit(habitId: string): Promise<DailyLog[]> {
    const userId = await getUserIdOrThrow();

    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .order('log_date', { ascending: false });

    if (error) throw toFriendlyError(error);
    return data || [];
  },

  // Fetch logs in a date range (inclusive)
  async getLogsInRange(startDate: string, endDate: string): Promise<DailyLog[]> {
    const userId = await getUserIdOrThrow();

    const { data, error } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date', { ascending: true });

    if (error) throw toFriendlyError(error);
    return data || [];
  },

  // Get user overall stats (total habits, total completions)
  async getStats(): Promise<{ totalHabits: number, totalCompletions: number }> {
    const userId = await getUserIdOrThrow();

    const [{ count: habitsCount, error: habitsError }, { count: logsCount, error: logsError }] = await Promise.all([
      supabase.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('daily_logs').select('*', { count: 'exact', head: true }).eq('user_id', userId)
    ]);

    if (habitsError) throw toFriendlyError(habitsError);
    if (logsError) throw toFriendlyError(logsError);

    return {
      totalHabits: habitsCount || 0,
      totalCompletions: logsCount || 0
    };
  }
};
