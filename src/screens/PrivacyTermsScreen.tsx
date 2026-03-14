import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AuthStackParamList, MainStackParamList } from '../navigation/types';

type PrivacyTermsRouteProp = RouteProp<AuthStackParamList & MainStackParamList, 'PrivacyTerms'>;

export default function PrivacyTermsScreen() {
    const navigation = useNavigation();
    const route = useRoute<PrivacyTermsRouteProp>();
    const { type } = route.params;

    const isPrivacy = type === 'privacy';
    const title = isPrivacy ? 'Política de Privacidad' : 'Términos de Servicio';

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>{title}</Text>
                <View style={{ width: 40 }} /> 
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>
                    {isPrivacy ? '1. Recopilación de Datos' : '1. Uso de la Aplicación'}
                </Text>
                <Text style={styles.paragraph}>
                    {isPrivacy 
                        ? 'Ritma recopila información de manera local y sincroniza tus hábitos con Supabase para asegurar que puedas acceder a ellos en cualquier dispositivo. No compartimos tus datos con terceros.' 
                        : 'Al usar Ritma, te comprometes a hacer un uso responsable de la aplicación. Ritma es una herramienta diseñada para el crecimiento personal y el seguimiento de hábitos.'}
                </Text>

                <Text style={styles.sectionTitle}>
                    {isPrivacy ? '2. Seguridad' : '2. Propiedad Intelectual'}
                </Text>
                <Text style={styles.paragraph}>
                    {isPrivacy 
                        ? 'Toda tu información está protegida mediante Row Level Security (RLS) en nuestra base de datos, lo que garantiza que solo tú puedas acceder a tus registros personales.' 
                        : 'Todo el contenido, diseño y código de Ritma es propiedad de sus desarrolladores. No está permitida la redistribución o copia del software sin consentimiento previo.'}
                </Text>

                <Text style={styles.sectionTitle}>
                    {isPrivacy ? '3. Tus Derechos' : '3. Limitación de Responsabilidad'}
                </Text>
                <Text style={styles.paragraph}>
                    {isPrivacy 
                        ? 'Puedes eliminar todos tus datos en cualquier momento eliminando tu cuenta. Tienes el control total sobre tu trayectoria de hábitos y estadísticas.' 
                        : 'Ritma no se hace responsable de las consecuencias derivadas del incumplimiento de los hábitos programados por el usuario. La constancia es responsabilidad individual.'}
                </Text>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Última actualización: Marzo 2026</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    backButton: {
        padding: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a2e',
    },
    content: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#3498db',
        marginTop: 20,
        marginBottom: 10,
    },
    paragraph: {
        fontSize: 15,
        color: '#555',
        lineHeight: 22,
        marginBottom: 10,
    },
    footer: {
        marginTop: 40,
        paddingBottom: 20,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#888',
    }
});
