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
    // Función asíncrona para verificar la sesión inicial de forma robusta.
    const initializeSession = async () => {
      try {
        // Esperamos a que Supabase nos dé la sesión.
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (initialSession) {
          setSession(initialSession);
          // Sincronizamos con localStorage por si acaso.
          localStorage.setItem('supabase_session', JSON.stringify(initialSession));
        } else {
          // Si no hay sesión, nos aseguramos que localStorage esté limpio.
          localStorage.removeItem('supabase_session');
        }
      } catch (error) {
        console.error("Error initializing session:", error);
        setSession(null);
        localStorage.removeItem('supabase_session');
      } finally {
        // Crucial: marcamos la carga como finalizada solo después de la verificación.
        setLoading(false);
      }
    };

    initializeSession();

    // El listener sigue siendo importante para cambios en tiempo real.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        if (currentSession) {
          localStorage.setItem('supabase_session', JSON.stringify(currentSession));
        } else {
          localStorage.removeItem('supabase_session');
        }
        // Si el listener se activa, la carga ya debería haber terminado,
        // pero es seguro ponerlo en false de nuevo.
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase.auth]);

  const login = (sessionData: Session) => {
    setSession(sessionData);
    localStorage.setItem('supabase_session', JSON.stringify(sessionData));
    // Usamos replace para que la página de login no quede en el historial.
    router.replace('/dashboard');
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    localStorage.removeItem('supabase_session');
    // Usar replace para una redirección limpia.
    router.replace('/');
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
