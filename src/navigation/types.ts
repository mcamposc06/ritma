import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
    PrivacyTerms: { type: 'privacy' | 'terms' };
};

export type MainTabParamList = {
    Home: undefined;
    Habitos: undefined;
    Estadisticas: undefined;
    Perfil: undefined;
};

export type MainStackParamList = {
    MainTabs: NavigatorScreenParams<MainTabParamList>;
    PrivacyTerms: { type: 'privacy' | 'terms' };
    HabitDetail: { habitId: string };
};

export type RootStackParamList = {
    Auth: NavigatorScreenParams<AuthStackParamList>;
    Main: NavigatorScreenParams<MainStackParamList>;
};
