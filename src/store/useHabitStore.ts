import { create } from 'zustand';
import { Habit, DailyLog, HabitWithCompletion, DayOfWeek } from '../types';
import { habitosService } from '../services/habitosService';

interface HabitState {
  habits: Habit[];
  todayLogs: DailyLog[];
  allLogs: DailyLog[];
  habitsWithCompletion: HabitWithCompletion[];
  stats: { totalHabits: number, totalCompletions: number };
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadHabitsData: (dateString: string) => Promise<void>;
  loadStats: () => Promise<void>;
  createHabit: (title: string, description?: string, frequency?: DayOfWeek[], color_hex?: string) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  toggleHabitCompletion: (habitId: string, isCompleted: boolean, dateString: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  clearError: () => void;
}

const calculateStreak = (habit: Habit, habitLogs: DailyLog[], todayDateString: string): number => {
  if (habitLogs.length === 0) return 0;
  
  if (!habit.frequency || habit.frequency.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date(`${todayDateString}T12:00:00`); // Use midday to avoid timezone shifts

  // Check if there is a log for today
  const hasTodayLog = habitLogs.some(l => l.log_date === todayDateString);
  if (!hasTodayLog) {
     // If no log today, streak check starts from yesterday.
     // (If today is not in frequency, it's fine, we still start looking backwards from yesterday)
     currentDate.setDate(currentDate.getDate() - 1);
  }

  const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as DayOfWeek[];
  const maxLookback = 365;

  for (let i = 0; i < maxLookback; i++) {
     const dateStr = currentDate.toISOString().split('T')[0];
     const dayOfWeek = daysMap[currentDate.getDay()];
     
     if (habit.frequency.includes(dayOfWeek)) {
       const hasLog = habitLogs.some(l => l.log_date === dateStr);
       if (hasLog) {
         streak++;
       } else {
         break; // Missing a required day breaks the streak
       }
     }
     
     currentDate.setDate(currentDate.getDate() - 1);
  }
  return streak;
}

const calculateHabitsWithCompletion = (habits: Habit[], todayLogs: DailyLog[], allLogs: DailyLog[], todayDateString: string): HabitWithCompletion[] => {
  return habits.map(habit => {
    const log = todayLogs.find(l => l.habit_id === habit.id);
    const habitLogs = allLogs.filter(l => l.habit_id === habit.id);
    const streak = calculateStreak(habit, habitLogs, todayDateString);
    
    return {
      ...habit,
      completed_today: !!log,
      daily_log_id: log?.id,
      current_streak: streak
    };
  });
};

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  todayLogs: [],
  allLogs: [],
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
      const [habitsData, allLogsData] = await Promise.all([
        habitosService.getHabits(),
        habitosService.getAllLogs()
      ]);

      const todayLogsData = allLogsData.filter(l => l.log_date === dateString);
      const habitsWithCompletion = calculateHabitsWithCompletion(habitsData, todayLogsData, allLogsData, dateString);

      set({
        habits: habitsData,
        todayLogs: todayLogsData,
        allLogs: allLogsData,
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
      const todayDateString = new Date().toISOString().split('T')[0];
      
      const updatedHabitsWithCompletion = calculateHabitsWithCompletion(
        updatedHabits, get().todayLogs, get().allLogs, todayDateString
      );

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

  updateHabit: async (habitId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedHabit = await habitosService.updateHabit(habitId, updates);
      const updatedHabits = get().habits.map(h => h.id === habitId ? updatedHabit : h);
      const todayDateString = new Date().toISOString().split('T')[0];
      
      const updatedHabitsWithCompletion = calculateHabitsWithCompletion(
        updatedHabits, get().todayLogs, get().allLogs, todayDateString
      );

      set({
        habits: updatedHabits,
        habitsWithCompletion: updatedHabitsWithCompletion,
        isLoading: false
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to update habit', isLoading: false });
      throw error;
    }
  },

  toggleHabitCompletion: async (habitId: string, isCompleted: boolean, dateString: string) => {
    try {
      if (isCompleted) {
        const logToDelete = get().todayLogs.find(l => l.habit_id === habitId);
        if (logToDelete) {
          await habitosService.unmarkHabit(logToDelete.id);
          
          const newTodayLogs = get().todayLogs.filter(l => l.id !== logToDelete.id);
          const newAllLogs = get().allLogs.filter(l => l.id !== logToDelete.id);
          
          set({
            todayLogs: newTodayLogs,
            allLogs: newAllLogs,
            habitsWithCompletion: calculateHabitsWithCompletion(get().habits, newTodayLogs, newAllLogs, dateString)
          });
        }
      } else {
        const newLog = await habitosService.markHabitAsDone(habitId, dateString);
        
        const newTodayLogs = [...get().todayLogs, newLog];
        const newAllLogs = [...get().allLogs, newLog];
        
        set({
          todayLogs: newTodayLogs,
          allLogs: newAllLogs,
          habitsWithCompletion: calculateHabitsWithCompletion(get().habits, newTodayLogs, newAllLogs, dateString)
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
      
      const newHabits = get().habits.filter(h => h.id !== habitId);
      const newTodayLogs = get().todayLogs.filter(l => l.habit_id !== habitId);
      const newAllLogs = get().allLogs.filter(l => l.habit_id !== habitId);
      const todayDateString = new Date().toISOString().split('T')[0];
      
      set({
        habits: newHabits,
        todayLogs: newTodayLogs,
        allLogs: newAllLogs,
        habitsWithCompletion: calculateHabitsWithCompletion(newHabits, newTodayLogs, newAllLogs, todayDateString),
        isLoading: false
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete habit', isLoading: false });
    }
  },

  clearError: () => set({ error: null })
}));
