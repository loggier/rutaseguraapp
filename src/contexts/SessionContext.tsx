
// src/contexts/SessionContext.tsx
'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

type SessionContextType = {
  session: Session | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (sessionData: Session) => void;
  logout: () => void;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // 1. Check for an active session from Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        localStorage.setItem('supabase_session', JSON.stringify(session));
      }
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) {
          localStorage.setItem('supabase_session', JSON.stringify(session));
        } else {
          localStorage.removeItem('supabase_session');
        }
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = (sessionData: Session) => {
    setSession(sessionData);
    localStorage.setItem('supabase_session', JSON.stringify(sessionData));
    router.push('/dashboard');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    localStorage.removeItem('supabase_session');
    // Usamos window.location para forzar una recarga y limpiar estado
    window.location.href = '/';
  };

  const contextValue = {
    session,
    isLoggedIn: !!session,
    loading,
    login,
    logout,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
