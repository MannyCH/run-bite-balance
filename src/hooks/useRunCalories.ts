
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { Run } from '@/context/types';

interface CalorieEstimate {
  caloriesBurned: number;
  recommendedIntake: number;
  explanation: string;
}

export const useRunCalories = (run: Run | null) => {
  const [calorieEstimate, setCalorieEstimate] = useState<CalorieEstimate | null>(null);
  const { user } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    if (!run || !user?.id || !run.isImported) {
      setCalorieEstimate(null);
      return;
    }

    console.log('Calculating calories for run:', {
      title: run.title,
      distance: run.distance,
      duration: run.duration,
      date: run.date
    });

    // Simple calorie calculation based on distance and weight
    // Default weight of 70kg if not available in profile
    const weight = profile?.weight || 70;
    
    // Calculate calories burned: distance (km) × weight (kg) × 0.75
    const caloriesBurned = Math.round(run.distance * weight * 0.75);
    
    // Add 30% buffer for fueling and recovery
    const recommendedIntake = Math.round(caloriesBurned * 1.3);
    
    const explanation = `${caloriesBurned} calories burned + 30% for fueling & recovery = ${recommendedIntake} total calories recommended.`;

    setCalorieEstimate({
      caloriesBurned,
      recommendedIntake,
      explanation
    });
  }, [run?.id, user?.id, profile?.weight]);

  return { calorieEstimate, isLoading: false, error: null };
};
