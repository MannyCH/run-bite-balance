
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Run } from '@/context/types';

interface CalorieEstimate {
  caloriesBurned: number;
  recommendedIntake: number;
  explanation: string;
}

export const useRunCalories = (run: Run | null) => {
  const [calorieEstimate, setCalorieEstimate] = useState<CalorieEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!run || !user?.id || !run.isImported) {
      setCalorieEstimate(null);
      return;
    }

    const estimateCalories = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: functionError } = await supabase.functions.invoke('estimate-run-calories', {
          body: {
            runData: run,
            userId: user.id
          }
        });

        if (functionError) {
          throw functionError;
        }

        setCalorieEstimate(data);
      } catch (err) {
        console.error('Error estimating calories:', err);
        setError(err instanceof Error ? err.message : 'Failed to estimate calories');
        
        // Fallback estimation
        const fallbackBurn = Math.round(run.distance * 60);
        setCalorieEstimate({
          caloriesBurned: fallbackBurn,
          recommendedIntake: Math.round(fallbackBurn * 1.2),
          explanation: "Fallback estimation: ~60 calories per km with 20% recovery buffer"
        });
      } finally {
        setIsLoading(false);
      }
    };

    estimateCalories();
  }, [run?.id, user?.id]);

  return { calorieEstimate, isLoading, error };
};
