
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ForgotPasswordFormProps {
  email: string;
  setEmail: (email: string) => void;
  onBackToSignIn: () => void;
}

const ForgotPasswordForm = ({ email, setEmail, onBackToSignIn }: ForgotPasswordFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log("Attempting password reset for:", email);
      const { error } = await resetPassword(email);
      if (error) {
        console.error("Password reset error:", error);
        toast({
          title: "Password reset failed",
          description: error.message || "Please check your email and try again",
          variant: "destructive",
        });
      } else {
        console.log("Password reset email sent");
        toast({
          title: "Password reset link sent",
          description: "Please check your email for a password reset link",
        });
        onBackToSignIn(); // Return to sign in view
      }
    } catch (err) {
      console.error("Unexpected password reset error:", err);
      toast({
        title: "Password reset failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="max-w-md w-full p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Reset Password</h1>
          <p className="text-gray-500 mt-2">
            Enter your email to receive a password reset link
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>
              Enter your email address to receive a password reset link
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleForgotPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
              <Button 
                variant="link" 
                type="button"
                className="w-full"
                onClick={onBackToSignIn}
              >
                Back to Sign In
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
