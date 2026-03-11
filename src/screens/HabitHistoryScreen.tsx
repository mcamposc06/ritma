import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../navigation/types';
import { useHabitStore } from '../store/useHabitStore';
import { Ionicons } from '@expo/vector-icons';

type HistoryRouteProp = RouteProp<MainStackParamList, 'HabitHistory'>;

export default function HabitHistoryScreen() {
    const route = useRoute<HistoryRouteProp>();
    const { habitId, title } = route.params;
    const { allLogs, deleteLog, isLoading, error, clearError } = useHabitStore();
    const [removingId, setRemovingId] = useState<string | null>(null);

    // watch for errors and show alert
    React.useEffect(() => {
        if (error) {
            Alert.alert('Error', error);
            clearError();
        }
    }, [error, clearError]);

    const habitLogs = useMemo(() => {
        return allLogs
            .filter(l => l.habit_id === habitId)
            .sort((a, b) => b.log_date.localeCompare(a.log_date));
    }, [allLogs, habitId]);

    const handleRemove = useCallback((logId: string) => {
        Alert.alert('Eliminar registro', '¿Deseas eliminar este registro?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar',
                style: 'destructive',
                onPress: async () => {
                    setRemovingId(logId);
                    await deleteLog(logId);
                    setRemovingId(null);
                }
            }
        ]);
    }, [deleteLog]);

    const renderItem = ({ item }: { item: { id: string; log_date: string } }) => (
        <View style={styles.row}>
            <Text style={styles.dateText}>{item.log_date}</Text>
            <TouchableOpacity onPress={() => handleRemove(item.id)} disabled={removingId === item.id}>
                {removingId === item.id ? (
                    <ActivityIndicator size="small" color="#e74c3c" />
                ) : (
                    <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                )}
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>

            {habitLogs.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No hay registros de este hábito.</Text>
                </View>
            ) : (
                <FlatList
                    data={habitLogs}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
        padding: 24,
        paddingTop: 60,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 24,
    },
    listContainer: {
        paddingBottom: 40,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    dateText: {
        fontSize: 16,
        color: '#333',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
    }
});
