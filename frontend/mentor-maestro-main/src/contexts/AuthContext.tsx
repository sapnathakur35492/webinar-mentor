import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axios from "axios";
import { toast } from "sonner";

// Define User type manually since we aren't using Supabase
interface User {
  id: string;
  email: string;
  full_name?: string;
  mentor_id?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use environment variable for API base URL - change in .env for production
const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'https://devwebinar.change20.no/api'}/auth`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for token in localStorage on mount
    const token = localStorage.getItem("token");
    if (token) {
      const storedUser = localStorage.getItem("user_data");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          // Corrupted data — clear it
          localStorage.removeItem("token");
          localStorage.removeItem("user_data");
        }
      }
    }
    setIsLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const response = await axios.post(`${API_BASE}/register`, {
        email,
        password,
        name: fullName, // Backend expects 'name'
      });
      console.log("Registration success", response.data);

      // Auto-login after successful registration
      const loginResponse = await axios.post(`${API_BASE}/login`, {
        email,
        password
      });

      const { access_token, user_id, mentor_id } = loginResponse.data;
      localStorage.setItem("token", access_token);

      const newUser: User = {
        id: user_id || String(response.data.id),
        email: email,
        full_name: fullName,
        mentor_id: mentor_id || undefined,
      };
      localStorage.setItem("user_data", JSON.stringify(newUser));
      setUser(newUser);

      return { error: null };
    } catch (err: any) {
      console.error(err);
      return { error: new Error(err.response?.data?.detail || "Registration failed") };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE}/login`, {
        email,
        password
      });

      const { access_token, user_id, full_name, mentor_id } = response.data;
      localStorage.setItem("token", access_token);

      const loggedInUser: User = {
        id: user_id || "unknown",
        email,
        full_name,
        mentor_id: mentor_id || undefined,
      };
      localStorage.setItem("user_data", JSON.stringify(loggedInUser));
      setUser(loggedInUser);

      return { error: null };
    } catch (err: any) {
      console.error(err);
      return { error: new Error(err.response?.data?.detail || "Login failed") };
    }
  };

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("avatar_image_url");
    localStorage.removeItem("avatar_image_path");
    localStorage.removeItem("selected_language");
    localStorage.removeItem("current_asset_id");
    localStorage.removeItem("current_job_id");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

