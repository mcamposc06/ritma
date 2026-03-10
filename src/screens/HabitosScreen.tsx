import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHabitStore } from '../store/useHabitStore';
import CreateHabitModal from '../components/CreateHabitModal';

export default function HabitosScreen() {
    const { habits, isLoading, loadHabitsData, deleteHabit } = useHabitStore();
    const [isModalVisible, setIsModalVisible] = useState(false);

    // Load data when mounting / refreshing
    const loadData = useCallback(() => {
        // We pass today just to satisfy the store API, though here we primarily care about the 'habits' list
        const today = new Date().toISOString().split('T')[0];
        loadHabitsData(today);
    }, [loadHabitsData]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const confirmDelete = (habitId: string) => {
        Alert.alert(
            "Eliminar Hábito",
            "¿Estás seguro de que deseas eliminar este hábito? Se perderá todo su historial.",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Eliminar", 
                    style: "destructive",
                    onPress: () => deleteHabit(habitId) 
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={[styles.habitItem, { borderLeftColor: item.color_hex }]}>
            <View style={styles.habitInfo}>
                <Text style={styles.habitTitle}>{item.title}</Text>
                {item.description ? (
                    <Text style={styles.habitDescription}>{item.description}</Text>
                ) : null}
            </View>
            <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => confirmDelete(item.id)}
            >
                <Ionicons name="trash-outline" size={20} color="#e74c3c" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mis Hábitos</Text>
            <Text style={styles.subtitle}>Aquí gestionarás todos tus hábitos.</Text>

            <FlatList
                data={habits}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={['#3498db']} />
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="leaf-outline" size={48} color="#ccc" style={{marginBottom: 16}}/>
                            <Text style={styles.emptyStateText}>No tienes hábitos creados.</Text>
                            <Text style={styles.emptyStateSubtext}>Usa el botón '+' para agregar el primero.</Text>
                        </View>
                    ) : null
                }
            />

            <TouchableOpacity 
                style={styles.fab}
                onPress={() => setIsModalVisible(true)}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            <CreateHabitModal 
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        paddingTop: 60,
        backgroundColor: '#f5f7fa',
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
    listContainer: {
        paddingBottom: 80, // Space for FAB
    },
    habitItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    habitInfo: {
        flex: 1,
        marginRight: 16,
    },
    habitTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    habitDescription: {
        fontSize: 14,
        color: '#888',
    },
    deleteButton: {
        padding: 8,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        marginTop: 40,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#3498db',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#3498db',
        shadowOpacity: 0.4,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    }
});
