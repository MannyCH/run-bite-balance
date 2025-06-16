
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface NutritionBadgesProps {
  displayValues: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  isAnalyzing?: boolean;
  needsNutritionAnalysis?: boolean;
}

export const NutritionBadges: React.FC<NutritionBadgesProps> = ({
  displayValues,
  isAnalyzing = false,
  needsNutritionAnalysis = false
}) => {
  if (isAnalyzing && needsNutritionAnalysis) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Analyzing nutrition...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
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
  );
};
