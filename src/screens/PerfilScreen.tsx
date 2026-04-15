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
import { useAppTheme } from '../utils/theme';

type PerfilScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'Perfil'>,
    NativeStackNavigationProp<MainStackParamList>
>;

type ProfilePromptKind = 'name' | 'password' | 'email' | 'reminderTime';

export default function PerfilScreen() {
    const { user, signOut } = useAuthStore();
    const { stats, loadStats, loadHabitsData, error, clearError } = useHabitStore();
    const [refreshing, setRefreshing] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [dailyReminderTime, setDailyReminderTime] = useState({ hour: 20, minute: 0 });
    const [promptVisible, setPromptVisible] = useState(false);
    const [promptKind, setPromptKind] = useState<ProfilePromptKind | null>(null);
    const [promptValue, setPromptValue] = useState('');
    const [promptLoading, setPromptLoading] = useState(false);
    const [showPromptValue, setShowPromptValue] = useState(false);
    const navigation = useNavigation<PerfilScreenNavigationProp>();
    const { isDark, setDarkMode, colors } = useAppTheme();

    const reminderTimeLabel = `${String(dailyReminderTime.hour).padStart(2, '0')}:${String(dailyReminderTime.minute).padStart(2, '0')}`;

    const toggleDarkMode = async (value: boolean) => {
        await setDarkMode(value);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadHabitsData(getLocalDateString());
        await loadStats();
        setRefreshing(false);
    }, [loadStats, loadHabitsData]);

    useEffect(() => {
        loadHabitsData(getLocalDateString()).then(() => loadStats());
        // Load notification preferences
        AsyncStorage.getItem('notificationsEnabled').then(val => {
            if (val === 'true') {
                setNotificationsEnabled(true);
            }
        });

        AsyncStorage.getItem('dailyReminderTime').then(val => {
            if (!val) return;
            const match = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.exec(val);
            if (!match) return;
            setDailyReminderTime({ hour: Number(match[1]), minute: Number(match[2]) });
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
        if (Platform.OS === 'web') {
            Alert.alert('No disponible', 'Los recordatorios no están disponibles en web.');
            return;
        }

        if (value) {
            const granted = await notificationsService.requestPermissions();
            if (granted) {
                await notificationsService.scheduleDailyReminder(dailyReminderTime.hour, dailyReminderTime.minute);
                setNotificationsEnabled(true);
                await AsyncStorage.setItem('notificationsEnabled', 'true');
                Alert.alert('Notificaciones activas', `Te recordaremos todos los días a las ${reminderTimeLabel}.`);
            } else {
                Alert.alert('Permisos denegados', 'Debes activar las notificaciones en los ajustes de tu dispositivo.');
                setNotificationsEnabled(false);
            }
        } else {
            await notificationsService.cancelAllReminders();
            setNotificationsEnabled(false);
            await AsyncStorage.setItem('notificationsEnabled', 'false');
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
        } else if (kind === 'reminderTime') {
            setPromptValue(reminderTimeLabel);
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
                : promptKind === 'email'
                    ? 'Actualizar correo'
                    : 'Hora del recordatorio';

    const promptHint =
        promptKind === 'name'
            ? 'Ingresa tu nombre completo'
            : promptKind === 'password'
                ? 'Mínimo 6 caracteres'
                : promptKind === 'email'
                    ? 'Ingresa tu nuevo correo electrónico'
                    : 'Formato HH:MM (ej: 20:00)';

    const promptPlaceholder =
        promptKind === 'name'
            ? 'Ej: Juan Pérez'
            : promptKind === 'password'
                ? 'Nueva contraseña'
                : promptKind === 'email'
                    ? 'nuevo@correo.com'
                    : '20:00';

    const handlePromptConfirm = async () => {
        if (!promptKind) return;
        const kind = promptKind;
        if (!user) {
            Alert.alert('Error', 'Sesión no válida.');
            return;
        }

        const rawValue = kind === 'password' ? promptValue : promptValue.trim();

        if (kind === 'reminderTime') {
            const match = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.exec(rawValue);
            if (!match) {
                return Alert.alert('Error', 'Formato inválido. Usa HH:MM (ej: 20:00).');
            }

            const hour = Number(match[1]);
            const minute = Number(match[2]);
            const normalized = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

            setPromptLoading(true);
            try {
                await AsyncStorage.setItem('dailyReminderTime', normalized);
                setDailyReminderTime({ hour, minute });

                if (notificationsEnabled && Platform.OS !== 'web') {
                    await notificationsService.scheduleDailyReminder(hour, minute);
                }

                forceClosePrompt();

                const message = Platform.OS === 'web'
                    ? 'Hora guardada. Los recordatorios solo están disponibles en móvil.'
                    : 'Hora del recordatorio actualizada.';

                Alert.alert('¡Listo!', message);
            } catch (e: any) {
                Alert.alert('Error', e?.message || 'No se pudo actualizar la hora.');
            } finally {
                setPromptLoading(false);
            }
            return;
        }

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
                style={[styles.container, { backgroundColor: colors.background }]}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            >
            <View style={styles.header}>
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={[styles.emailText, { color: colors.text }]}>{user?.email}</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                    <Ionicons name="documents-outline" size={24} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalHabits}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Activos</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                    <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.totalCompletions}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Completados</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                    <Ionicons name="flame-outline" size={24} color={colors.warning} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.bestStreak}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Mejor Racha</Text>
                </View>
                <View style={[styles.statBox, { backgroundColor: colors.card }]}>
                    <Ionicons name="trending-up-outline" size={24} color={colors.primary} />
                    <Text style={[styles.statValue, { color: colors.text }]}>{stats.weeklyRate}%</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Semanal</Text>
                </View>
            </View>

            <View style={[styles.settingsGroup, { backgroundColor: colors.card }]}>
                <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                    <Ionicons name="moon-outline" size={22} color={colors.textMuted} style={styles.settingIcon} />
                    <Text style={[styles.settingText, { color: colors.text }]}>Modo oscuro</Text>
                    <Switch
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={isDark ? colors.primary : '#f4f3f4'}
                        onValueChange={toggleDarkMode}
                        value={isDark}
                    />
                </View>
                <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                    <Ionicons name="notifications-outline" size={22} color={colors.textMuted} style={styles.settingIcon} />
                    <Text style={[styles.settingText, { color: colors.text }]}>Recordatorio diario ({reminderTimeLabel})</Text>
                    <Switch
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
                        onValueChange={toggleNotifications}
                        value={notificationsEnabled}
                        disabled={Platform.OS === 'web'}
                    />
                </View>
                <TouchableOpacity
                    style={[styles.settingItem, { borderBottomColor: colors.border }]}
                    onPress={() => openPrompt('reminderTime')}
                >
                    <Ionicons name="time-outline" size={22} color={colors.textMuted} style={styles.settingIcon} />
                    <Text style={[styles.settingText, { color: colors.text }]}>Cambiar hora del recordatorio</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.border} style={styles.settingChevron} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.settingItem, { borderBottomColor: colors.border }]}
                    onPress={() => openPrompt('name')}
                >
                    <Ionicons name="person-outline" size={22} color={colors.textMuted} style={styles.settingIcon} />
                    <Text style={[styles.settingText, { color: colors.text }]}>Actualizar nombre</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.border} style={styles.settingChevron} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.settingItem, { borderBottomColor: colors.border }]}
                    onPress={() => openPrompt('password')}
                >
                    <Ionicons name="key-outline" size={22} color={colors.textMuted} style={styles.settingIcon} />
                    <Text style={[styles.settingText, { color: colors.text }]}>Cambiar contraseña</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.border} style={styles.settingChevron} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.settingItem, { borderBottomColor: colors.border }]}
                    onPress={() => openPrompt('email')}
                >
                    <Ionicons name="mail-outline" size={22} color={colors.textMuted} style={styles.settingIcon} />
                    <Text style={[styles.settingText, { color: colors.text }]}>Actualizar correo</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.border} style={styles.settingChevron} />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.settingItem, { borderBottomColor: colors.border }]} 
                    onPress={() => navigation.navigate('PrivacyTerms', { type: 'privacy' })}
                >
                    <Ionicons name="shield-checkmark-outline" size={22} color={colors.textMuted} style={styles.settingIcon} />
                    <Text style={[styles.settingText, { color: colors.text }]}>Privacidad y Seguridad</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.border} style={styles.settingChevron} />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.settingItem, { borderBottomColor: colors.border }]}
                    onPress={() => navigation.navigate('PrivacyTerms', { type: 'terms' })}
                >
                    <Ionicons name="document-text-outline" size={22} color={colors.textMuted} style={styles.settingIcon} />
                    <Text style={[styles.settingText, { color: colors.text }]}>Términos y Condiciones</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.border} style={styles.settingChevron} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.signOutButton, { backgroundColor: colors.card }]}
                onPress={signOut}
            >
                <Ionicons name="log-out-outline" size={20} color={colors.danger} style={{ marginRight: 8 }} />
                <Text style={[styles.signOutText, { color: colors.danger }]}>Cerrar Sesión</Text>
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
                        <View style={[styles.promptCard, { backgroundColor: colors.card }]}>
                            <View style={styles.promptHeader}>
                                <Text style={[styles.promptTitle, { color: colors.text }]}>{promptTitle}</Text>
                                <TouchableOpacity
                                    onPress={closePrompt}
                                    disabled={promptLoading}
                                    style={[styles.promptCloseButton, { backgroundColor: colors.inputBg }]}
                                >
                                    <Ionicons name="close" size={22} color={colors.text} />
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.promptHint, { color: colors.textMuted }]}>{promptHint}</Text>

                            <View
                                style={[
                                    styles.promptInputWrapper,
                                    { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                                ]}
                            >
                                <TextInput
                                    style={[styles.promptInput, { color: colors.text }]}
                                    placeholder={promptPlaceholder}
                                    placeholderTextColor={colors.textMuted}
                                    value={promptValue}
                                    onChangeText={setPromptValue}
                                    autoCapitalize={promptKind === 'email' || promptKind === 'password' || promptKind === 'reminderTime' ? 'none' : 'words'}
                                    autoCorrect={!(promptKind === 'email' || promptKind === 'password' || promptKind === 'reminderTime')}
                                    keyboardType={promptKind === 'email' ? 'email-address' : promptKind === 'reminderTime' ? 'numeric' : 'default'}
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
                                            color={colors.textMuted}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.promptActions}>
                                <TouchableOpacity
                                    style={[styles.promptCancel, { backgroundColor: colors.inputBg }]}
                                    onPress={closePrompt}
                                    disabled={promptLoading}
                                >
                                    <Text style={[styles.promptCancelText, { color: colors.text }]}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.promptConfirm,
                                        { backgroundColor: colors.primary },
                                        (promptLoading || !promptValue.trim()) && { opacity: 0.6 },
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
