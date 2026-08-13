import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Player = {
  id: string;
  user_metadata: {
    user_name: string;
    full_name: string;
  };
};

type AuthState = {
  user: Player | null;
  loading: boolean;
  signInWithUsername: (username: string) => Promise<string | null>;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);
const PLAYER_STORAGE_KEY = 'labyrinth-player-name';

function toPlayer(username: string): Player {
  return {
    id: username,
    user_metadata: { user_name: username, full_name: username },
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem(PLAYER_STORAGE_KEY);
    if (saved) setUser(toPlayer(saved));
    setLoading(false);
  }, []);

  const signInWithUsername = async (enteredUsername: string) => {
    const username = enteredUsername.trim().replace(/^@/, '');
    if (!/^[a-zA-Z0-9_]{1,15}$/.test(username)) {
      return 'Use 1–15 letters, numbers, or underscores.';
    }

    window.localStorage.setItem(PLAYER_STORAGE_KEY, username);
    setUser(toPlayer(username));
    return null;
  };

  const signOut = () => {
    window.localStorage.removeItem(PLAYER_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithUsername, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
