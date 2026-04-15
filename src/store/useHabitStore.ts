import { create } from 'zustand';
import { Habit, DailyLog, HabitWithCompletion, DayOfWeek } from '../types';
import { habitosService } from '../services/habitosService';
import { getLocalDateString } from '../utils/dateHelpers';

interface HabitState {
  habits: Habit[];
  todayLogs: DailyLog[];
  allLogs: DailyLog[];
  habitsWithCompletion: HabitWithCompletion[];
  stats: { totalHabits: number; totalCompletions: number; bestStreak: number; weeklyRate: number };
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadHabitsData: (dateString: string) => Promise<void>;
  loadStats: () => Promise<void>;
  createHabit: (title: string, description?: string, frequency?: DayOfWeek[], color_hex?: string) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  toggleHabitCompletion: (habitId: string, isCompleted: boolean, dateString: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  deleteLog: (dailyLogId: string) => Promise<void>;
  reset: () => void;
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
     currentDate.setDate(currentDate.getDate() - 1);
  }

  const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as DayOfWeek[];
  const maxLookback = 365;

  for (let i = 0; i < maxLookback; i++) {
     const dateStr = getLocalDateString(currentDate);
     const dayOfWeek = daysMap[currentDate.getDay()];
     
     if (habit.frequency.includes(dayOfWeek)) {
       const hasLog = habitLogs.some(l => l.log_date === dateStr);
       if (hasLog) {
         streak++;
       } else {
         break;
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

// Calculate advanced stats from local data
const calculateAdvancedStats = (habits: Habit[], allLogs: DailyLog[], todayDateString: string) => {
  const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as DayOfWeek[];
  
  // Best streak across all habits
  let bestStreak = 0;
  for (const habit of habits) {
    const habitLogs = allLogs.filter(l => l.habit_id === habit.id);
    const streak = calculateStreak(habit, habitLogs, todayDateString);
    if (streak > bestStreak) bestStreak = streak;
  }
  
  // Weekly completion rate (last 7 days)
  let expectedCount = 0;
  let completedCount = 0;
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(`${todayDateString}T12:00:00`);
    d.setDate(d.getDate() - i);
    const dateStr = getLocalDateString(d);
    const dayOfWeek = daysMap[d.getDay()];
    
    for (const habit of habits) {
      if (habit.frequency?.includes(dayOfWeek)) {
        expectedCount++;
        const hasLog = allLogs.some(l => l.habit_id === habit.id && l.log_date === dateStr);
        if (hasLog) completedCount++;
      }
    }
  }
  
  const weeklyRate = expectedCount > 0 ? Math.round((completedCount / expectedCount) * 100) : 0;
  
  return { bestStreak, weeklyRate };
};

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  todayLogs: [],
  allLogs: [],
  habitsWithCompletion: [],
  stats: { totalHabits: 0, totalCompletions: 0, bestStreak: 0, weeklyRate: 0 },
  isLoading: false,
  error: null,

  loadStats: async () => {
    try {
      const baseStats = await habitosService.getStats();
      const todayDateString = getLocalDateString();
      const { bestStreak, weeklyRate } = calculateAdvancedStats(get().habits, get().allLogs, todayDateString);
      set({ stats: { ...baseStats, bestStreak, weeklyRate } });
    } catch (error: any) {
      console.error("Failed to load stats", error);
      set({ error: error?.message || 'No se pudieron cargar las estadísticas' });
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

      // keep statistics up to date after loading fresh data
      await get().loadStats();
    } catch (error: any) {
      set({ error: error.message || 'Failed to load habits data', isLoading: false });
    }
  },

  createHabit: async (title, description, frequency, color_hex) => {
    set({ isLoading: true, error: null });
    try {
      const newHabit = await habitosService.createHabit(title, description, frequency, color_hex);
      const updatedHabits = [newHabit, ...get().habits];
      const todayDateString = getLocalDateString();
      
      const updatedHabitsWithCompletion = calculateHabitsWithCompletion(
        updatedHabits, get().todayLogs, get().allLogs, todayDateString
      );

      set({
        habits: updatedHabits,
        habitsWithCompletion: updatedHabitsWithCompletion,
        isLoading: false
      });

      // after mutating data refresh stats
      await get().loadStats();
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
      const todayDateString = getLocalDateString();
      
      const updatedHabitsWithCompletion = calculateHabitsWithCompletion(
        updatedHabits, get().todayLogs, get().allLogs, todayDateString
      );

      set({
        habits: updatedHabits,
        habitsWithCompletion: updatedHabitsWithCompletion,
        isLoading: false
      });

      await get().loadStats();
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
      // refresh stats after completion toggle
      await get().loadStats();
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
      const todayDateString = getLocalDateString();
      
      set({
        habits: newHabits,
        todayLogs: newTodayLogs,
        allLogs: newAllLogs,
        habitsWithCompletion: calculateHabitsWithCompletion(newHabits, newTodayLogs, newAllLogs, todayDateString),
        isLoading: false
      });

      await get().loadStats();
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete habit', isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  // reset everything (useful on sign out)
  reset: () => set({
      habits: [],
      todayLogs: [],
      allLogs: [],
      habitsWithCompletion: [],
      stats: { totalHabits: 0, totalCompletions: 0, bestStreak: 0, weeklyRate: 0 },
      isLoading: false,
      error: null
  }),

  // remove a specific daily log and update derived data
  deleteLog: async (dailyLogId: string) => {
    try {
      await habitosService.unmarkHabit(dailyLogId);
      const newTodayLogs = get().todayLogs.filter(l => l.id !== dailyLogId);
      const newAllLogs = get().allLogs.filter(l => l.id !== dailyLogId);
      const todayDateString = getLocalDateString();

      set({
        todayLogs: newTodayLogs,
        allLogs: newAllLogs,
        habitsWithCompletion: calculateHabitsWithCompletion(get().habits, newTodayLogs, newAllLogs, todayDateString)
      });

      await get().loadStats();
    } catch (error: any) {
      set({ error: error.message || 'Failed to remove log' });
    }
  }
}));
