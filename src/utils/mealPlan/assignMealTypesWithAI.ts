
import { Recipe } from "@/context/types";
import { UserProfile } from "@/types/profile";
import { getMealTypeSuitabilityScores } from "./mealTypeClassifier";

/**
 * Assigns meal types to recipes considering user profile preferences and recipe suitability
 * @param recipes Array of recipes to assign meal types to
 * @param profile User profile with preferences
 * @returns Recipes with meal types assigned
 */
export async function assignMealTypesWithAI(
  recipes: Recipe[],
  profile: UserProfile
): Promise<Recipe[]> {
  // Count needed recipes by meal type (assuming 7 days)
  const mealsNeeded = {
    breakfast: 7,
    lunch: 7,
    dinner: 7,
    // snack: 7, // Uncomment if you want to include snacks
  };

  // Track assigned meal types
  const assignedByMealType: Record<string, Recipe[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    // snack: [], // Uncomment if you want to include snacks
  };

  // Clone recipes to avoid modifying originals
  const recipesWithMealType = [...recipes];
  const remainingRecipes = [...recipes];

  // First pass - respect any existing meal type assignments from categories
  for (let i = 0; i < recipesWithMealType.length; i++) {
    const recipe = recipesWithMealType[i];
    const categories = recipe.categories || [];
    
    // Check if recipe already has a meal type in categories
    const existingMealType = categories.find(cat => 
      ['breakfast', 'lunch', 'dinner', 'snack'].includes(cat.toLowerCase())
    );
    
    if (existingMealType && mealsNeeded[existingMealType.toLowerCase()] > 0) {
      // Assign this recipe to its existing meal type
      assignedByMealType[existingMealType.toLowerCase()].push(recipe);
      mealsNeeded[existingMealType.toLowerCase()]--;
      
      // Remove from remaining recipes
      const index = remainingRecipes.findIndex(r => r.id === recipe.id);
      if (index >= 0) {
        remainingRecipes.splice(index, 1);
      }
    }
  }

  // Second pass - assign remaining recipes based on suitability scores
  for (const mealType of Object.keys(mealsNeeded)) {
    while (mealsNeeded[mealType] > 0 && remainingRecipes.length > 0) {
      // Get suitability scores for all remaining recipes
      const recipeScores = remainingRecipes.map(recipe => {
        const scores = getMealTypeSuitabilityScores(recipe);
        return {
          recipe,
          score: scores[mealType as keyof typeof scores] || 0
        };
      });
      
      // Sort by suitability score for this meal type (descending)
      recipeScores.sort((a, b) => b.score - a.score);
      
      // Use the best matching recipe
      const bestMatch = recipeScores[0].recipe;
      
      // Add to assigned recipes for this meal type
      assignedByMealType[mealType].push(bestMatch);
      mealsNeeded[mealType]--;
      
      // Remove from remaining recipes
      const index = remainingRecipes.findIndex(r => r.id === bestMatch.id);
      if (index >= 0) {
        remainingRecipes.splice(index, 1);
      }
    }
  }

  // Combine all assigned recipes
  const result = [
    ...assignedByMealType.breakfast,
    ...assignedByMealType.lunch,
    ...assignedByMealType.dinner,
    // ...assignedByMealType.snack, // Uncomment if you want to include snacks
  ];

  return result;
}
