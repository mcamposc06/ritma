import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { useHabitStore } from './useHabitStore';

let didSetupAuthListener = false;

const ensureProfileRow = async (user: User) => {
    try {
        // Ensures FK references to public.profiles(id) won't fail even if the DB trigger wasn't applied.
        const { error } = await supabase
            .from('profiles')
            .upsert(
                {
                    id: user.id,
                    email: user.email ?? null,
                },
                { onConflict: 'id' }
            );

        if (error) {
            console.warn('Failed to ensure profile row:', error);
        }
    } catch (e) {
        console.warn('Failed to ensure profile row:', e);
    }
};

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
        if (didSetupAuthListener) return;
        didSetupAuthListener = true;

        // Check active session on startup
        supabase.auth.getSession().then(({ data: { session } }) => {
            set({ session, user: session?.user || null, isInitialized: true, isLoading: false });
            if (session?.user) {
                ensureProfileRow(session.user);
            }
        });

        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            set({ session, user: session?.user || null, isInitialized: true, isLoading: false });

            if (event === 'SIGNED_OUT') {
                useHabitStore.getState().reset();
                return;
            }

            if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
                ensureProfileRow(session.user);
            }
        });
    },

    signOut: async () => {
        set({ isLoading: true });
        await supabase.auth.signOut();
        set({ session: null, user: null, isLoading: false });
        // clear habit data as well
        useHabitStore.getState().reset();
    }
}));
