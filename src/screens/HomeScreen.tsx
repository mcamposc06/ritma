import React, { useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useHabitStore } from '../store/useHabitStore';
import HabitCard from '../components/HabitCard';
import { DayOfWeek } from '../types';

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
    const { habitsWithCompletion, isLoading, loadHabitsData, toggleHabitCompletion } = useHabitStore();

    // Helper to get today's date in YYYY-MM-DD format
    const getTodayString = () => {
        return new Date().toISOString().split('T')[0];
    };

    const loadData = useCallback(() => {
        loadHabitsData(getTodayString());
    }, [loadHabitsData]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleToggleHabit = async (habitId: string, isCompleted: boolean) => {
        await toggleHabitCompletion(habitId, isCompleted, getTodayString());
    };

    // Filter habits scheduled for today
    const todaysHabits = useMemo(() => {
        const todayEnum = getDayNumberToEnum();
        return habitsWithCompletion.filter(habit => habit.frequency?.includes(todayEnum));
    }, [habitsWithCompletion]);

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
                    <Text style={styles.greeting}>Hola,</Text>
                    <Text style={styles.emailText}>{user?.email?.split('@')[0] || 'Usuario'}</Text>
                </View>
            </View>

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
                        />
                    ))}
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Nada programado para hoy.</Text>
                    <Text style={styles.emptyStateSubtext}>Tus hábitos para este día aparecerán aquí. ¡Tómate un descanso o crea uno nuevo!</Text>
                </View>
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
        marginBottom: 32,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
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
