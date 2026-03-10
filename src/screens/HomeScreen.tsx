import React, { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useHabitStore } from '../store/useHabitStore';
import HabitCard from '../components/HabitCard';

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

    // Habits scheduled for today (Simplification: assuming all habits show up every day for MVP, but normally we'd filter by DayOfWeek)
    const todaysHabits = habitsWithCompletion; // If frequency filtering is needed, implement here based on `new Date().getDay()`

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
                    <Text style={styles.emptyStateText}>Aún no tienes hábitos registrados.</Text>
                    <Text style={styles.emptyStateSubtext}>Ve a la pestaña Hábitos para crear uno.</Text>
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
    }
});
