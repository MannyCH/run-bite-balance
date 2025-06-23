
import React, { useEffect, useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import ActivityTimeline from "../components/Dashboard/ActivityTimeline";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useMealPlan } from "@/hooks/useMealPlan";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CalendarCheck } from "lucide-react";

const Index: React.FC = () => {
  const { user } = useAuth();
  const { runs } = useApp();
  const { mealPlanItems, recipes } = useMealPlan();
  const [hasMealPlan, setHasMealPlan] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user has a meal plan when the component mounts
  useEffect(() => {
    const checkMealPlan = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('meal_plans')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (!error && data && data.length > 0) {
          setHasMealPlan(true);
        }
      } catch (error) {
        console.error('Error checking meal plan:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkMealPlan();
  }, [user?.id]);

  // Filter for only imported runs
  const importedRuns = runs.filter(run => run.isImported);

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Track your nutrition and training all in one place
        </p>
      </div>

      {hasMealPlan && !isLoading && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CalendarCheck className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Meal Plan Available</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span className="text-green-700">You have a personalized meal plan ready to view.</span>
            <Button 
              onClick={() => navigate('/meal-planner')}
              variant="outline" 
              className="border-green-300 hover:bg-green-100 text-green-800"
            >
              View Meal Plan
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6">
        <ActivityTimeline 
          runs={importedRuns} 
          mealPlanItems={mealPlanItems} 
          recipes={recipes}
        />
      </div>
    </MainLayout>
  );
};

export default Index;
