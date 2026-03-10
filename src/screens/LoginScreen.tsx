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

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigation = useNavigation<LoginScreenNavigationProp>();

    const handleSignIn = async () => {
        if (!email || !password) return Alert.alert('Error', 'Por favor ingresa tu correo y contraseña.');
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) Alert.alert('Error', error.message);
        setLoading(false);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="leaf" size={48} color="#3498db" />
                    </View>
                    <Text style={styles.title}>Ritma</Text>
                    <Text style={styles.subtitle}>Encuentra tu ritmo, transforma tu vida.</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Iniciar Sesión</Text>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Correo Electrónico</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="tu@correo.com"
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
                                placeholder="Ingresa tu contraseña"
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
                    </View>

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
                        onPress={handleSignIn}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryButtonText}>Entrar</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
                        <Text style={styles.footerLink}>Regístrate</Text>
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

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
        shadowColor: '#3498db',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1a1a2e',
        marginBottom: 24,
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
        shadowColor: '#3498db',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
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
