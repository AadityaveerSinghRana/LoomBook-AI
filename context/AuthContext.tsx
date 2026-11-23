import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../supabaseClient';
import { Session } from '@supabase/supabase-js';

export const DEMO_AUTH_EMAIL = 'xyz@gmail.com';
export const DEMO_AUTH_PASSWORD = '12345678';
const DEMO_STORAGE_KEY = 'loombook_demo_user';

interface DemoStoredUser extends User {
  displayName?: string;
  timezone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isDemoUser: boolean;
  signInDemo: (email: string, password: string) => { ok: boolean; error?: string };
  updateDemoProfile: (updates: { fullName?: string; displayName?: string; timezone?: string; avatarUrl?: string }) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredDemoUser(): DemoStoredUser | null {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoStoredUser;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [loading, setLoading] = useState(true);

  const mapSessionToUser = (session: Session): User => {
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
      avatarUrl: session.user.user_metadata?.avatar_url,
    };
  };

  useEffect(() => {
    // Capture OAuth tokens/codes if redirected to root before HashRouter normalizes hash
    const initSession = async () => {
      try {
        const hash = window.location.hash || '';
        const search = window.location.search || '';

        if (hash.includes('access_token=')) {
          const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            window.history.replaceState(null, '', `${window.location.pathname}${search}#/`);
          }
        } else if (search.includes('code=')) {
          const searchParams = new URLSearchParams(search);
          const code = searchParams.get('code');
          if (code) {
            await supabase.auth.exchangeCodeForSession(code);
            window.history.replaceState(null, '', `${window.location.pathname}#/`);
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(mapSessionToUser(session));
          setIsDemoUser(false);
        } else {
          const demoUser = readStoredDemoUser();
          if (demoUser) {
            setUser(demoUser);
            setIsDemoUser(true);
          }
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    void initSession();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        localStorage.removeItem(DEMO_STORAGE_KEY);
        setUser(mapSessionToUser(session));
        setIsDemoUser(false);
      } else {
        const demoUser = readStoredDemoUser();
        if (demoUser) {
          setUser(demoUser);
          setIsDemoUser(true);
        } else {
          setUser(null);
          setIsDemoUser(false);
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInDemo = (email: string, password: string): { ok: boolean; error?: string } => {
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== DEMO_AUTH_EMAIL || password !== DEMO_AUTH_PASSWORD) {
      return { ok: false, error: 'Invalid email or password.' };
    }

    const existing = readStoredDemoUser();
    const demoUser: DemoStoredUser = existing || {
      id: 'demo-user-xyz',
      email: DEMO_AUTH_EMAIL,
      name: 'Demo Publisher',
      displayName: 'Publisher',
      timezone: 'UTC-8 (Pacific Time)',
    };

    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoUser));
    } catch {
      // ignore storage errors
    }

    setUser(demoUser);
    setIsDemoUser(true);
    return { ok: true };
  };

  const updateDemoProfile = (updates: {
    fullName?: string;
    displayName?: string;
    timezone?: string;
    avatarUrl?: string;
  }) => {
    const current = readStoredDemoUser() || {
      id: 'demo-user-xyz',
      email: DEMO_AUTH_EMAIL,
      name: 'Demo Publisher',
    };
    const next: DemoStoredUser = {
      ...current,
      name: updates.fullName ?? current.name,
      displayName: updates.displayName ?? current.displayName,
      timezone: updates.timezone ?? current.timezone,
      avatarUrl: updates.avatarUrl ?? current.avatarUrl,
    };
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
    setUser(next);
  };

  const logout = async () => {
    try {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      setIsDemoUser(false);
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isDemoUser,
        signInDemo,
        updateDemoProfile,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};