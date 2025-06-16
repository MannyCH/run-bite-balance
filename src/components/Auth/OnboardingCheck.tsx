
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { useToast } from "@/hooks/use-toast";

interface OnboardingCheckProps {
  children: React.ReactNode;
}

export const OnboardingCheck: React.FC<OnboardingCheckProps> = ({ children }) => {
  const { user } = useAuth();
  const { isOnboardingComplete, checkOnboardingStatus, isLoading } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || isLoading) return;

    // Don't check on these routes
    const excludedRoutes = ['/onboarding', '/auth'];
    if (excludedRoutes.includes(location.pathname)) {
      return;
    }

    const checkProfileCompletion = async () => {
      const isComplete = await checkOnboardingStatus();
      
      // If profile is incomplete and we're not already on the setup page, redirect
      if (!isComplete) {
        toast({
          title: "Complete Your Profile",
          description: "Please complete your profile to get personalized recommendations.",
        });
        navigate('/onboarding');
      }
    };

    checkProfileCompletion();
  }, [user, isLoading, navigate, location.pathname, checkOnboardingStatus, toast]);

  // Render children while the check is happening or if onboarding is complete
  return <>{children}</>;
};

export default OnboardingCheck;
