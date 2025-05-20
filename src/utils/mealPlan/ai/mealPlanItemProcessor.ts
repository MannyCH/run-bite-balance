
import { Recipe } from '@/context/types';
import { MealPlanItem } from '@/types/profile';
import { validateMealType } from '../validators';
import { IngredientTracking, MealPlanItemForDb, AIDay, AIMealPlan } from './types';
import { extractMainIngredient } from './ingredientUtils';
import { findRealRecipeId } from './recipeUtils';

/**
 * Process AI meal plan into meal plan items with proper recipe assignments
 */
export function processMealPlanItems(
  mealPlanId: string,
  aiMealPlan: AIMealPlan | undefined,
  recipesMap: Record<string, Recipe>,
  savedAIRecipes: Record<string, Recipe>
): MealPlanItemForDb[] {
  // Create a global set to track all used recipe IDs throughout the entire meal plan
  const globalUsedRecipeIds = new Set<string>();
  
  // Also track content hashes to ensure true content uniqueness
  const globalUsedContentHashes = new Set<string>();
  
  // Track used main ingredients for variety
  const ingredientTracking: IngredientTracking = {
    byDay: {},
    allWeek: new Set<string>()
  };
  
  // Extract and validate the meal plan items from the AI response
  const mealPlanItems: MealPlanItemForDb[] = [];
  
  // Check if we have a valid mealPlan object with days
  if (!aiMealPlan || !aiMealPlan.days) {
    console.error('No valid meal plan data found');
    return mealPlanItems;
  }
  
  for (const day of aiMealPlan.days) {
    if (day.date && Array.isArray(day.meals)) {
      // Initialize ingredient tracking for this day
      if (!ingredientTracking.byDay[day.date]) {
        ingredientTracking.byDay[day.date] = new Set<string>();
      }
      
      for (const meal of day.meals) {
        // Skip invalid meal items
        if (!meal.meal_type || !meal.recipe_id) continue;
        
        // Ensure meal_type is valid
        const validMealType = validateMealType(meal.meal_type);
        if (!validMealType) continue;
        
        // Get the real recipe ID (handle AI-generated recipe IDs)
        // Pass the meal type and date to help find appropriate recipes with ingredient variety
        const realRecipeId = findRealRecipeId(
          meal.recipe_id, 
          validMealType, 
          day.date,
          recipesMap,
          savedAIRecipes,
          globalUsedRecipeIds,
          globalUsedContentHashes,
          ingredientTracking
        );
        if (!realRecipeId) continue;
        
        // Get recipe details from the map
        const recipe = recipesMap[realRecipeId];
        if (!recipe) continue;
        
        // Get main ingredient
        const mainIngredient = recipe.main_ingredient || extractMainIngredient(recipe);
        
        // Create a meal plan item with all required fields explicitly defined
        mealPlanItems.push({
          meal_plan_id: mealPlanId,
          date: day.date,
          meal_type: validMealType,
          recipe_id: realRecipeId,
          custom_title: recipe.title,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat,
          nutritional_context: meal.explanation || null,
          is_ai_generated: recipe.is_ai_generated || false,
          main_ingredient: mainIngredient
        });
      }
    }
  }
  
  // Log information about recipe uniqueness and ingredient variety for debugging
  console.log(`Generated ${mealPlanItems.length} meal plan items with ${globalUsedRecipeIds.size} unique recipe IDs`);
  console.log(`Content-level uniqueness: ${globalUsedContentHashes.size} unique content signatures`);
  console.log(`Ingredient variety: ${ingredientTracking.allWeek.size} different main ingredients used across the week`);
  
  // Log a summary of main ingredients used per day
  Object.entries(ingredientTracking.byDay).forEach(([date, ingredients]) => {
    console.log(`Day ${date}: ${Array.from(ingredients).join(', ')}`);
  });
  
  return mealPlanItems;
}
