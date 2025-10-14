'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { Profile } from '@/lib/types';

// Let's use our own Profile type, which we can control.
export type User = Profile & {
    email?: string;
    avatar_url?: string | null;
    colegio_nombre?: string | null;
};

interface UserContextType {
  user: User | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children, user }: { children: ReactNode; user: User | null }) {
  return (
    <UserContext.Provider value={{ user }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
