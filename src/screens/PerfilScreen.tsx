import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

export default function PerfilScreen() {
    const { user, signOut } = useAuthStore();

    return (
        <View style={styles.container}>
            <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.emailText}>{user?.email}</Text>

            <View style={styles.settingsGroup}>
                <TouchableOpacity style={styles.settingItem}>
                    <Text style={styles.settingText}>Configuración de Notificaciones</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingItem}>
                    <Text style={styles.settingText}>Privacidad y Seguridad</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingItem}>
                    <Text style={styles.settingText}>Términos y Condiciones</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
                <Text style={styles.signOutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#3498db',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 24,
    },
    avatarText: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
    },
    emailText: {
        fontSize: 18,
        color: '#333',
        fontWeight: '600',
        marginBottom: 40,
    },
    settingsGroup: {
        width: '100%',
        marginBottom: 40,
    },
    settingItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    settingText: {
        fontSize: 16,
        color: '#444',
    },
    signOutButton: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e74c3c',
        marginTop: 'auto',
    },
    signOutText: {
        color: '#e74c3c',
        fontSize: 16,
        fontWeight: '600',
    }
});
