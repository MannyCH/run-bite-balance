
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function IncompleteProfileNotice() {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-8">
      <h3 className="text-lg font-semibold mb-2">Your Profile is Incomplete</h3>
      <p className="text-muted-foreground mb-4">
        Complete your profile setup to get personalized meal recommendations.
      </p>
      <Button onClick={() => navigate('/profile-setup')}>
        Complete Profile Setup
      </Button>
    </div>
  );
}
