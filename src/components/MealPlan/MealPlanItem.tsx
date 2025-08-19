
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { MealPlanItem as MealPlanItemType } from "@/types/profile";
import { useNutritionAnalysis } from "@/hooks/useNutritionAnalysis";
import { MealPlanItemHeader } from "./MealPlanItemHeader";
import { CustomSnackDisplay } from "./CustomSnackDisplay";
import { RegularRecipeDisplay } from "./RegularRecipeDisplay";
import { ReplaceRecipeDialog } from "./ReplaceRecipeDialog";

interface MealPlanItemProps {
  item: MealPlanItemType;
  recipe: any;
  onRefresh?: () => void;
  mealPlanId?: string;
}

export const MealPlanItem: React.FC<MealPlanItemProps> = ({ item, recipe, onRefresh, mealPlanId }) => {
  const navigate = useNavigate();
  const { analyzeAndSaveRecipeNutrition, isAnalyzing } = useNutritionAnalysis();
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);

  // Check if this is a custom snack (no recipe)
  const isCustomSnack = !item.recipe_id && (item.meal_type === 'pre_run_snack' || item.meal_type === 'post_run_snack');

  // Check if recipe needs nutrition analysis
  const needsNutritionAnalysis = () => {
    if (!recipe?.ingredients || recipe.ingredients.length === 0) return false;
    
    // Check if recipe has nutrition data (any non-zero value indicates it has been analyzed)
    const hasNutritionData = recipe.calories > 0 || recipe.protein > 0 || recipe.carbs > 0 || recipe.fat > 0;
    return !hasNutritionData && !hasAnalyzed;
  };

  // Analyze nutrition when component mounts if needed
  useEffect(() => {
    if (needsNutritionAnalysis() && recipe?.id) {
      const analyzeNutrition = async () => {
        const result = await analyzeAndSaveRecipeNutrition(
          recipe.id,
          recipe.ingredients,
          recipe.servings
        );
        if (result) {
          setHasAnalyzed(true);
          // Update the recipe object with the new nutrition data
          Object.assign(recipe, result);
        }
      };
      
      analyzeNutrition();
    }
  }, [recipe]);

  // Get display values from item or recipe data
  const getDisplayValues = () => {
    if (isCustomSnack) {
      // Use item nutrition data for custom snacks
      return {
        calories: item.calories || 0,
        protein: item.protein || 0,
        carbs: item.carbs || 0,
        fat: item.fat || 0
      };
    }
    
    // Use recipe data for regular meals
    return {
      calories: recipe?.calories || 0,
      protein: recipe?.protein || 0,
      carbs: recipe?.carbs || 0,
      fat: recipe?.fat || 0
    };
  };

  const displayValues = getDisplayValues();
  const displayTitle = item.custom_title || recipe?.title || 'Meal';

  // Check if this is lunch with post-run context
  const isPostRunLunch = item.meal_type === 'lunch' && 
    item.nutritional_context?.includes('POST-RUN RECOVERY');

  const handleReplaceRecipe = () => {
    setShowReplaceDialog(true);
  };

  const handleReplaceSuccess = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div key={item.id} className="border rounded-lg overflow-hidden">
      <MealPlanItemHeader 
        mealType={item.meal_type}
        nutritionalContext={item.nutritional_context}
        isPostRunLunch={isPostRunLunch}
        isCustomSnack={isCustomSnack}
        onReplaceRecipe={!isCustomSnack && recipe ? handleReplaceRecipe : undefined}
      />
      
      <div className="p-4">
        {isCustomSnack ? (
          <CustomSnackDisplay 
            displayTitle={displayTitle}
            displayValues={displayValues}
          />
        ) : recipe ? (
          <RegularRecipeDisplay 
            recipe={recipe}
            displayValues={displayValues}
            isPostRunLunch={isPostRunLunch}
            isAnalyzing={isAnalyzing}
            needsNutritionAnalysis={needsNutritionAnalysis()}
          />
        ) : (
          <p>Recipe information not available</p>
        )}
      </div>
      
      {!isCustomSnack && (
        <CardFooter className="bg-gray-50 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => recipe && navigate(`/recipe/${recipe.id}`)}
            disabled={!recipe}
          >
            View Recipe Details
          </Button>
        </CardFooter>
      )}

      {/* Replace Recipe Dialog */}
      {showReplaceDialog && recipe && mealPlanId && (
        <ReplaceRecipeDialog
          isOpen={showReplaceDialog}
          onClose={() => setShowReplaceDialog(false)}
          currentRecipe={recipe}
          mealType={item.meal_type}
          currentCalories={displayValues.calories}
          onReplaceSuccess={handleReplaceSuccess}
          mealPlanId={mealPlanId}
        />
      )}
    </div>
  );
};
