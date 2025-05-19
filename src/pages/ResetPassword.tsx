
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [stage, setStage] = useState<"verifying" | "ready" | "done" | "error">("verifying");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const access_token = url.searchParams.get("access_token");
    const type = url.searchParams.get("type");

    if (access_token && type === "recovery") {
      supabase.auth.setSession({ access_token, refresh_token: "" }).then(({ error }) => {
        if (error) {
          console.error("Token verification failed:", error.message);
          toast({
            title: "Invalid or expired link",
            description: error.message,
            variant: "destructive",
          });
          setStage("error");
        } else {
          setStage("ready");
        }
      });
    } else {
      setStage("error");
    }
  }, [toast]);

  const handlePasswordUpdate = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
      });
      setStage("done");
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate("/auth");
      }, 3000);
    }

    setIsUpdating(false);
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-md p-4">
          <Card>
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                {stage === "verifying" && "Verifying reset link..."}
                {stage === "ready" && "Enter your new password below"}
                {stage === "done" && "Password updated successfully"}
                {stage === "error" && "Invalid or expired reset link"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {stage === "verifying" && (
                <div className="flex items-center gap-2">
                  <Loader className="animate-spin h-4 w-4" />
                  <span>Verifying token...</span>
                </div>
              )}

              {stage === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This password reset link is invalid or has expired.
                  </AlertDescription>
                </Alert>
              )}

              {stage === "done" && (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Your password has been updated. You may now log in.
                  </AlertDescription>
                </Alert>
              )}

              {stage === "ready" && (
                <div className="space-y-2">
                  <label htmlFor="new-password" className="block text-sm font-medium">
                    New Password
                  </label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              )}
            </CardContent>

            {stage === "ready" && (
              <CardFooter>
                <Button className="w-full" onClick={handlePasswordUpdate} disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </CardFooter>
            )}

            {(stage === "error" || stage === "done") && (
              <CardFooter>
                <Button className="w-full" onClick={() => navigate("/auth")}>
                  Back to Login
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
