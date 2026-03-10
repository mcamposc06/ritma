import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';

export default function HomeScreen() {
    const { user } = useAuthStore();

    return (
        <ScrollView style={styles.safeArea} contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hola,</Text>
                    <Text style={styles.emailText}>{user?.email}</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Tus Hábitos de Hoy</Text>

            {/* TODO: Load Habits from Supabase */}
            <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Aún no tienes hábitos registrados.</Text>
                <Text style={styles.emptyStateSubtext}>Crea uno para empezar tu racha hoy mismo.</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    container: {
        padding: 24,
        paddingTop: 60, // Account for top inset in simple implementations
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333'
    },
    emailText: {
        fontSize: 16,
        color: '#666',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    emptyState: {
        backgroundColor: '#fff',
        padding: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 32,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
    }
});
