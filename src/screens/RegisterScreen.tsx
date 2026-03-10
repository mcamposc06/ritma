import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<RegisterScreenNavigationProp>();

    const handleSignUp = async () => {
        if (!email || !password) return Alert.alert('Error', 'Por favor ingresa un correo y contraseña validos.');
        setLoading(true);
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('¡Éxito!', 'Cuenta creada correctamente. Ya puedes iniciar sesión.');
            navigation.goBack();
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Únete a Ritma</Text>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Correo Electrónico</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ej: correo@ejemplo.com"
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
                    placeholder="Crea una contraseña segura"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
            </View>

            <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSignUp}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Registrarse</Text>}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.goBack()}
                disabled={loading}
            >
                <Text style={styles.secondaryButtonText}>¿Ya tienes cuenta? Inicia sesión</Text>
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
        fontSize: 36,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 48,
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
