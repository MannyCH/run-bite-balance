
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, BookmarkPlus } from "lucide-react";
import { MealPlanItem as MealPlanItemType } from "@/types/profile";
import { saveRecipeToCollection } from "@/utils/mealPlan/recipeUtils";
import { toast } from "sonner";

interface MealPlanItemProps {
  item: MealPlanItemType;
  recipe: any;
}

export const MealPlanItem: React.FC<MealPlanItemProps> = ({ item, recipe }) => {
  const formatMealType = (mealType: string) => {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  };

  const handleSaveRecipe = async () => {
    try {
      // Only allow saving AI-generated recipes
      if (!item.is_ai_generated) return;
      
      // If no custom recipe data, we can't save it
      if (!item.custom_title) {
        toast.error("Recipe data incomplete. Cannot save this recipe.");
        return;
      }
      
      const recipeData = {
        title: item.custom_title,
        calories: item.calories || 0,
        protein: item.protein || 0,
        carbs: item.carbs || 0,
        fat: item.fat || 0,
        // Use any available nutritional information as ingredients description
        ingredients: item.nutritional_context ? [item.nutritional_context] : [],
        instructions: [],
        categories: [formatMealType(item.meal_type)],
        is_ai_generated: true
      };
      
      const success = await saveRecipeToCollection(recipeData);
      
      if (success) {
        toast.success("Recipe saved to your collection!");
      } else {
        toast.error("Failed to save recipe. Please try again.");
      }
    } catch (error) {
      console.error("Error saving recipe:", error);
      toast.error("An error occurred while saving the recipe.");
    }
  };

  return (
    <div className="flex items-start gap-4">
      <Avatar className="h-12 w-12">
        {recipe?.imgurl ? (
          <AvatarImage src={recipe.imgurl} alt={item.custom_title || ""} />
        ) : null}
        <AvatarFallback className="bg-primary/10 text-primary">
          {formatMealType(item.meal_type).charAt(0)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-medium leading-none">
              {formatMealType(item.meal_type)}
            </h4>
            {item.is_ai_generated && (
              <Badge variant="secondary" className="flex items-center gap-1 bg-purple-100">
                <Sparkles className="h-3 w-3" />
                <span>AI Generated</span>
              </Badge>
            )}
          </div>
          
          {/* Add save button for AI-generated recipes */}
          {item.is_ai_generated && (
            <Button 
              onClick={handleSaveRecipe} 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 border-purple-200"
            >
              <BookmarkPlus className="h-4 w-4" />
              <span>Save Recipe</span>
            </Button>
          )}
        </div>
        <h3 className="mt-1 font-medium">{item.custom_title || recipe?.title || "Unnamed Recipe"}</h3>
        <div className="mt-1 text-sm text-muted-foreground">
          {item.nutritional_context || "No additional information available."}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {item.calories !== undefined && item.calories !== null && (
            <Badge variant="outline">
              {item.calories} calories
            </Badge>
          )}
          {item.protein !== undefined && item.protein !== null && (
            <Badge variant="outline">
              {item.protein}g protein
            </Badge>
          )}
          {item.carbs !== undefined && item.carbs !== null && (
            <Badge variant="outline">
              {item.carbs}g carbs
            </Badge>
          )}
          {item.fat !== undefined && item.fat !== null && (
            <Badge variant="outline">
              {item.fat}g fat
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
