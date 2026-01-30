import { createContext, useContext, useEffect, useState, ReactNode } from "react";
// import { User, Session } from "@supabase/supabase-js"; // REMOVE Supabase types
// import { supabase } from "@/integrations/supabase/client"; // REMOVE Supabase client
import axios from "axios";
import { toast } from "sonner";

// Define User type manually since we aren't using Supabase
interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface AuthContextType {
  user: User | null;
  // session: Session | null; // We don't need Session object anymore, verify usage
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
      // Ideally verify token with backend here, for now just decode or assume validity
      // For simplicity in this step, we will verify by trying to fetch user profile if endpoint exists
      // Or just persist the user state.

      // Let's assume we store user details in localStorage too for simplicity or fetch them
      const storedUser = localStorage.getItem("user_data");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
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

      const { access_token } = loginResponse.data;
      localStorage.setItem("token", access_token);

      const newUser = { id: response.data.id || "jwt-user", email: email, full_name: fullName };
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

      const { access_token } = response.data;
      localStorage.setItem("token", access_token);

      // We need to set the User state. 
      // Since login only returns token, we should probably construct a basic user object 
      // or fetch "me" endpoint. For now, let's construct from email.
      // Ideally we should decode JWT.
      const fakeUser = { id: "jwt-user", email: email };
      localStorage.setItem("user_data", JSON.stringify(fakeUser));
      setUser(fakeUser);

      return { error: null };
    } catch (err: any) {
      console.error(err);
      return { error: new Error(err.response?.data?.detail || "Login failed") };
    }
  };

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_data");
    setUser(null);
    window.location.href = "https://devui.change20.no/";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signUp, signIn, signOut } as any}>
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

