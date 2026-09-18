import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import * as authApi from "./api/auth";
import { registerTokenGetter, registerUnauthorizedHandler } from "./api/client";
import type { User } from "./api/types";

const STORAGE_KEY = "simatei.auth.v1";

type StoredSession = { user: User; token: string; savedAt: number };

/** The backend issues 7-day JWTs; we treat a stored session as stale after that. */
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

let memoryToken: string | null = null;
registerTokenGetter(() => memoryToken);

function readStored(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.token || !parsed?.user) return null;
    if (parsed.savedAt && Date.now() - parsed.savedAt > SEVEN_DAYS_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(session: StoredSession | null) {
  if (typeof window === "undefined") return;
  if (session) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(STORAGE_KEY);
}

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** False until the stored session has been read from the browser. */
  isReady: boolean;
  setSession: (user: User, token: string) => void;
  setUser: (user: User) => void;
  signOut: (options?: { callApi?: boolean }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = readStored();
    if (stored) {
      memoryToken = stored.token;
      setToken(stored.token);
      setUserState(stored.user);
    } else {
      writeStored(null);
    }
    setIsReady(true);
  }, []);

  const setSession = useCallback((nextUser: User, nextToken: string) => {
    memoryToken = nextToken;
    setToken(nextToken);
    setUserState(nextUser);
    writeStored({ user: nextUser, token: nextToken, savedAt: Date.now() });
  }, []);

  const setUser = useCallback((nextUser: User) => {
    setUserState(nextUser);
    const current = memoryToken;
    if (current) writeStored({ user: nextUser, token: current, savedAt: Date.now() });
  }, []);

  const clear = useCallback(() => {
    memoryToken = null;
    setToken(null);
    setUserState(null);
    writeStored(null);
  }, []);

  const signOut = useCallback(
    async (options?: { callApi?: boolean }) => {
      if (options?.callApi !== false && memoryToken) {
        try {
          await authApi.logout();
        } catch {
          // Logout is stateless on the backend; clearing locally is sufficient.
        }
      }
      clear();
    },
    [clear],
  );

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      memoryToken = null;
      writeStored(null);
      setToken(null);
      setUserState(null);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isAdmin: user?.role === "admin",
      isReady,
      setSession,
      setUser,
      signOut,
    }),
    [user, token, isReady, setSession, setUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
