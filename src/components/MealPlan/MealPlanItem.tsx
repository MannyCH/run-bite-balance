
import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecipeStatsFooter } from "./RecipeStatsFooter";
import { MealPlanItem as MealPlanItemType } from "@/types/profile";

interface MealPlanItemProps {
  title: string;
  mealType: string;
  recipeId?: string;
  nutritionalContext?: string | null;
  stats?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  isAiGenerated?: boolean;
  mainIngredient?: string | null;
  // Also support passing the full item and recipe objects
  item?: MealPlanItemType;
  recipe?: any;
}

export const MealPlanItem: React.FC<MealPlanItemProps> = ({
  title,
  mealType,
  recipeId,
  nutritionalContext,
  stats,
  isAiGenerated,
  mainIngredient,
  item,
  recipe,
}) => {
  // If item and recipe are provided, extract props from them
  if (item) {
    recipeId = item.recipe_id || recipeId;
    mealType = item.meal_type || mealType;
    nutritionalContext = item.nutritional_context || nutritionalContext;
    isAiGenerated = item.is_ai_generated || isAiGenerated;
    mainIngredient = item.main_ingredient || mainIngredient;
    
    if (!title && recipe) {
      title = recipe.title;
    } else if (!title) {
      title = item.custom_title || "Custom Meal";
    }
    
    // Use stats from item if not provided directly
    if (!stats) {
      stats = {
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat
      };
    }
  }
  
  // Format meal type for display
  const displayMealType = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  
  // Create the card content
  const cardContent = (
    <>
      <CardHeader className="pb-1">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700">
            {displayMealType}
          </Badge>
        </div>
        {isAiGenerated && (
          <Badge className="mt-1 bg-emerald-50 text-emerald-700 text-[10px]" variant="outline">
            AI-Generated
          </Badge>
        )}
        {mainIngredient && (
          <Badge className="mt-1 ml-1 bg-blue-50 text-blue-700 text-[10px]" variant="outline">
            {mainIngredient}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {nutritionalContext && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{nutritionalContext}</p>
        )}
        {stats && <RecipeStatsFooter calories={stats.calories} protein={stats.protein} carbs={stats.carbs} fat={stats.fat} />}
      </CardContent>
    </>
  );

  // If there's a recipe ID, wrap with Link, otherwise just show the card
  if (recipeId) {
    return (
      <Link to={`/recipe/${recipeId}`} className="block">
        <Card className="h-full hover:shadow-md transition-shadow">{cardContent}</Card>
      </Link>
    );
  }

  return <Card className="h-full">{cardContent}</Card>;
};
