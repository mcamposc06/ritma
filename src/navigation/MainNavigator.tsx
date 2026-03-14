import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList, MainStackParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import HabitosScreen from '../screens/HabitosScreen';
import EstadisticasScreen from '../screens/EstadisticasScreen';
import PerfilScreen from '../screens/PerfilScreen';
import PrivacyTermsScreen from '../screens/PrivacyTermsScreen';
import HabitDetailScreen from '../screens/HabitDetailScreen';
import HabitHistoryScreen from '../screens/HabitHistoryScreen';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// bottom tabs only know about TabParamList
const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#3498db',
                tabBarInactiveTintColor: '#8e8e93',
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: '#f2f2f2',
                    elevation: 0,
                    shadowOpacity: 0,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Habitos') {
                        iconName = focused ? 'list' : 'list-outline';
                    } else if (route.name === 'Estadisticas') {
                        iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                    } else if (route.name === 'Perfil') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else {
                        iconName = 'help';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Inicio' }} />
            <Tab.Screen name="Habitos" component={HabitosScreen} options={{ tabBarLabel: 'Hábitos' }} />
            <Tab.Screen name="Estadisticas" component={EstadisticasScreen} options={{ tabBarLabel: 'Estadísticas' }} />
            <Tab.Screen name="Perfil" component={PerfilScreen} options={{ tabBarLabel: 'Perfil' }} />
        </Tab.Navigator>
    );
}

export default function MainNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Tabs" component={TabNavigator} />
            <Stack.Screen name="PrivacyTerms" component={PrivacyTermsScreen} />
            <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
            <Stack.Screen
                name="HabitHistory"
                component={HabitHistoryScreen}
                options={{ headerShown: true, title: 'Historial de Hábito' }}
            />
        </Stack.Navigator>
    );
}
