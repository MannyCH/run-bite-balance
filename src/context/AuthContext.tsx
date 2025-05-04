
import React, { createContext, useContext, useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Handle the hash fragment from email confirmation
    const handleHashParams = async () => {
      // Check if we have a hash fragment in the URL (typically from email confirmations)
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        try {
          // Remove the hash to prevent issues on reload
          window.location.hash = '';
          
          // Get the session - Supabase should detect and use the hash fragment
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Error processing authentication redirect:", error);
            toast({
              title: "Authentication Error",
              description: error.message,
              variant: "destructive",
            });
          } else if (data?.session) {
            console.log("Successfully authenticated from redirect");
            setSession(data.session);
            setUser(data.session.user);
            toast({
              title: "Email Verified",
              description: "Your account has been verified successfully.",
            });
            navigate("/");
          }
        } catch (error) {
          console.error("Error handling authentication redirect:", error);
        }
      }
    };

    // First check for an existing session
    const getInitialSession = async () => {
      try {
        setLoading(true);
        // Check if we're handling a redirect first
        await handleHashParams();
        
        // Then get the current session
        const { data } = await supabase.auth.getSession();
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch (error) {
        console.error("Error checking auth session:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Then set up the auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log("Auth state changed:", event);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (event === "SIGNED_IN") {
        toast({
          title: "Signed in successfully",
          description: "Welcome back!",
        });
        navigate("/");
      } else if (event === "SIGNED_OUT") {
        toast({
          title: "Signed out successfully",
          description: "You have been signed out",
        });
        navigate("/auth");
      }
    });

    // Clean up the subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [toast, navigate]);

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "Sign up successful",
        description: "Please check your email to verify your account",
      });
      
      return { error: null };
    } catch (error: any) {
      console.error("Error signing up:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      return { error: null };
    } catch (error: any) {
      console.error("Error signing in:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        signUp,
        signIn,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
