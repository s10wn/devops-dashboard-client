import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens } from '@shared/types';
import { setTokens, clearTokens, getAccessToken } from '@shared/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateTokens: (tokens: AuthTokens) => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      login: (user, tokens) => {
        setTokens(tokens.accessToken, tokens.refreshToken);
        set({ user, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        clearTokens();
        set({ user: null, isAuthenticated: false, isLoading: false });
      },

      setLoading: (isLoading) => set({ isLoading }),

      updateTokens: (tokens) => {
        setTokens(tokens.accessToken, tokens.refreshToken);
      },

      checkAuth: () => {
        const token = getAccessToken();
        const hasAuth = !!token && !!get().user;
        set({ isAuthenticated: hasAuth, isLoading: false });
        return hasAuth;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
