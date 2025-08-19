
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface MealPlanItemHeaderProps {
  mealType: string;
  nutritionalContext?: string | null;
  isPostRunLunch: boolean;
  isCustomSnack?: boolean;
  onReplaceRecipe?: () => void;
}

export const MealPlanItemHeader: React.FC<MealPlanItemHeaderProps> = ({
  mealType,
  nutritionalContext,
  isPostRunLunch,
  isCustomSnack = false,
  onReplaceRecipe
}) => {
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

  return (
    <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={`font-medium ${getMealTypeColor(mealType)}`}>
          {formatMealType(mealType)}
        </Badge>
        {isPostRunLunch && (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
            Recovery Meal
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        {nutritionalContext && (
          <span className="text-sm text-muted-foreground">
            {nutritionalContext}
          </span>
        )}
        {!isCustomSnack && onReplaceRecipe && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReplaceRecipe}
            className="h-6 w-6 p-0 hover:bg-gray-200"
            title="Replace recipe"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
};
