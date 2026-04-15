import React, { useEffect } from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import { useAuthStore } from '../store/useAuthStore';
import { RootStackParamList } from './types';
import { useAppTheme } from '../utils/theme';

const prefix = Linking.createURL('/');

export default function AppNavigator() {
    const { session, isInitialized, initialize } = useAuthStore();
    const { navigationTheme, colors } = useAppTheme();

    useEffect(() => {
        initialize();
    }, [initialize]);

    if (!isInitialized) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const linking: LinkingOptions<RootStackParamList> = {
        prefixes: [prefix],
        config: {
            screens: {
                Auth: {
                    screens: {
                        Login: 'login',
                        Register: 'register',
                        PrivacyTerms: 'privacy-terms',
                    },
                },
                Main: {
                    screens: {
                        Tabs: {
                            screens: {
                                Home: 'home',
                                Habitos: 'habits',
                                Estadisticas: 'stats',
                                Perfil: 'profile',
                            },
                        },
                        HabitDetail: 'habit/:habitId',
                        HabitHistory: 'habit-history/:habitId',
                    },
                },
            },
        },
    };

    return (
        <NavigationContainer linking={linking} theme={navigationTheme}>
            {session ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
}
