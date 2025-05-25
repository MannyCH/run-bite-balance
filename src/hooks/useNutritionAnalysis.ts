
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

  const analyzeAndSaveRecipeNutrition = async (
    recipeId: string,
    ingredients: string[],
    servings?: string | number
  ): Promise<NutritionData | null> => {
    if (!ingredients || ingredients.length === 0) {
      console.warn('No ingredients provided for nutrition analysis');
      return null;
    }

    setIsAnalyzing(true);
    try {
      // First, call the nutrition analysis function
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
        const nutritionData = {
          calories: Math.round(data.calories),
          protein: Math.round(data.protein),
          carbs: Math.round(data.carbs),
          fat: Math.round(data.fat)
        };

        // Save the nutrition data to the recipe in the database
        const { error: updateError } = await supabase
          .from('recipes')
          .update({
            calories: nutritionData.calories,
            protein: nutritionData.protein,
            carbs: nutritionData.carbs,
            fat: nutritionData.fat
          })
          .eq('id', recipeId);

        if (updateError) {
          console.error('Error saving nutrition data to recipe:', updateError);
          // Still return the data even if saving failed
        } else {
          console.log('Successfully saved nutrition data to recipe:', recipeId);
        }

        return nutritionData;
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
    analyzeAndSaveRecipeNutrition,
    isAnalyzing
  };
};
