
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MainLayout from "@/components/Layout/MainLayout";
import AuthLoadingState from "@/components/Auth/AuthLoadingState";
import SignInForm from "@/components/Auth/SignInForm";
import SignUpForm from "@/components/Auth/SignUpForm";
import ForgotPasswordForm from "@/components/Auth/ForgotPasswordForm";
import AuthHeader from "@/components/Auth/AuthHeader";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  console.log("Auth page - Auth state:", { user, loading, isOnAuthPage: true });

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (user && !loading) {
      console.log("User is logged in, redirecting to home", user);
      navigate("/");
    }
  }, [user, navigate, loading]);

  // Show a loading indicator if we're checking auth status
  if (loading) {
    console.log("Auth page is showing loading state");
    return (
      <MainLayout>
        <AuthLoadingState />
      </MainLayout>
    );
  }

  if (isForgotPassword) {
    return (
      <MainLayout>
        <ForgotPasswordForm 
          email={email} 
          setEmail={setEmail} 
          onBackToSignIn={() => setIsForgotPassword(false)}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="max-w-md w-full p-4">
          <AuthHeader 
            title="Welcome to RunBiteFit" 
            subtitle="Track your nutrition and running activities"
          />

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <SignInForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                onForgotPassword={() => setIsForgotPassword(true)}
              />
            </TabsContent>
            
            <TabsContent value="signup">
              <SignUpForm
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default Auth;
