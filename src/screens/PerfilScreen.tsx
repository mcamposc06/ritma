import React, { useEffect, useCallback, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Switch,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/useAuthStore';
import { useHabitStore } from '../store/useHabitStore';
import { notificationsService } from '../services/notificationsService';
import { supabase } from '../services/supabase';
import { getLocalDateString } from '../utils/dateHelpers';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { MainStackParamList, TabParamList } from '../navigation/types';
import { getShadowStyle } from '../utils/styleHelpers';

type PerfilScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'Perfil'>,
    NativeStackNavigationProp<MainStackParamList>
>;

type ProfilePromptKind = 'name' | 'password' | 'email';

export default function PerfilScreen() {
    const { user, signOut } = useAuthStore();
    const { stats, loadStats, loadHabitsData, error, clearError } = useHabitStore();
    const [refreshing, setRefreshing] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [promptVisible, setPromptVisible] = useState(false);
    const [promptKind, setPromptKind] = useState<ProfilePromptKind | null>(null);
    const [promptValue, setPromptValue] = useState('');
    const [promptLoading, setPromptLoading] = useState(false);
    const [showPromptValue, setShowPromptValue] = useState(false);
    const navigation = useNavigation<PerfilScreenNavigationProp>();

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

    // show errors
    useEffect(() => {
        if (error) {
            Alert.alert('Error', error);
            clearError();
        }
    }, [error, clearError]);

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

    const openPrompt = (kind: ProfilePromptKind) => {
        if (!user) {
            Alert.alert('Error', 'Sesión no válida.');
            return;
        }

        setPromptKind(kind);
        setShowPromptValue(false);

        if (kind === 'name') {
            setPromptValue((user.user_metadata?.full_name as string | undefined) || '');
        } else if (kind === 'email') {
            setPromptValue(user.email || '');
        } else {
            setPromptValue('');
        }

        setPromptVisible(true);
    };

    const forceClosePrompt = () => {
        setPromptVisible(false);
        setPromptKind(null);
        setPromptValue('');
        setShowPromptValue(false);
    };

    const closePrompt = () => {
        if (promptLoading) return;
        forceClosePrompt();
    };

    const promptTitle =
        promptKind === 'name'
            ? 'Actualizar nombre'
            : promptKind === 'password'
                ? 'Cambiar contraseña'
                : 'Actualizar correo';

    const promptHint =
        promptKind === 'name'
            ? 'Ingresa tu nombre completo'
            : promptKind === 'password'
                ? 'Mínimo 6 caracteres'
                : 'Ingresa tu nuevo correo electrónico';

    const promptPlaceholder =
        promptKind === 'name'
            ? 'Ej: Juan Pérez'
            : promptKind === 'password'
                ? 'Nueva contraseña'
                : 'nuevo@correo.com';

    const handlePromptConfirm = async () => {
        if (!promptKind) return;
        const kind = promptKind;
        if (!user) {
            Alert.alert('Error', 'Sesión no válida.');
            return;
        }

        const rawValue = kind === 'password' ? promptValue : promptValue.trim();

        if (kind === 'name') {
            if (!rawValue) return Alert.alert('Error', 'Ingresa tu nombre.');
        }

        if (kind === 'email') {
            if (!rawValue) return Alert.alert('Error', 'Ingresa tu correo.');
            if (!rawValue.includes('@')) return Alert.alert('Error', 'Ingresa un correo válido.');
        }

        if (kind === 'password') {
            if (!rawValue || rawValue.length < 6) {
                return Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
            }
        }

        setPromptLoading(true);
        try {
            const updates =
                kind === 'name'
                    ? { data: { full_name: rawValue } }
                    : kind === 'email'
                        ? { email: rawValue }
                        : { password: rawValue };

            const { error } = await supabase.auth.updateUser(updates);
            if (error) throw error;

            forceClosePrompt();

            if (kind === 'email') {
                Alert.alert('¡Listo!', 'Revisa tu nuevo correo para confirmar el cambio (si aplica).');
            } else if (kind === 'name') {
                Alert.alert('¡Listo!', 'Nombre actualizado.');
            } else {
                Alert.alert('¡Listo!', 'Contraseña actualizada.');
            }
        } catch (e: any) {
            Alert.alert('Error', e?.message || 'No se pudo actualizar.');
        } finally {
            setPromptLoading(false);
        }
    };

    return (
        <View style={{ flex: 1 }}>
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
                <TouchableOpacity style={styles.settingItem} onPress={() => openPrompt('name')}>
                    <Ionicons name="person-outline" size={22} color="#444" style={styles.settingIcon} />
                    <Text style={styles.settingText}>Actualizar nombre</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.settingChevron} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingItem} onPress={() => openPrompt('password')}>
                    <Ionicons name="key-outline" size={22} color="#444" style={styles.settingIcon} />
                    <Text style={styles.settingText}>Cambiar contraseña</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.settingChevron} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingItem} onPress={() => openPrompt('email')}>
                    <Ionicons name="mail-outline" size={22} color="#444" style={styles.settingIcon} />
                    <Text style={styles.settingText}>Actualizar correo</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.settingChevron} />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.settingItem} 
                    onPress={() => navigation.navigate('PrivacyTerms', { type: 'privacy' })}
                >
                    <Ionicons name="shield-checkmark-outline" size={22} color="#444" style={styles.settingIcon} />
                    <Text style={styles.settingText}>Privacidad y Seguridad</Text>
                    <Ionicons name="chevron-forward" size={20} color="#ccc" style={styles.settingChevron} />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.settingItem}
                    onPress={() => navigation.navigate('PrivacyTerms', { type: 'terms' })}
                >
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

            <Modal
                visible={promptVisible}
                transparent
                animationType="fade"
                onRequestClose={closePrompt}
            >
                <View style={styles.promptOverlay}>
                    <TouchableOpacity
                        style={styles.promptBackdrop}
                        activeOpacity={1}
                        onPress={closePrompt}
                    />

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                        style={styles.promptContainer}
                    >
                        <View style={styles.promptCard}>
                            <View style={styles.promptHeader}>
                                <Text style={styles.promptTitle}>{promptTitle}</Text>
                                <TouchableOpacity
                                    onPress={closePrompt}
                                    disabled={promptLoading}
                                    style={styles.promptCloseButton}
                                >
                                    <Ionicons name="close" size={22} color="#333" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.promptHint}>{promptHint}</Text>

                            <View style={styles.promptInputWrapper}>
                                <TextInput
                                    style={styles.promptInput}
                                    placeholder={promptPlaceholder}
                                    placeholderTextColor="#bbb"
                                    value={promptValue}
                                    onChangeText={setPromptValue}
                                    autoCapitalize={promptKind === 'email' || promptKind === 'password' ? 'none' : 'words'}
                                    autoCorrect={!(promptKind === 'email' || promptKind === 'password')}
                                    keyboardType={promptKind === 'email' ? 'email-address' : 'default'}
                                    secureTextEntry={promptKind === 'password' && !showPromptValue}
                                    editable={!promptLoading}
                                />
                                {promptKind === 'password' && (
                                    <TouchableOpacity
                                        style={styles.promptEyeButton}
                                        onPress={() => setShowPromptValue(v => !v)}
                                        disabled={promptLoading}
                                    >
                                        <Ionicons
                                            name={showPromptValue ? 'eye-off-outline' : 'eye-outline'}
                                            size={20}
                                            color="#888"
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.promptActions}>
                                <TouchableOpacity
                                    style={styles.promptCancel}
                                    onPress={closePrompt}
                                    disabled={promptLoading}
                                >
                                    <Text style={styles.promptCancelText}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.promptConfirm,
                                        (promptLoading || !promptValue.trim()) && styles.promptConfirmDisabled,
                                    ]}
                                    onPress={handlePromptConfirm}
                                    disabled={promptLoading || !promptValue.trim()}
                                >
                                    {promptLoading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.promptConfirmText}>Guardar</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </View>
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
        ...getShadowStyle('#3498db', 0, 4, 0.3, 8, 4),
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
        ...getShadowStyle('#000', 0, 2, 0.05, 4, 2),
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
    profileCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        ...getShadowStyle('#000', 0, 4, 0.1, 12, 4),
        marginBottom: 24,
    },
    settingsGroup: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 40,
        ...getShadowStyle('#000', 0, 2, 0.05, 4, 1),
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
    },
    promptOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        padding: 24,
    },
    promptBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    promptContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    promptCard: {
        width: '100%',
        maxWidth: 520,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        ...getShadowStyle('#000', 0, 10, 0.1, 18, 6),
    },
    promptHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    promptTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1a1a2e',
    },
    promptCloseButton: {
        padding: 6,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
    },
    promptHint: {
        fontSize: 13,
        color: '#666',
        marginBottom: 12,
    },
    promptInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    promptInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
    },
    promptEyeButton: {
        padding: 8,
    },
    promptActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 16,
    },
    promptCancel: {
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: '#f0f4f8',
    },
    promptCancelText: {
        color: '#333',
        fontSize: 14,
        fontWeight: '700',
    },
    promptConfirm: {
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        backgroundColor: '#3498db',
        minWidth: 110,
        alignItems: 'center',
        justifyContent: 'center',
    },
    promptConfirmDisabled: {
        backgroundColor: '#95c6e8',
    },
    promptConfirmText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
    },
});
