import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
    PrivacyTerms: { type: 'privacy' | 'terms' };
};

// bottom tab nav parameters
export type TabParamList = {
    Home: undefined;
    Habitos: undefined;
    Estadisticas: undefined;
    Perfil: undefined;
};

// stack above tabs – allows pushing screens like history, detail, and privacy
export type MainStackParamList = {
    Tabs: NavigatorScreenParams<TabParamList>;
    PrivacyTerms: { type: 'privacy' | 'terms' };
    HabitDetail: { habitId: string };
    HabitHistory: { habitId: string; title: string };
};

export type RootStackParamList = {
    Auth: NavigatorScreenParams<AuthStackParamList>;
    Main: NavigatorScreenParams<MainStackParamList>;
};
