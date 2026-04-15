import React, { useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../utils/theme';
import { useHabitStore } from '../store/useHabitStore';
import { DayOfWeek } from '../types';
import { getLocalDateString } from '../utils/dateHelpers';
import { getShadowStyle } from '../utils/styleHelpers';

const DAYS_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function EstadisticasScreen() {
    const { habits, allLogs, stats, isLoading, loadHabitsData, loadStats, error, clearError } = useHabitStore();
    const { colors } = useAppTheme();

    const loadData = useCallback(async () => {
        await loadHabitsData(getLocalDateString());
        await loadStats();
    }, [loadHabitsData, loadStats]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // notify errors
    useEffect(() => {
        if (error) {
            Alert.alert('Error', error);
            clearError();
        }
    }, [error, clearError]);

    // Build weekly heatmap data: last 7 days × each habit
    const heatmapData = useMemo(() => {
        const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as DayOfWeek[];
        const today = new Date();
        const days: { label: string; dateStr: string; dayOfWeek: DayOfWeek }[] = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            days.push({
                label: DAYS_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1],
                dateStr: getLocalDateString(d),
                dayOfWeek: daysMap[d.getDay()],
            });
        }

        return days.map(day => ({
            ...day,
            habits: habits.map(habit => {
                const isScheduled = habit.frequency?.includes(day.dayOfWeek) ?? false;
                const isCompleted = allLogs.some(l => l.habit_id === habit.id && l.log_date === day.dateStr);
                return {
                    id: habit.id,
                    title: habit.title,
                    color: habit.color_hex,
                    isScheduled,
                    isCompleted,
                };
            }),
        }));
    }, [habits, allLogs]);

    // Summary stats for the header
    const weekCompletions = useMemo(() => {
        const today = new Date();
        let count = 0;
        for (let i = 0; i < 7; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = getLocalDateString(d);
            count += allLogs.filter(l => l.log_date === dateStr).length;
        }
        return count;
    }, [allLogs]);

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl
                    refreshing={isLoading}
                    onRefresh={loadData}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                />
            }
        >
            <Text style={[styles.title, { color: colors.text }]}>Estadísticas</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Tu resumen de actividad semanal.</Text>

            {/* Summary Cards */}
            <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                    <Ionicons name="flame-outline" size={24} color={colors.warning} />
                    <Text style={[styles.summaryValue, { color: colors.text }]}>{stats.bestStreak}</Text>
                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Mejor Racha</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                    <Ionicons name="checkmark-done-outline" size={24} color={colors.success} />
                    <Text style={[styles.summaryValue, { color: colors.text }]}>{weekCompletions}</Text>
                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Esta Semana</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                    <Ionicons name="trending-up-outline" size={24} color={colors.primary} />
                    <Text style={[styles.summaryValue, { color: colors.text }]}>{stats.weeklyRate}%</Text>
                    <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Cumplimiento</Text>
                </View>
            </View>

            {/* Heatmap */}
            {habits.length > 0 ? (
                <View style={[styles.heatmapCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.heatmapTitle, { color: colors.text }]}>Actividad Semanal</Text>

                    {/* Day Headers */}
                    <View style={styles.heatmapHeaderRow}>
                        <View style={styles.habitLabelSpace} />
                        {heatmapData.map((day, i) => (
                            <View key={i} style={styles.heatmapDayHeader}>
                                <Text style={[styles.heatmapDayText, { color: colors.textMuted }]}>{day.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Habit Rows */}
                    {habits.map(habit => (
                        <View key={habit.id} style={styles.heatmapRow}>
                            <View style={styles.habitLabelSpace}>
                                <Text style={[styles.habitLabel, { color: colors.text }]} numberOfLines={1}>
                                    {habit.title}
                                </Text>
                            </View>
                            {heatmapData.map((day, i) => {
                                const cell = day.habits.find(h => h.id === habit.id);
                                const bg = !cell?.isScheduled
                                    ? colors.inputBg
                                    : cell?.isCompleted
                                        ? habit.color_hex
                                        : colors.inputBorder;
                                return (
                                    <View key={i} style={styles.heatmapCellContainer}>
                                        <View style={[styles.heatmapCell, { backgroundColor: bg }]}>
                                            {cell?.isCompleted && (
                                                <Ionicons name="checkmark" size={10} color="#fff" />
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ))}

                    {/* Legend */}
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colors.inputBg }]} />
                            <Text style={[styles.legendText, { color: colors.textMuted }]}>No programado</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colors.inputBorder }]} />
                            <Text style={[styles.legendText, { color: colors.textMuted }]}>Pendiente</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                            <Text style={[styles.legendText, { color: colors.textMuted }]}>Completado</Text>
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="bar-chart-outline" size={48} color={colors.border} style={{ marginBottom: 16 }} />
                    <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>Crea hábitos para ver estadísticas</Text>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    contentContainer: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a2e',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 4,
        alignItems: 'center',
        ...getShadowStyle('#000', 0, 2, 0.05, 4, 2),
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
        marginBottom: 2,
    },
    summaryLabel: {
        fontSize: 11,
        color: '#888',
        fontWeight: '500',
        textAlign: 'center',
    },
    heatmapCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        ...getShadowStyle('#000', 0, 2, 0.05, 8, 2),
    },
    heatmapTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    heatmapHeaderRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    habitLabelSpace: {
        width: 80,
        justifyContent: 'center',
    },
    heatmapDayHeader: {
        flex: 1,
        alignItems: 'center',
    },
    heatmapDayText: {
        fontSize: 11,
        color: '#888',
        fontWeight: '600',
    },
    heatmapRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    habitLabel: {
        fontSize: 12,
        color: '#555',
        fontWeight: '500',
    },
    heatmapCellContainer: {
        flex: 1,
        alignItems: 'center',
    },
    heatmapCell: {
        width: 26,
        height: 26,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
        gap: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 3,
        marginRight: 4,
    },
    legendText: {
        fontSize: 11,
        color: '#888',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 20,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#888',
    },
});
