import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { useAuthStore } from '../store/useAuthStore';
import { View, ActivityIndicator } from 'react-native';

export default function AppNavigator() {
    const { session, isInitialized, initialize } = useAuthStore();

    useEffect(() => {
        initialize();
    }, [initialize]);

    if (!isInitialized) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#3498db" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {session ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
}
