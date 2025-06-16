
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { MealPlanItem as MealPlanItemType } from "@/types/profile";
import { useNutritionAnalysis } from "@/hooks/useNutritionAnalysis";
import { Loader2, Utensils } from "lucide-react";

interface MealPlanItemProps {
  item: MealPlanItemType;
  recipe: any;
}

export const MealPlanItem: React.FC<MealPlanItemProps> = ({ item, recipe }) => {
  const navigate = useNavigate();
  const { analyzeAndSaveRecipeNutrition, isAnalyzing } = useNutritionAnalysis();
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Format meal type for display
  const formatMealType = (type: string) => {
    switch (type) {
      case 'pre_run_snack':
        return 'Pre-Run Snack';
      case 'post_run_snack':
        return 'Post-Run Snack';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Get meal type color
  const getMealTypeColor = (type: string) => {
    switch (type) {
      case 'breakfast': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'pre_run_snack': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'lunch': return 'bg-green-100 text-green-800 border-green-300';
      case 'dinner': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'post_run_snack': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

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

  return (
    <div key={item.id} className="border rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`font-medium ${getMealTypeColor(item.meal_type)}`}>
            {formatMealType(item.meal_type)}
          </Badge>
          {isPostRunLunch && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              Recovery Meal
            </Badge>
          )}
        </div>
        {item.nutritional_context && (
          <span className="text-sm text-muted-foreground">
            {item.nutritional_context}
          </span>
        )}
      </div>
      <div className="p-4">
        {isCustomSnack ? (
          // Custom snack display
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-md flex items-center justify-center">
              <Utensils className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium">{displayTitle}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {displayValues.calories > 0 && (
                  <Badge variant="secondary">
                    {displayValues.calories} cal
                  </Badge>
                )}
                {displayValues.protein > 0 && (
                  <Badge variant="secondary">
                    P: {displayValues.protein}g
                  </Badge>
                )}
                {displayValues.carbs > 0 && (
                  <Badge variant="secondary">
                    C: {displayValues.carbs}g
                  </Badge>
                )}
                {displayValues.fat > 0 && (
                  <Badge variant="secondary">
                    F: {displayValues.fat}g
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Quick and convenient nutrition for your run
              </p>
            </div>
          </div>
        ) : recipe ? (
          // Regular recipe display
          <div className="flex flex-col md:flex-row gap-4">
            {recipe.imgUrl && (
              <div className="md:w-1/4 h-40 overflow-hidden rounded-md">
                <img 
                  src={recipe.imgUrl} 
                  alt={recipe.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-medium">{recipe.title}</h3>
              {isPostRunLunch && (
                <p className="text-sm text-orange-600 font-medium mt-1">
                  Optimized for post-run recovery
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                {isAnalyzing && needsNutritionAnalysis() ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Analyzing nutrition...</span>
                  </div>
                ) : (
                  <>
                    {displayValues.calories > 0 && (
                      <Badge variant="secondary">
                        {displayValues.calories} cal
                      </Badge>
                    )}
                    {displayValues.protein > 0 && (
                      <Badge variant="secondary">
                        P: {displayValues.protein}g
                      </Badge>
                    )}
                    {displayValues.carbs > 0 && (
                      <Badge variant="secondary">
                        C: {displayValues.carbs}g
                      </Badge>
                    )}
                    {displayValues.fat > 0 && (
                      <Badge variant="secondary">
                        F: {displayValues.fat}g
                      </Badge>
                    )}
                  </>
                )}
              </div>
              {recipe.ingredients && recipe.ingredients.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium">Ingredients:</p>
                  <ul className="text-sm mt-1 list-disc pl-5">
                    {recipe.ingredients.slice(0, 3).map((ing: string, i: number) => (
                      <li key={i} className="text-muted-foreground">{ing}</li>
                    ))}
                    {recipe.ingredients.length > 3 && (
                      <li className="text-muted-foreground">+ {recipe.ingredients.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
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
    </div>
  );
};
