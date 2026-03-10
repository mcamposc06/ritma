import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<LoginScreenNavigationProp>();

    const handleSignIn = async () => {
        if (!email || !password) return Alert.alert('Error', 'Por favor ingresa tu correo y contraseña.');
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) Alert.alert('Error', error.message);
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Ritma</Text>
            <Text style={styles.subtitle}>Bienvenido de nuevo</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Correo Electrónico</Text>
                <TextInput
                    style={styles.input}
                    placeholder="tu@correo.com"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ingresa tu contraseña"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
            </View>

            <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSignIn}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('Register')}
                disabled={loading}
            >
                <Text style={styles.secondaryButtonText}>¿No tienes cuenta? Regístrate</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#3498db',
        marginBottom: 4,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 48,
        textAlign: 'center'
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        fontWeight: '600'
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 16,
        borderRadius: 8,
        fontSize: 16,
        backgroundColor: '#f9f9f9'
    },
    primaryButton: {
        backgroundColor: '#3498db',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    secondaryButtonText: {
        color: '#3498db',
        fontSize: 14,
        fontWeight: '600',
    }
});
