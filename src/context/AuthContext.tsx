import React, { createContext, useContext, useState, useEffect } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Ensure user profile exists
  const ensureUserProfile = async (userId: string) => {
    try {
      console.log("Ensuring profile exists for user:", userId);
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
      } else {
        console.log('User profile found:', profile.id);
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  useEffect(() => {
    console.log("AuthContext - Setting up auth state");
    const setupAuth = async () => {
      try {
        setLoading(true);

        // First set up the auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          console.log("Auth state changed:", event);
          console.log("Session present:", !!currentSession);
          
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (event === "SIGNED_IN" && currentSession) {
            console.log("User signed in, ensuring profile");
            
            // Ensure user profile exists but don't wait on it
            setTimeout(() => {
              ensureUserProfile(currentSession.user.id);
            }, 0);
            
            toast({
              title: "Signed in successfully",
              description: "Welcome back!",
            });
          } else if (event === "SIGNED_OUT") {
            console.log("User signed out");
            toast({
              title: "Signed out successfully",
              description: "You have been signed out",
            });
          }
        });
        
        // Then check for an existing session
        console.log("Checking for existing session");
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log("Found existing session for user:", data.session.user.email);
          setSession(data.session);
          setUser(data.session.user);
          
          // Ensure profile exists but don't wait on it
          setTimeout(() => {
            ensureUserProfile(data.session.user.id);
          }, 0);
        } else {
          console.log("No existing session found");
        }
        
        // Clean up function to unsubscribe
        return () => {
          console.log("Cleaning up auth subscription");
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error setting up auth:", error);
      } finally {
        console.log("Auth setup complete, setting loading to false");
        setLoading(false);
      }
    };
    
    // Run the setup
    const cleanup = setupAuth();
    
    // Return cleanup function
    return () => {
      cleanup.then(unsubscribe => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [toast]);

  const signUp = async (email: string, password: string) => {
    try {
      console.log("Attempting sign up for:", email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) {
        console.error("Sign up error:", error);
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      console.log("Sign up successful, confirmation email sent");
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
      console.log("Attempting sign in for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Sign in error:", error);
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      console.log("Sign in successful");
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
      console.log("Signing out");
      await supabase.auth.signOut();
      console.log("Sign out completed");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      console.log("Attempting to send password reset email to:", email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth',
      });
      
      if (error) {
        console.error("Password reset error:", error);
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }
      
      console.log("Password reset email sent");
      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link",
      });
      
      return { error: null };
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      return { error };
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
      
      // Remove the navigate call as it's not available in this context
      // The AuthGuard component will handle redirecting unauthenticated users
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
        resetPassword,
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
