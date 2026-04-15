import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../utils/theme';
import { useHabitStore } from '../store/useHabitStore';
import CreateHabitModal from '../components/CreateHabitModal';
import { Habit } from '../types';
import { getLocalDateString } from '../utils/dateHelpers';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList, TabParamList } from '../navigation/types';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { getShadowStyle } from '../utils/styleHelpers';

type HabitosScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'Habitos'>,
    NativeStackNavigationProp<MainStackParamList>
>;

export default function HabitosScreen() {
    const { habits, isLoading, loadHabitsData, deleteHabit, error, clearError } = useHabitStore();
    const { colors } = useAppTheme();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);
    const navigation = useNavigation<HabitosScreenNavigationProp>();

    // show errors as alerts
    useEffect(() => {
        if (error) {
            Alert.alert('Error', error);
            clearError();
        }
    }, [error, clearError]);

    // Load data when mounting / refreshing
    const loadData = useCallback(() => {
        loadHabitsData(getLocalDateString());
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
                    onPress: async () => {
                        try {
                            await deleteHabit(habitId);
                            // No need for loadData() here as store handles it, 
                            // but ensuring we catch errors.
                        } catch (e) {
                            Alert.alert("Error", "No se pudo eliminar el hábito.");
                        }
                    } 
                }
            ]
        );
    };

    const handleEdit = (habit: Habit) => {
        setHabitToEdit(habit);
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setHabitToEdit(null); // Reset after modal completely closes
    };

    const handleCreateNew = () => {
        setHabitToEdit(null);
        setIsModalVisible(true);
    };

    const renderItem = ({ item }: { item: Habit }) => (
        <View style={[styles.habitItem, { borderLeftColor: item.color_hex, backgroundColor: colors.card }]}>
            <TouchableOpacity 
                style={styles.habitInfo}
                onPress={() => navigation.navigate('HabitDetail', { habitId: item.id })}
                activeOpacity={0.7}
            >
                <Text style={[styles.habitTitle, { color: colors.text }]}>{item.title}</Text>
                {item.description ? (
                    <Text style={[styles.habitDescription, { color: colors.textMuted }]} numberOfLines={2}>
                        {item.description}
                    </Text>
                ) : null}
                <View style={[styles.frequencyBadge, { backgroundColor: colors.inputBg }]}>
                    <Text style={[styles.frequencyText, { color: colors.textMuted }]}>
                        {item.frequency?.length || 7} días/semana
                    </Text>
                </View>
            </TouchableOpacity>
            
            <View style={styles.actionsContainer}>
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('HabitHistory', { habitId: item.id, title: item.title })}
                >
                    <Ionicons name="calendar-outline" size={20} color={colors.warning} />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleEdit(item)}
                >
                    <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => confirmDelete(item.id)}
                >
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Text style={[styles.title, { color: colors.text }]}>Mis Hábitos</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>Aquí gestionarás todos tus hábitos.</Text>

            <FlatList
                data={habits}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={loadData}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="leaf-outline" size={48} color={colors.border} style={{ marginBottom: 16 }} />
                            <Text style={[styles.emptyStateText, { color: colors.text }]}>No tienes hábitos creados.</Text>
                            <Text style={[styles.emptyStateSubtext, { color: colors.textMuted }]}>
                                Usa el botón '+' para agregar el primero.
                            </Text>
                        </View>
                    ) : null
                }
            />

            <TouchableOpacity 
                style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                onPress={handleCreateNew}
            >
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            <CreateHabitModal 
                visible={isModalVisible}
                onClose={handleCloseModal}
                initialHabit={habitToEdit}
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
        marginBottom: 8,
    },
    frequencyBadge: {
        backgroundColor: '#f0f4f8',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    frequencyText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    actionsContainer: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: 8,
        marginLeft: 4,
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
