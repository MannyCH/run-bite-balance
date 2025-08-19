import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileContext";
import { toast } from "sonner";
import { getMealTypeSuitabilityScores } from "@/utils/mealPlan";
import { calculateSeasonalScore, getCurrentSeason, getTemperatureCategory } from "@/utils/mealPlan/seasonalFiltering";

interface ReplaceRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentRecipe: any;
  mealType: string;
  currentCalories: number;
  onReplaceSuccess: () => void;
  mealPlanId: string;
}

export const ReplaceRecipeDialog: React.FC<ReplaceRecipeDialogProps> = ({
  isOpen,
  onClose,
  currentRecipe,
  mealType,
  currentCalories,
  onReplaceSuccess,
  mealPlanId
}) => {
  const [availableRecipes, setAvailableRecipes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReplacing, setIsReplacing] = useState(false);
  const { profile } = useProfile();

  // Fetch suitable replacement recipes
  useEffect(() => {
    if (isOpen && currentRecipe) {
      fetchSuitableRecipes();
    }
  }, [isOpen, currentRecipe, mealType, currentCalories]);

  const fetchSuitableRecipes = async () => {
    if (!currentRecipe || !mealPlanId || !profile?.id) return;
    
    setIsLoading(true);
    try {
      // Call the AI-powered recipe replacement edge function
      const { data, error } = await supabase.functions.invoke('suggest-recipe-replacements', {
        body: {
          currentRecipeId: currentRecipe.id,
          mealType,
          targetCalories: currentCalories > 0 ? currentCalories : 250,
          userId: profile.id,
          mealPlanId
        }
      });

      if (error) {
        console.error('Error calling suggest-recipe-replacements:', error);
        toast.error('Failed to get AI-powered recipe suggestions');
        return;
      }

      const suggestions = data?.suggestions || [];
      console.log('Received AI suggestions:', suggestions);

      setAvailableRecipes(suggestions);
    } catch (error) {
      console.error('Error fetching AI recipe suggestions:', error);
      toast.error('Failed to fetch replacement recipes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplaceRecipe = async (newRecipe: any) => {
    setIsReplacing(true);
    try {
      // Update all meal plan items in the current meal plan that use the current recipe
      const { error } = await supabase
        .from('meal_plan_items')
        .update({
          recipe_id: newRecipe.id,
          calories: newRecipe.calories || 0,
          protein: newRecipe.protein || 0,
          carbs: newRecipe.carbs || 0,
          fat: newRecipe.fat || 0,
          custom_title: null // Clear custom title since we're using a real recipe
        })
        .eq('meal_plan_id', mealPlanId)
        .eq('recipe_id', currentRecipe.id);

      if (error) throw error;

      toast.success(`Replaced ${currentRecipe.title} with ${newRecipe.title} in all meals this week`);
      onReplaceSuccess();
      onClose();
    } catch (error) {
      console.error('Error replacing recipe:', error);
      toast.error('Failed to replace recipe');
    } finally {
      setIsReplacing(false);
    }
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Replace Recipe</DialogTitle>
          <DialogDescription>
            Find a suitable replacement for <strong>{currentRecipe?.title}</strong> in your {formatMealType(mealType)} meals
            {currentCalories > 0 && (
              <span> (targeting ~{currentCalories} calories)</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin mr-2" />
              <span>Finding suitable replacements...</span>
            </div>
          ) : availableRecipes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No suitable replacement recipes found</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {availableRecipes.map((recipe) => (
                  <Card key={recipe.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                       <div className="flex justify-between items-start gap-4">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <img
                              src={recipe.image_url || "/placeholder.svg"}
                              alt={recipe.title}
                              className="w-12 h-12 rounded object-cover flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = "/placeholder.svg";
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate">{recipe.title}</h3>
                              {recipe.reason && (
                                <p className="text-xs text-muted-foreground mt-1 italic">
                                  {recipe.reason}
                                </p>
                              )}
                           <div className="flex flex-wrap gap-2 mt-2">
                             <Badge variant="outline" className="text-xs">
                               {recipe.calories || 0} cal
                             </Badge>
                             <Badge variant="outline" className="text-xs">
                               {recipe.protein || 0}g protein
                             </Badge>
                             <Badge variant="outline" className="text-xs">
                               {recipe.carbs || 0}g carbs
                             </Badge>
                             <Badge variant="outline" className="text-xs">
                               {recipe.fat || 0}g fat
                             </Badge>
                              {recipe.matchPercentage !== undefined && (
                                <Badge 
                                  variant={recipe.matchPercentage > 70 ? "default" : "secondary"} 
                                  className="text-xs"
                                >
                                  {recipe.matchPercentage}% match
                                </Badge>
                              )}
                           </div>
                           {recipe.categories && recipe.categories.length > 0 && (
                             <div className="flex flex-wrap gap-1 mt-1">
                               {recipe.categories.slice(0, 3).map((category: string) => (
                                 <span key={category} className="text-xs text-muted-foreground bg-muted px-1 rounded">
                                   {category}
                                 </span>
                               ))}
                             </div>
                            )}
                            </div>
                          </div>
                         <Button
                          onClick={() => handleReplaceRecipe(recipe)}
                          disabled={isReplacing}
                          size="sm"
                          className="flex-shrink-0"
                        >
                          {isReplacing ? (
                            <Loader className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Replace
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};