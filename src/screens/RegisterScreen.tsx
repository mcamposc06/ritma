import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
    SafeAreaView, StatusBar
} from 'react-native';
import { supabase } from '../services/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getShadowStyle } from '../utils/styleHelpers';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigation = useNavigation<RegisterScreenNavigationProp>();

    const handleSignUp = async () => {
        if (!email || !password || !fullName) return Alert.alert('Error', 'Por favor completa todos los campos.');
        if (password.length < 6) return Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
        
        setLoading(true);
        console.log('Intentando registro para:', email);
        
        const { data, error } = await supabase.auth.signUp({ 
            email: email.trim(), 
            password,
            options: {
                data: {
                    full_name: fullName.trim()
                }
            }
        });

        if (error) {
            console.error('Error de registro (Supabase):', {
                message: error.message,
                status: error.status,
                name: error.name
            });
            
            if (error.status === 422) {
                Alert.alert('Error', 'Los datos proporcionados no son válidos o el correo ya está en uso.');
            } else {
                Alert.alert('Error', error.message);
            }
        } else {
            console.log('Registro exitoso:', data.user?.id);
            Alert.alert('¡Éxito!', 'Cuenta creada correctamente. Ya puedes iniciar sesión.');
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.navigate('Login');
            }
        }
        setLoading(false);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <TouchableOpacity 
                    style={styles.backButton} 
                    onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login')}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <Text style={styles.title}>Crear Cuenta</Text>
                    <Text style={styles.subtitle}>Comienza a construir mejores hábitos hoy.</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Nombre Completo</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Juan Pérez"
                                placeholderTextColor="#bbb"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Correo Electrónico</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: correo@ejemplo.com"
                                placeholderTextColor="#bbb"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Contraseña</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Crea una contraseña segura"
                                placeholderTextColor="#bbb"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#888" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.hintText}>Debe contener al menos 6 caracteres.</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                        onPress={handleSignUp}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Registrarse</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.termsText}>
                        Al registrarte, aceptas nuestros <Text style={styles.termsLink} onPress={() => navigation.navigate('PrivacyTerms', { type: 'terms' })}>Términos de Servicio</Text> y <Text style={styles.termsLink} onPress={() => navigation.navigate('PrivacyTerms', { type: 'privacy' })}>Política de Privacidad</Text>.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} disabled={loading}>
                        <Text style={styles.footerLink}>Inicia sesión</Text>
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
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        ...getShadowStyle('#000', 0, 2, 0.1, 4, 3),
        zIndex: 10,
    },
    header: {
        marginBottom: 40,
        marginTop: 40,
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: '#1a1a2e',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        ...shadows.card,
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
    hintText: {
        fontSize: 12,
        color: '#888',
        marginTop: 6,
    },
    primaryButton: {
        backgroundColor: '#3498db',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
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
    termsText: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
        lineHeight: 18,
    },
    termsLink: {
        color: '#3498db',
        fontWeight: '600',
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
