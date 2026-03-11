import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

// bottom tab nav parameters
export type TabParamList = {
    Home: undefined;
    Habitos: undefined;
    Estadisticas: undefined;
    Perfil: undefined;
};

// stack above tabs – allows pushing screens like history
export type MainStackParamList = {
    Tabs: NavigatorScreenParams<TabParamList>;
    HabitHistory: { habitId: string; title: string };
};

export type RootStackParamList = {
    Auth: NavigatorScreenParams<AuthStackParamList>;
    Main: NavigatorScreenParams<MainStackParamList>;
};
