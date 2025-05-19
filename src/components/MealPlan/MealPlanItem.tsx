
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { MealPlanItem as MealPlanItemType } from "@/types/profile";
import { Sparkles } from "lucide-react";

interface MealPlanItemProps {
  item: MealPlanItemType;
  recipe: any;
}

export const MealPlanItem: React.FC<MealPlanItemProps> = ({ item, recipe }) => {
  const navigate = useNavigate();

  // Format meal type for display
  const formatMealType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div key={item.id} className="border rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-medium">
            {formatMealType(item.meal_type)}
          </Badge>
          {item.is_ai_generated && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Sparkles size={14} className="text-amber-500" />
              <span>AI Generated</span>
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
        {recipe ? (
          <div className="flex flex-col md:flex-row gap-4">
            {recipe.imgurl && (
              <div className="md:w-1/4 h-40 overflow-hidden rounded-md">
                <img 
                  src={recipe.imgurl} 
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
              <div className="flex flex-wrap gap-2 mt-2">
                {item.calories && (
                  <Badge variant="secondary">{item.calories} cal</Badge>
                )}
                {item.protein && (
                  <Badge variant="secondary">P: {item.protein}g</Badge>
                )}
                {item.carbs && (
                  <Badge variant="secondary">C: {item.carbs}g</Badge>
                )}
                {item.fat && (
                  <Badge variant="secondary">F: {item.fat}g</Badge>
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
    </div>
  );
};
