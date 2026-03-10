import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainStackParamList } from './types';
import HomeScreen from '../screens/HomeScreen';
import HabitosScreen from '../screens/HabitosScreen';
import PerfilScreen from '../screens/PerfilScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator<MainStackParamList>();

export default function MainNavigator() {
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
                    } else if (route.name === 'Perfil') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else {
                        iconName = 'help'; // default fallback
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Inicio' }} />
            <Tab.Screen name="Habitos" component={HabitosScreen} options={{ tabBarLabel: 'Hábitos' }} />
            <Tab.Screen name="Perfil" component={PerfilScreen} options={{ tabBarLabel: 'Perfil' }} />
        </Tab.Navigator>
    );
}
