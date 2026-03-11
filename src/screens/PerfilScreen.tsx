import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/useAuthStore';
import { useHabitStore } from '../store/useHabitStore';
import { notificationsService } from '../services/notificationsService';
import { getLocalDateString } from '../utils/dateHelpers';

export default function PerfilScreen() {
    const { user, signOut } = useAuthStore();
    const { stats, loadStats, loadHabitsData } = useHabitStore();
    const [refreshing, setRefreshing] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadHabitsData(getLocalDateString());
        await loadStats();
        setRefreshing(false);
    }, [loadStats, loadHabitsData]);

    useEffect(() => {
        loadHabitsData(getLocalDateString()).then(() => loadStats());
        // Load notification preference
        AsyncStorage.getItem('notificationsEnabled').then(val => {
            if (val === 'true') {
                setNotificationsEnabled(true);
            }
        });
    }, [loadStats, loadHabitsData]);

    const toggleNotifications = async (value: boolean) => {
        if (value) {
            const granted = await notificationsService.requestPermissions();
            if (granted) {
                await notificationsService.scheduleDailyReminder(20, 0); // Schedule for 8:00 PM
                setNotificationsEnabled(true);
                AsyncStorage.setItem('notificationsEnabled', 'true');
                Alert.alert("Notificaciones activas", "Te recordaremos todos los días a las 8:00 PM.");
            } else {
                Alert.alert("Permisos denegados", "Debes activar las notificaciones en los ajustes de tu dispositivo.");
                setNotificationsEnabled(false);
            }
        } else {
            await notificationsService.cancelAllReminders();
            setNotificationsEnabled(false);
            AsyncStorage.setItem('notificationsEnabled', 'false');
        }
    };

    return (
        <ScrollView 
            style={styles.container} 
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3498db']} />
            }
        >
            <View style={styles.header}>
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.emailText}>{user?.email}</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Ionicons name="documents-outline" size={24} color="#3498db" />
                    <Text style={styles.statValue}>{stats.totalHabits}</Text>
                    <Text style={styles.statLabel}>Activos</Text>
                </View>
                <View style={styles.statBox}>
                    <Ionicons name="checkmark-circle-outline" size={24} color="#2ecc71" />
                    <Text style={styles.statValue}>{stats.totalCompletions}</Text>
                    <Text style={styles.statLabel}>Completados</Text>
                </View>
                <View style={styles.statBox}>
                    <Ionicons name="flame-outline" size={24} color="#e67e22" />
                    <Text style={styles.statValue}>{stats.bestStreak}</Text>
                    <Text style={styles.statLabel}>Mejor Racha</Text>
                </View>
                <View style={styles.statBox}>
                    <Ionicons name="trending-up-outline" size={24} color="#9b59b6" />
                    <Text style={styles.statValue}>{stats.weeklyRate}%</Text>
                    <Text style={styles.statLabel}>Semanal</Text>
                </View>
            </View>

            <View style={styles.settingsGroup}>
                <View style={styles.settingItem}>
                    <Ionicons name="notifications-outline" size={22} color="#444" style={styles.settingIcon} />
                    <Text style={styles.settingText}>Recordatorio Diario (8 PM)</Text>
                    <Switch
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={notificationsEnabled ? '#3498db' : '#f4f3f4'}
                        onValueChange={toggleNotifications}
                        value={notificationsEnabled}
                    />
                </View>
                <TouchableOpacity style={styles.settingItem}>
                    <Ionicons name="shield-checkmark-outline" size={22} color="#444" style={styles.settingIcon} />
                    <Text style={styles.settingText}>Privacidad y Seguridad</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.settingChevron} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingItem}>
                    <Ionicons name="document-text-outline" size={22} color="#444" style={styles.settingIcon} />
                    <Text style={styles.settingText}>Términos y Condiciones</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.settingChevron} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
                <Ionicons name="log-out-outline" size={20} color="#e74c3c" style={{ marginRight: 8 }} />
                <Text style={styles.signOutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
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
        alignItems: 'center',
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#3498db',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#3498db',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
    },
    avatarText: {
        color: '#fff',
        fontSize: 36,
        fontWeight: 'bold',
    },
    emailText: {
        fontSize: 18,
        color: '#333',
        fontWeight: '700',
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statBox: {
        width: '47%',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 13,
        color: '#888',
        fontWeight: '500',
    },
    settingsGroup: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 40,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    settingIcon: {
        marginRight: 16,
    },
    settingText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    settingChevron: {
        marginLeft: 'auto',
    },
    signOutButton: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(231, 76, 60, 0.3)',
    },
    signOutText: {
        color: '#e74c3c',
        fontSize: 16,
        fontWeight: '600',
    }
});
