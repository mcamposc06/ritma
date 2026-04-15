import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
    SafeAreaView, StatusBar
} from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../services/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getShadowStyle } from '../utils/styleHelpers';
import { useAppTheme } from '../utils/theme';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loadingProvider, setLoadingProvider] = useState<'password' | 'google' | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const navigation = useNavigation<LoginScreenNavigationProp>();
    const { colors, isDark } = useAppTheme();

    const isPasswordLoading = loadingProvider === 'password';
    const isGoogleLoading = loadingProvider === 'google';
    const isBusy = loadingProvider !== null;

    const handleLogin = async () => {
        if (!email || !password) return Alert.alert('Error', 'Por favor completa todos los campos.');
        setLoadingProvider('password');
        try {
            console.log('Intentando inicio de sesión para:', email);

            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password
            });

            if (error) {
                console.error('Error de inicio de sesión (Supabase):', {
                    message: error.message,
                    status: error.status,
                    name: error.name
                });

                if (error.message.includes('Invalid login credentials')) {
                    Alert.alert('Error', 'Correo o contraseña incorrectos. Por favor, verifica tus datos.');
                } else {
                    Alert.alert('Error', error.message);
                }
            } else {
                console.log('Inicio de sesión exitoso:', data.user?.id);
            }
        } finally {
            setLoadingProvider(null);
        }
    };

    const handleGoogleLogin = async () => {
        if (isBusy) return;

        setLoadingProvider('google');
        try {
            const safeDecode = (value: string) => {
                try {
                    return decodeURIComponent(value);
                } catch {
                    return value;
                }
            };

            const redirectTo = Linking.createURL('login');
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                    queryParams: { prompt: 'select_account' },
                },
            });

            if (error) {
                Alert.alert('Error', error.message);
                return;
            }

            // En web, Supabase redirige el navegador; el callback se procesa vía detectSessionInUrl.
            if (Platform.OS === 'web') return;

            if (!data?.url) {
                Alert.alert('Error', 'No se pudo iniciar el flujo de autenticación con Google.');
                return;
            }

            const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

            if (result.type !== 'success' || !result.url) {
                return;
            }

            const callbackUrl = new URL(result.url);
            const errorDescription =
                callbackUrl.searchParams.get('error_description') ||
                callbackUrl.searchParams.get('error');
            if (errorDescription) {
                Alert.alert('Error', safeDecode(errorDescription));
                return;
            }

            const code = callbackUrl.searchParams.get('code');
            if (!code) {
                Alert.alert('Error', 'No se recibió el código de autenticación.');
                return;
            }

            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
                Alert.alert('Error', exchangeError.message);
            }
        } catch (err) {
            console.error('Error en inicio de sesión con Google:', err);
            Alert.alert('Error', 'No se pudo completar el inicio de sesión con Google.');
        } finally {
            setLoadingProvider(null);
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.header}>
                    <View style={[styles.logoContainer, { backgroundColor: colors.card }]}>
                        <Ionicons name="leaf" size={48} color={colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: colors.text }]}>Ritma</Text>
                    <Text style={[styles.subtitle, { color: colors.textMuted }]}>Encuentra tu ritmo, transforma tu vida.</Text>
                </View>

                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Iniciar Sesión</Text>

                    <TouchableOpacity
                        style={[
                            styles.socialButton,
                            { backgroundColor: colors.card, borderColor: colors.inputBorder },
                            isBusy && styles.socialButtonDisabled,
                        ]}
                        onPress={handleGoogleLogin}
                        disabled={isBusy}
                    >
                        {isGoogleLoading ? (
                            <ActivityIndicator color={colors.text} />
                        ) : (
                            <>
                                <Ionicons name="logo-google" size={20} color={colors.text} style={styles.socialIcon} />
                                <Text style={[styles.socialButtonText, { color: colors.text }]}>Continuar con Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.dividerRow}>
                        <View style={[styles.dividerLine, { backgroundColor: colors.inputBorder }]} />
                        <Text style={[styles.dividerText, { color: colors.textMuted }]}>o</Text>
                        <View style={[styles.dividerLine, { backgroundColor: colors.inputBorder }]} />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>Correo Electrónico</Text>
                        <View
                            style={[
                                styles.inputWrapper,
                                { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                            ]}
                        >
                            <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="tu@correo.com"
                                placeholderTextColor={colors.textMuted}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: colors.textMuted }]}>Contraseña</Text>
                        <View
                            style={[
                                styles.inputWrapper,
                                { backgroundColor: colors.inputBg, borderColor: colors.inputBorder },
                            ]}
                        >
                            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: colors.text }]}
                                placeholder="Ingresa tu contraseña"
                                placeholderTextColor={colors.textMuted}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color={colors.textMuted}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.forgotPassword} onPress={() => {
                        Alert.prompt
                            ? Alert.prompt(
                                'Recuperar Contraseña',
                                'Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.',
                                async (inputEmail: string) => {
                                    if (!inputEmail) return;
                                    const { error } = await supabase.auth.resetPasswordForEmail(inputEmail);
                                    if (error) {
                                        Alert.alert('Error', error.message);
                                    } else {
                                        Alert.alert('¡Listo!', 'Revisa tu correo electrónico para restablecer tu contraseña.');
                                    }
                                },
                                'plain-text',
                                email
                            )
                            : (() => {
                                const resetEmail = email || '';
                                if (!resetEmail) {
                                    Alert.alert('Recuperar Contraseña', 'Por favor, escribe tu correo electrónico en el campo de arriba y luego presiona este botón de nuevo.');
                                    return;
                                }
                                supabase.auth.resetPasswordForEmail(resetEmail).then(({ error }) => {
                                    if (error) {
                                        Alert.alert('Error', error.message);
                                    } else {
                                        Alert.alert('¡Listo!', `Revisa tu correo (${resetEmail}) para restablecer tu contraseña.`);
                                    }
                                });
                            })();
                    }} disabled={isBusy}>
                        <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>¿Olvidaste tu contraseña?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            { backgroundColor: colors.primary },
                            isBusy && { opacity: 0.6, shadowOpacity: 0 },
                        ]}
                        onPress={handleLogin}
                        disabled={isBusy}
                    >
                        {isPasswordLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Entrar</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textMuted }]}>¿No tienes una cuenta? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={isBusy}>
                        <Text style={[styles.footerLink, { color: colors.primary }]}>Regístrate</Text>
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const shadows = {
    logo: getShadowStyle('#3498db', 0, 8, 0.15, 12, 10),
    card: getShadowStyle('#000', 0, 10, 0.05, 20, 5),
    button: getShadowStyle('#3498db', 0, 4, 0.3, 8, 4),
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#fff',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        ...shadows.logo,
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: '#1a1a2e',
        letterSpacing: 1,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        ...shadows.card,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a2e',
        marginBottom: 24,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 12,
        marginBottom: 18,
    },
    socialButtonDisabled: {
        opacity: 0.6,
    },
    socialIcon: {
        marginRight: 10,
    },
    socialButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a2e',
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e2e8f0',
    },
    dividerText: {
        marginHorizontal: 12,
        color: '#888',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        color: '#555',
        marginBottom: 8,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: '#333',
    },
    eyeIcon: {
        padding: 8,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#3498db',
        fontSize: 14,
        fontWeight: '600',
    },
    primaryButton: {
        backgroundColor: '#3498db',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        ...shadows.button,
    },
    primaryButtonDisabled: {
        backgroundColor: '#95c6e8',
        shadowOpacity: 0,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    footerText: {
        color: '#666',
        fontSize: 15,
    },
    footerLink: {
        color: '#3498db',
        fontSize: 15,
        fontWeight: 'bold',
    }
});
