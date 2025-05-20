
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { MealPlanItem as MealPlanItemType } from "@/types/profile";

interface MealPlanItemProps {
  item: MealPlanItemType;
  recipe: any;
}

export const MealPlanItem: React.FC<MealPlanItemProps> = ({ item, recipe }) => {
  const formatMealType = (mealType: string) => {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
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
