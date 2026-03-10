import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HabitosScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Mis Hábitos</Text>
            <Text style={styles.subtitle}>Aquí gestionarás todos tus hábitos.</Text>

            <TouchableOpacity style={styles.fab}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#f5f7fa',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        marginTop: 20,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3498db',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    fabText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
    }
});
