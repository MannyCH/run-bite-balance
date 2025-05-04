
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();
  
  console.log("AuthGuard - Auth state:", { user, loading, isAuthGuard: true });

  if (loading) {
    console.log("AuthGuard is showing loading state");
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <Loader className="h-8 w-8 animate-spin text-teal-500 mb-2" />
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("User not authenticated, redirecting to auth page");
    return <Navigate to="/auth" />;
  }

  console.log("User authenticated, rendering protected content");
  return <>{children}</>;
};

export default AuthGuard;
