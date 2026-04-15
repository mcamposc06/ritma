import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../navigation/types';
import { useHabitStore } from '../store/useHabitStore';
import { DayOfWeek } from '../types';
import { getLocalDateString } from '../utils/dateHelpers';
import { getShadowStyle } from '../utils/styleHelpers';
import { useAppTheme } from '../utils/theme';

type HabitDetailRouteProp = RouteProp<MainStackParamList, 'HabitDetail'>;

const { width: windowWidth } = Dimensions.get('window');
const MAX_CONTENT_WIDTH = 600;
const COLUMN_COUNT = 7;
const CALENDAR_GAP = 8;
const CONTENT_PADDING = 24;

const MONTHS_ES = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
];

// Calculate cell size but cap it to avoid huge circles on web
const availableWidth = Math.min(windowWidth, MAX_CONTENT_WIDTH) - (CONTENT_PADDING * 2) - 40; // 40 for container padding
const CELL_SIZE = Math.min(42, (availableWidth - (COLUMN_COUNT - 1) * CALENDAR_GAP) / COLUMN_COUNT);
const GRID_WIDTH = (CELL_SIZE * COLUMN_COUNT) + (CALENDAR_GAP * (COLUMN_COUNT - 1));

export default function HabitDetailScreen() {
    const navigation = useNavigation();
    const route = useRoute<HabitDetailRouteProp>();
    const { habitId } = route.params;
    const { habitsWithCompletion, allLogs, isLoading, loadHabitsData, toggleHabitCompletionForDate, error, clearError } = useHabitStore();
    const { colors, isDark } = useAppTheme();
    const didAttemptInitialLoad = useRef(false);
    const [togglingDateStr, setTogglingDateStr] = useState<string | null>(null);

    const habit = useMemo(() => habitsWithCompletion.find(h => h.id === habitId), [habitsWithCompletion, habitId]);
    const habitLogs = useMemo(() => allLogs.filter(l => l.habit_id === habitId), [allLogs, habitId]);

    useEffect(() => {
        // If user navigates here before data is loaded (or via deep link), try loading once.
        if (!habit && habitsWithCompletion.length === 0 && !isLoading && !didAttemptInitialLoad.current) {
            didAttemptInitialLoad.current = true;
            loadHabitsData(getLocalDateString());
        }
    }, [habit, habitsWithCompletion.length, isLoading, loadHabitsData]);

    useEffect(() => {
        if (error) {
            Alert.alert('Error', error);
            clearError();
        }
    }, [error, clearError]);

    // Calendar state
    const [viewDate, setViewDate] = useState(new Date());

    const goToPreviousMonth = () => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() - 1);
        setViewDate(d);
    };

    const goToNextMonth = () => {
        const d = new Date(viewDate);
        d.setMonth(d.getMonth() + 1);
        setViewDate(d);
    };

    const capitalizedMonth = MONTHS_ES[viewDate.getMonth()] || '';
    const calendarYear = viewDate.getFullYear();

    if (!habit) {
        const shouldShowLoading = isLoading || (!didAttemptInitialLoad.current && habitsWithCompletion.length === 0);

        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
                <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>Hábito</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.missingContainer}>
                    {shouldShowLoading ? (
                        <ActivityIndicator size="large" color={colors.primary} />
                    ) : (
                        <Text style={[styles.missingText, { color: colors.textMuted }]}>No se encontró este hábito.</Text>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    // Generate days for the current month view
    const calendarDays = useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        
        // First day of the month
        const firstDay = new Date(year, month, 1);
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);
        
        const days = [];
        
        // Add empty cells for days from previous month to align Monday? 
        // JS getDay(): 0=Sun, 1=Mon... Standardize to Sunday as first day
        const firstDayIndex = firstDay.getDay(); 
        
        for (let i = 0; i < firstDayIndex; i++) {
            days.push(null);
        }
        
        const todayStr = getLocalDateString();
        const daysMap: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const d = new Date(year, month, i);
            const dateStr = getLocalDateString(d);
            const dayOfWeek = daysMap[d.getDay()];
            const isScheduled = habit.frequency?.includes(dayOfWeek) ?? false;
            const isCompleted = habitLogs.some(l => l.log_date === dateStr);

            days.push({
                date: d,
                dateStr,
                dayOfWeek,
                isScheduled,
                isFuture: dateStr > todayStr,
                isCompleted,
                isToday: dateStr === todayStr,
            });
        }
        return days;
    }, [viewDate, habitLogs, habit.frequency]);

    const { scheduledDaysInMonth, completedScheduledDaysInMonth } = useMemo(() => {
        let scheduled = 0;
        let completed = 0;

        for (const day of calendarDays) {
            if (!day) continue;
            if (!day.isScheduled) continue;

            scheduled++;
            if (day.isCompleted) completed++;
        }

        return { scheduledDaysInMonth: scheduled, completedScheduledDaysInMonth: completed };
    }, [calendarDays]);

    const totalCompletions = habitLogs.length;
    const completionRate = scheduledDaysInMonth > 0
        ? Math.round((completedScheduledDaysInMonth / scheduledDaysInMonth) * 100)
        : 0;

    const handleToggleCalendarDay = async (dateStr: string) => {
        if (togglingDateStr) return;

        setTogglingDateStr(dateStr);
        try {
            await toggleHabitCompletionForDate(habitId, dateStr);
        } finally {
            setTogglingDateStr(null);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{habit.title}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.contentInner}>
                    <View style={[styles.card, { borderLeftColor: habit.color_hex, backgroundColor: colors.card }]}>
                        <Text style={[styles.habitTitle, { color: colors.text }]}>{habit.title}</Text>
                        {habit.description ? (
                            <Text style={[styles.habitDescription, { color: colors.textMuted }]}>{habit.description}</Text>
                        ) : null}
                        
                        <View style={[styles.statsGrid, { borderTopColor: colors.border }]}>
                            <View style={styles.statContainer}>
                                <Text style={[styles.statValue, { color: colors.text }]}>{totalCompletions}</Text>
                                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total</Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <View style={styles.statContainer}>
                                <Text style={[styles.statValue, { color: colors.text }]}>{habit.current_streak || 0}d</Text>
                                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Racha</Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <View style={styles.statContainer}>
                                <Text style={[styles.statValue, { color: colors.text }]}>{completionRate}%</Text>
                                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Mensual</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.calendarHeader}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>{capitalizedMonth} {calendarYear}</Text>
                        <View style={styles.calendarNav}>
                            <TouchableOpacity
                                onPress={goToPreviousMonth}
                                style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                            >
                                <Ionicons name="chevron-back" size={20} color={colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={goToNextMonth}
                                style={[styles.navButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                            >
                                <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={[styles.calendarContainer, { backgroundColor: colors.card }]}>
                        <View style={styles.daysHeader}>
                            {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(day => (
                                <Text key={day} style={[styles.dayLabel, { color: colors.textMuted }]}>{day}</Text>
                            ))}
                        </View>
                        <View style={styles.calendarGrid}>
                            {calendarDays.map((day, index) => {
                                if (!day) {
                                    return (
                                        <View
                                            key={`empty-${index}`}
                                            style={[styles.calendarCell, styles.emptyCell]}
                                        />
                                    );
                                }

                                const isToggling = togglingDateStr === day.dateStr;
                                const canToggle = !day.isFuture && (day.isScheduled || day.isCompleted) && !isToggling;

                                const backgroundColor = day.isCompleted
                                    ? habit.color_hex
                                    : day.isScheduled
                                        ? colors.inputBg
                                        : colors.border;

                                return (
                                    <TouchableOpacity
                                        key={day.dateStr}
                                        style={[
                                            styles.calendarCell,
                                            { backgroundColor },
                                            day.isToday && styles.todayCell,
                                            day.isToday && { borderColor: colors.primary },
                                            !canToggle && { opacity: 0.5 },
                                        ]}
                                        activeOpacity={0.7}
                                        onPress={() => handleToggleCalendarDay(day.dateStr)}
                                        disabled={!canToggle}
                                    >
                                        {isToggling ? (
                                            <ActivityIndicator size="small" color={day.isCompleted ? '#fff' : habit.color_hex} />
                                        ) : (
                                            <Text
                                                style={[
                                                    styles.dayNumber,
                                                    { color: colors.text },
                                                    day.isCompleted && { color: '#fff' },
                                                    day.isToday && !day.isCompleted && { color: habit.color_hex },
                                                ]}
                                            >
                                                {day.date.getDate()}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        <View style={[styles.legend, { borderTopColor: colors.border }]}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: habit.color_hex }]} />
                                <Text style={[styles.legendText, { color: colors.textMuted }]}>Completado</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View
                                    style={[
                                        styles.legendDot,
                                        styles.todayLegendIcon,
                                        { borderColor: colors.primary, backgroundColor: colors.card },
                                    ]}
                                />
                                <Text style={[styles.legendText, { color: colors.textMuted }]}>Hoy</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a2e',
        maxWidth: windowWidth * 0.6,
    },
    missingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    missingText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    content: {
        padding: CONTENT_PADDING,
        alignItems: 'center', // Center items for wide screens
    },
    contentInner: {
        width: '100%',
        maxWidth: MAX_CONTENT_WIDTH,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        ...getShadowStyle('#000', 0, 4, 0.05, 10, 3),
        borderLeftWidth: 8,
    },
    habitTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    habitDescription: {
        fontSize: 16,
        color: '#888',
        marginBottom: 20,
        lineHeight: 22,
    },
    statsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    statContainer: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#aaa',
        textTransform: 'uppercase',
        marginTop: 4,
    },
    divider: {
        width: 1,
        height: 30,
        backgroundColor: '#eee',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a2e',
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    calendarNav: {
        flexDirection: 'row',
        gap: 12,
    },
    navButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
    },
    dayLabel: {
        width: CELL_SIZE,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
        color: '#aaa',
    },
    daysHeader: {
        width: GRID_WIDTH,
        flexDirection: 'row',
        marginBottom: 12,
        gap: CALENDAR_GAP,
    },
    calendarContainer: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        ...getShadowStyle('#000', 0, 4, 0.05, 10, 2),
        alignItems: 'center', // Center the fixed-width grid
    },
    calendarGrid: {
        width: GRID_WIDTH,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: CALENDAR_GAP,
    },
    calendarCell: {
        width: CELL_SIZE,
        height: CELL_SIZE,
        borderRadius: CELL_SIZE / 2,
        backgroundColor: '#f8fafc',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyCell: {
        backgroundColor: 'transparent',
    },
    todayCell: {
        borderWidth: 2,
        borderColor: '#3498db',
    },
    dayNumber: {
        fontSize: 12,
        fontWeight: '600',
        color: '#555',
    },
    legend: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 16,
        justifyContent: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f8fafc',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    todayLegendIcon: {
        borderWidth: 1.5,
        borderColor: '#3498db',
        backgroundColor: '#fff',
    },
    legendText: {
        fontSize: 12,
        color: '#888',
        fontWeight: '500',
    },
});
