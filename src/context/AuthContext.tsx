
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
  deleteAccount: () => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Ensure user profile exists
  const ensureUserProfile = async (userId: string) => {
    try {
      // Check if profile exists
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (fetchError || !profile) {
        console.log('Profile not found, creating new profile');
        // Create a new profile if none exists
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: userId }]);
          
        if (insertError) {
          console.error('Error creating user profile:', insertError);
        } else {
          console.log('Created new user profile');
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        setLoading(true);
        
        // Get the current session
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log("Found existing session");
          setSession(data.session);
          setUser(data.session.user);
          // Ensure profile exists for this user
          await ensureUserProfile(data.session.user.id);
        }
      } catch (error) {
        console.error("Error checking auth session:", error);
      } finally {
        setLoading(false);
      }
    };

    // First get the initial session
    getInitialSession();

    // Then set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("Auth state changed:", event);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (event === "SIGNED_IN" && currentSession) {
        // Ensure user profile exists after sign in
        await ensureUserProfile(currentSession.user.id);
        
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
        options: {
          // Use the actual URL of the app
          emailRedirectTo: window.location.origin
        }
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

  const deleteAccount = async () => {
    try {
      if (!user || !session) {
        toast({
          title: "Error",
          description: "You need to be logged in to delete your account",
          variant: "destructive",
        });
        return { error: new Error("User not authenticated") };
      }

      // Call our edge function to delete the user account
      const { error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (error) {
        console.error("Error deleting account:", error);
        toast({
          title: "Account deletion failed",
          description: error.message || "An unexpected error occurred",
          variant: "destructive",
        });
        return { error };
      }
      
      toast({
        title: "Account deleted successfully",
        description: "Your account has been permanently deleted",
      });
      
      // The user should be automatically signed out after account deletion
      // But we'll call signOut just to be sure
      await signOut();
      
      navigate("/auth");
      return { error: null };
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast({
        title: "Account deletion failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
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
        deleteAccount,
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
