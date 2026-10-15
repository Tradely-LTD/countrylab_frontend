import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { createClient } from "@supabase/supabase-js";
import { api } from "./api";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  /** Display name of the role (custom roles have no built-in label) */
  role_name?: string;
  /** "module.action" permissions granted to this user's role */
  permissions?: string[];
  tenant_id: string;
  avatar_url?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  networkError: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Exact role match — for data scoping only; gate features with can() */
  isRole: (...roles: string[]) => boolean;
  /** True when the user holds ANY of the given permissions */
  can: (...permissions: string[]) => boolean;
  /** Re-fetch the profile, e.g. after editing your own role's permissions */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        localStorage.setItem("sb-session", JSON.stringify(session));
        fetchProfile();
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        localStorage.setItem("sb-session", JSON.stringify(session));
        fetchProfile();
      } else {
        localStorage.removeItem("sb-session");
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile() {
    try {
      const { data } = await api.get("/users/me");
      setNetworkError(false);
      setUser(data.data);
    } catch (err: any) {
      const status = err?.response?.status;
      const code = err?.response?.data?.code;
      if (status === 503 || code === "NETWORK_UNREACHABLE") {
        setNetworkError(true);
      }
      // fallback: use Supabase user
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    if (data.session) {
      localStorage.setItem("sb-session", JSON.stringify(data.session));
      await fetchProfile();
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem("sb-session");
    setUser(null);
  }

  function isRole(...roles: string[]) {
    return !!user && roles.includes(user.role);
  }

  function can(...permissions: string[]) {
    const held = user?.permissions ?? [];
    return permissions.some((p) => held.includes(p));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        networkError,
        login,
        logout,
        isRole,
        can,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export { supabase };
