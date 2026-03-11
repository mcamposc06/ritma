import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';

// Behavior when a notification is received while the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationsService = {
  // Request permissions for notifications
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  },

  // Schedule a daily reminder to complete habits
  async scheduleDailyReminder(hour: number = 20, minute: number = 0): Promise<void> {
    await this.cancelAllReminders(); // Clear existing to avoid duplicates

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "¡Hola! ¿Completaste tus hábitos de hoy?",
        body: "Abre Ritma y registra tu progreso del día para no perder tu racha 🔥",
        sound: true,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: hour,
        minute: minute,
      },
    });
  },

  // Cancel all scheduled notifications
  async cancelAllReminders(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
};
