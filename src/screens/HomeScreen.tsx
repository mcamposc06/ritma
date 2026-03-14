import React, { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Animated, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import { getShadowStyle } from '../utils/styleHelpers';
import { useAuthStore } from '../store/useAuthStore';
import { useHabitStore } from '../store/useHabitStore';
import HabitCard from '../components/HabitCard';
import { DayOfWeek, Habit } from '../types';
import { getLocalDateString, getGreeting } from '../utils/dateHelpers';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainStackParamList, TabParamList } from '../navigation/types';

type HomeScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'Home'>,
    NativeStackNavigationProp<MainStackParamList>
>;

// Map JS getDay() (0=Sun, 1=Mon...) to DayOfWeek enum
const getDayNumberToEnum = (): DayOfWeek => {
    const day = new Date().getDay();
    const map: Record<number, DayOfWeek> = {
        0: 'sunday',
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday',
    };
    return map[day];
};

export default function HomeScreen() {
    const { user } = useAuthStore();
    const { habitsWithCompletion, isLoading, loadHabitsData, toggleHabitCompletion, error, clearError } = useHabitStore();
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const progressAnim = useRef(new Animated.Value(0)).current;
    const [showConfetti, setShowConfetti] = useState(false);
    const hasCelebrated = useRef(false);

    const loadData = useCallback(() => {
        loadHabitsData(getLocalDateString());
    }, [loadHabitsData]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // show errors
    useEffect(() => {
        if (error) {
            Alert.alert('Error', error);
            clearError();
        }
    }, [error, clearError]);

    const handleToggleHabit = async (habitId: string, isCompleted: boolean) => {
        // Trigger haptic feedback
        if (!isCompleted) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.selectionAsync();
        }
        
        await toggleHabitCompletion(habitId, isCompleted, getLocalDateString());
    };

    // Filter habits scheduled for today
    const todaysHabits = useMemo(() => {
        const todayEnum = getDayNumberToEnum();
        return habitsWithCompletion.filter(habit => habit.frequency?.includes(todayEnum));
    }, [habitsWithCompletion]);

    // Calculate progress
    const completedCount = useMemo(() => todaysHabits.filter(h => h.completed_today).length, [todaysHabits]);
    const totalCount = todaysHabits.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Animate progress bar and check for celebration
    useEffect(() => {
        Animated.spring(progressAnim, {
            toValue: totalCount > 0 ? completedCount / totalCount : 0,
            useNativeDriver: false,
            friction: 8,
            tension: 40,
        }).start();

        // Trigger confetti if 100% completed
        if (totalCount > 0 && completedCount === totalCount && !hasCelebrated.current) {
            setShowConfetti(true);
            hasCelebrated.current = true;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            // Reset confetti state after some time
            setTimeout(() => {
                setShowConfetti(false);
            }, 5000);
        } else if (completedCount < totalCount) {
            hasCelebrated.current = false;
        }
    }, [completedCount, totalCount, progressAnim]);

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const greeting = getGreeting();

    return (
        <ScrollView
            style={styles.safeArea}
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={['#3498db']} />
            }
        >
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>{greeting},</Text>
                    <Text style={styles.emailText}>{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'}</Text>
                </View>
            </View>

            {/* Progress Summary Card */}
            {totalCount > 0 && (
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <Text style={styles.progressTitle}>Progreso de Hoy</Text>
                        <Text style={styles.progressPercent}>{progressPercent}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <Animated.View
                            style={[
                                styles.progressBarFill,
                                { width: progressWidth },
                                progressPercent === 100 && styles.progressBarComplete,
                            ]}
                        />
                    </View>
                    <Text style={styles.progressSubtext}>
                        {completedCount} de {totalCount} hábitos completados
                        {progressPercent === 100 ? ' 🎉' : ''}
                    </Text>
                </View>
            )}

            <Text style={styles.sectionTitle}>Tus Hábitos de Hoy</Text>

            {isLoading && todaysHabits.length === 0 ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#3498db" />
                </View>
            ) : todaysHabits.length > 0 ? (
                <View style={styles.habitsList}>
                    {todaysHabits.map((habit) => (
                        <HabitCard
                            key={habit.id}
                            habit={habit}
                            onToggle={handleToggleHabit}
                            onPressDetails={() => navigation.navigate('HabitDetail', { habitId: habit.id })}
                        />
                    ))}
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Nada programado para hoy.</Text>
                    <Text style={styles.emptyStateSubtext}>Tus hábitos para este día aparecerán aquí. ¡Tómate un descanso o crea uno nuevo!</Text>
                </View>
            )}
            
            {showConfetti && (
                <ConfettiCannon
                    count={200}
                    origin={{ x: -10, y: 0 }}
                    fadeOut={true}
                    fallSpeed={3000}
                />
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    container: {
        padding: 24,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a2e'
    },
    emailText: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    progressCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        ...getShadowStyle('#000', 0, 4, 0.06, 10, 3),
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    progressPercent: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#3498db',
    },
    progressBarBg: {
        height: 10,
        backgroundColor: '#e8f0fe',
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 10,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#3498db',
        borderRadius: 5,
    },
    progressBarComplete: {
        backgroundColor: '#2ecc71',
    },
    progressSubtext: {
        fontSize: 13,
        color: '#888',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    centerContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    habitsList: {
        paddingBottom: 20,
    },
    emptyState: {
        backgroundColor: '#fff',
        padding: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 32,
        ...getShadowStyle('#000', 0, 4, 0.05, 10, 2),
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
    }
});
