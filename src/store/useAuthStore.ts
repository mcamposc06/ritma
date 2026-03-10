import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthState {
    session: Session | null;
    user: User | null;
    isInitialized: boolean;
    isLoading: boolean;
    setSession: (session: Session | null) => void;
    initialize: () => void;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    session: null,
    user: null,
    isInitialized: false,
    isLoading: true,

    setSession: (session) => set({
        session,
        user: session?.user || null,
        isInitialized: true,
        isLoading: false
    }),

    initialize: () => {
        // Check active session on startup
        supabase.auth.getSession().then(({ data: { session } }) => {
            set({ session, user: session?.user || null, isInitialized: true, isLoading: false });
        });

        // Listen for auth changes
        supabase.auth.onAuthStateChange((_event, session) => {
            set({ session, user: session?.user || null, isInitialized: true, isLoading: false });
        });
    },

    signOut: async () => {
        set({ isLoading: true });
        await supabase.auth.signOut();
        set({ session: null, user: null, isLoading: false });
    }
}));
