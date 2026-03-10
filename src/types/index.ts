export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  frequency: DayOfWeek[];
  color_hex: string;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string; // stored as YYYY-MM-DD
  completed_at: string;
}

// For use in the application components
export interface HabitWithCompletion extends Habit {
  completed_today: boolean;
  daily_log_id?: string;
}
