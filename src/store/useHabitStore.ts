import { create } from 'zustand';
import { Habit, DailyLog, HabitWithCompletion, DayOfWeek } from '../types';
import { habitosService } from '../services/habitosService';

interface HabitState {
  habits: Habit[];
  todayLogs: DailyLog[];
  habitsWithCompletion: HabitWithCompletion[]; // Calculated state
  stats: { totalHabits: number, totalCompletions: number };
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadHabitsData: (dateString: string) => Promise<void>;
  loadStats: () => Promise<void>;
  createHabit: (title: string, description?: string, frequency?: DayOfWeek[], color_hex?: string) => Promise<void>;
  toggleHabitCompletion: (habitId: string, isCompleted: boolean, dateString: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  clearError: () => void;
}

// Function to calculate habits with their completion status for a specific date
const calculateHabitsWithCompletion = (habits: Habit[], logs: DailyLog[]): HabitWithCompletion[] => {
  return habits.map(habit => {
    // Find if there's a completion log for this habit today
    const log = logs.find(l => l.habit_id === habit.id);
    
    return {
      ...habit,
      completed_today: !!log,
      daily_log_id: log?.id
    };
  });
};

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  todayLogs: [],
  habitsWithCompletion: [],
  stats: { totalHabits: 0, totalCompletions: 0 },
  isLoading: false,
  error: null,

  loadStats: async () => {
    try {
      const stats = await habitosService.getStats();
      set({ stats });
    } catch (error: any) {
      console.error("Failed to load stats", error);
    }
  },

  loadHabitsData: async (dateString: string) => {
    set({ isLoading: true, error: null });
    try {
      // Load both habits and logs concurrently
      const [habitsData, logsData] = await Promise.all([
        habitosService.getHabits(),
        habitosService.getTodayLogs(dateString)
      ]);

      const habitsWithCompletion = calculateHabitsWithCompletion(habitsData, logsData);

      set({
        habits: habitsData,
        todayLogs: logsData,
        habitsWithCompletion,
        isLoading: false
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load habits data', isLoading: false });
    }
  },

  createHabit: async (title, description, frequency, color_hex) => {
    set({ isLoading: true, error: null });
    try {
      const newHabit = await habitosService.createHabit(title, description, frequency, color_hex);
      
      const updatedHabits = [newHabit, ...get().habits];
      const updatedHabitsWithCompletion = calculateHabitsWithCompletion(updatedHabits, get().todayLogs);

      set({
        habits: updatedHabits,
        habitsWithCompletion: updatedHabitsWithCompletion,
        isLoading: false
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to create habit', isLoading: false });
      throw error;
    }
  },

  toggleHabitCompletion: async (habitId: string, isCompleted: boolean, dateString: string) => {
    try {
      if (isCompleted) {
        // Find existing log to delete
        const logToDelete = get().todayLogs.find(l => l.habit_id === habitId);
        if (logToDelete) {
          await habitosService.unmarkHabit(logToDelete.id);
          
          // Update local state by removing the log
          const newLogs = get().todayLogs.filter(l => l.id !== logToDelete.id);
          set({
            todayLogs: newLogs,
            habitsWithCompletion: calculateHabitsWithCompletion(get().habits, newLogs)
          });
        }
      } else {
        // Create new log
        const newLog = await habitosService.markHabitAsDone(habitId, dateString);
        
        // Update local state by adding the log
        const newLogs = [...get().todayLogs, newLog];
        set({
          todayLogs: newLogs,
          habitsWithCompletion: calculateHabitsWithCompletion(get().habits, newLogs)
        });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to toggle habit status' });
    }
  },

  deleteHabit: async (habitId: string) => {
    set({ isLoading: true, error: null });
    try {
      await habitosService.deleteHabit(habitId);
      
      // Update local state
      const newHabits = get().habits.filter(h => h.id !== habitId);
      const newLogs = get().todayLogs.filter(l => l.habit_id !== habitId);
      
      set({
        habits: newHabits,
        todayLogs: newLogs,
        habitsWithCompletion: calculateHabitsWithCompletion(newHabits, newLogs),
        isLoading: false
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete habit', isLoading: false });
    }
  },

  clearError: () => set({ error: null })
}));
