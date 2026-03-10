import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
};

export type MainStackParamList = {
    Home: undefined;
    Habitos: undefined;
    Perfil: undefined;
};

export type RootStackParamList = {
    Auth: NavigatorScreenParams<AuthStackParamList>;
    Main: NavigatorScreenParams<MainStackParamList>;
};
