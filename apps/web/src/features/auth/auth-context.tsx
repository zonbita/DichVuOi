import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { api } from '../../services/api';
import type { AuthResponse, AuthUser } from '../../types/auth';

const TOKEN_KEY = 'dichvuoi_token';
const MODE_KEY = 'dichvuoi_mode';

/**
 * Auth trên web — hai lớp khác nhau:
 * - `user.role` (UserRole): quyền hệ thống từ DB/API/JWT — CUSTOMER | PARTNER | ADMIN | MODERATOR.
 *   Lưu trong JWT payload; client chỉ giữ token, gọi `/api/auth/me` để lấy `user.role`.
 * - `mode` (AppMode): chế độ UI khách thuê vs người làm — `hire` | `offer`.
 *   Chỉ lưu localStorage `dichvuoi_mode`, không nằm trong JWT/DB.
 * - `canOffer`: có `partnerProfile` mới bật mode `offer` (không chỉ dựa vào role PARTNER).
 */
export type AppMode = 'hire' | 'offer';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  /** Chế độ UI hiện tại: khách thuê hoặc người làm (cùng 1 account). */
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  login: (email: string, password: string) => Promise<AuthResponse>;
  loginWithGoogle: (idToken: string) => Promise<AuthResponse>;
  register: (input: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    enableOffering?: boolean;
  }) => Promise<AuthResponse>;
  applySession: (session: AuthResponse) => void;
  logout: () => void;
  refreshMe: () => Promise<void>;
  canOffer: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredMode(): AppMode {
  const raw = localStorage.getItem(MODE_KEY);
  return raw === 'offer' ? 'offer' : 'hire';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);
  const [mode, setModeState] = useState<AppMode>(() => readStoredMode());

  const setMode = useCallback((next: AppMode) => {
    localStorage.setItem(MODE_KEY, next);
    setModeState(next);
  }, []);

  const applySession = useCallback((session: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, session.accessToken);
    setToken(session.accessToken);
    setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setMode('hire');
  }, [setMode]);

  const refreshMe = useCallback(async () => {
    const current = localStorage.getItem(TOKEN_KEY);
    if (!current) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me(current);
      setToken(current);
      setUser(me);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  /** Chỉ khi đã có PartnerProfile — role PARTNER/ADMIN orphan không đủ để sửa hồ sơ / tải avatar. */
  const canOffer = Boolean(user?.partnerProfile);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      mode,
      setMode,
      canOffer,
      login: async (email, password) => {
        const session = await api.login({ email, password });
        applySession(session);
        return session;
      },
      loginWithGoogle: async (idToken) => {
        const session = await api.loginWithGoogle({ idToken });
        applySession(session);
        setMode('hire');
        return session;
      },
      register: async (input) => {
        const session = await api.register(input);
        applySession(session);
        if (input.enableOffering) setMode('offer');
        else setMode('hire');
        return session;
      },
      applySession,
      logout,
      refreshMe,
    }),
    [user, token, loading, mode, setMode, canOffer, applySession, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải nằm trong AuthProvider');
  return ctx;
}
