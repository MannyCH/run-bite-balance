
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const useNutritionAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeRecipeNutrition = async (
    ingredients: string[],
    servings?: string | number
  ): Promise<NutritionData | null> => {
    if (!ingredients || ingredients.length === 0) {
      console.warn('No ingredients provided for nutrition analysis');
      return null;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-nutrition', {
        body: { 
          ingredients: ingredients.filter(ing => ing && ing.trim()),
          servings: servings || 1
        }
      });

      if (error) {
        console.error('Error analyzing nutrition:', error);
        return null;
      }

      if (data && typeof data.calories === 'number') {
        return {
          calories: Math.round(data.calories),
          protein: Math.round(data.protein),
          carbs: Math.round(data.carbs),
          fat: Math.round(data.fat)
        };
      }

      console.error('Invalid nutrition data received:', data);
      return null;
    } catch (error) {
      console.error('Failed to analyze nutrition:', error);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    analyzeRecipeNutrition,
    isAnalyzing
  };
};
