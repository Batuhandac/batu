import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { Profile, Tier } from '@/types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  isGuest: boolean;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  fetchProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  enterGuestMode: () => void;
}

const GUEST_USER_ID = 'guest-local';

const guestUser = {
  id: GUEST_USER_ID,
  email: 'misafir@batu.local',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
} as unknown as User;

const guestSession = {
  access_token: 'guest',
  refresh_token: 'guest',
  expires_in: 999999,
  expires_at: Date.now() / 1000 + 999999,
  token_type: 'bearer',
  user: guestUser,
} as unknown as Session;

const guestProfile: Profile = {
  id: GUEST_USER_ID,
  username: 'misafir',
  displayName: 'Misafir',
  tier: 'free',
  scanCountMonth: 0,
  createdAt: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: false,
  initialized: false,
  isGuest: false,

  setSession: (session) => {
    set({ session, user: session?.user ?? null });
  },

  setProfile: (profile) => {
    set({ profile });
  },

  fetchProfile: async () => {
    const user = get().user;
    if (!user || get().isGuest || !isSupabaseConfigured) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !data) return;

    set({
      profile: {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        tier: data.tier as Tier,
        scanCountMonth: data.scan_count_month,
        createdAt: data.created_at,
      },
    });
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error('Giriş için Supabase yapılandırılmamış. Misafir olarak devam edebilirsin.');
    }
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    if (error) throw error;
  },

  signUp: async (email, password, username) => {
    if (!isSupabaseConfigured) {
      throw new Error('Kayıt için Supabase yapılandırılmamış. Misafir olarak devam edebilirsin.');
    }
    set({ loading: true });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, display_name: username },
      },
    });
    set({ loading: false });
    if (error) throw error;
  },

  signOut: async () => {
    if (get().isGuest || !isSupabaseConfigured) {
      set({ session: null, user: null, profile: null, isGuest: false });
      return;
    }
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null, isGuest: false });
  },

  updateProfile: async (updates) => {
    if (get().isGuest || !isSupabaseConfigured) {
      const current = get().profile;
      if (current) set({ profile: { ...current, ...updates } });
      return;
    }

    const user = get().user;
    if (!user) return;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

    const { error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', user.id);

    if (error) throw error;

    const current = get().profile;
    if (current) set({ profile: { ...current, ...updates } });
  },

  enterGuestMode: () => {
    set({
      session: guestSession,
      user: guestUser,
      profile: guestProfile,
      isGuest: true,
    });
  },
}));

