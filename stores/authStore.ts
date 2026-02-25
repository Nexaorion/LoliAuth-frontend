import { create } from "zustand";
import { getToken, setToken, removeToken } from "@/lib/auth";
import { login as loginApi, getProfile } from "@/lib/api/account";
import type { User, LoginRequest } from "@/types";

interface AuthState {
  token: string | null;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;

  login: (data: LoginRequest) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAdmin: false,
  loading: false,

  hydrate: () => {
    const token = getToken();
    if (token) {
      set({ token });
    }
  },

  login: async (data: LoginRequest) => {
    const res = await loginApi(data);
    setToken(res.access_token, res.expires_in);
    set({ token: res.access_token });
    await get().loadProfile();
  },

  logout: () => {
    removeToken();
    set({ token: null, user: null, isAdmin: false });
  },

  loadProfile: async () => {
    try {
      set({ loading: true });
      const user = await getProfile();
      const isAdmin = (user as unknown as { role?: string }).role === "admin";
      set({ user, isAdmin, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
