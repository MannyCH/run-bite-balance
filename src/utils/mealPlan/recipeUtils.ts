
// Utility functions for recipe filtering and selection
import { Recipe } from '@/context/types';
import { UserProfile } from '@/types/profile';

// Filter recipes based on user preferences
export function filterRecipesByPreferences(recipes: Recipe[], profile: UserProfile): Recipe[] {
  if (!recipes.length) return [];
  
  let filteredRecipes = [...recipes];
  
  // Filter out recipes with allergies
  if (profile.food_allergies && profile.food_allergies.length > 0) {
    filteredRecipes = filteredRecipes.filter(recipe => {
      // If recipe has no ingredients, we can't check for allergies
      if (!recipe.ingredients) return true;
      
      // Check if any ingredient contains an allergen
      return !profile.food_allergies!.some(allergen => 
        recipe.ingredients!.some(ingredient => 
          ingredient.toLowerCase().includes(allergen.toLowerCase())
        )
      );
    });
  }
  
  // Filter out foods to avoid
  if (profile.foods_to_avoid && profile.foods_to_avoid.length > 0) {
    filteredRecipes = filteredRecipes.filter(recipe => {
      // If recipe has no ingredients, we can't check for foods to avoid
      if (!recipe.ingredients) return true;
      
      // Check if any ingredient contains a food to avoid
      return !profile.foods_to_avoid!.some(food => 
        recipe.ingredients!.some(ingredient => 
          ingredient.toLowerCase().includes(food.toLowerCase())
        )
      );
    });
  }

  return filteredRecipes;
}

// Prioritize preferred cuisines
export function prioritizeRecipes(recipes: Recipe[], profile: UserProfile): Recipe[] {
  if (!profile.preferred_cuisines || profile.preferred_cuisines.length === 0) {
    return recipes;
  }
  
  const preferredRecipes = recipes.filter(recipe => 
    recipe.categories && profile.preferred_cuisines!.some(cuisine => 
      recipe.categories!.some(category => 
        category.toLowerCase().includes(cuisine.toLowerCase())
      )
    )
  );
  
  // If we have preferred recipes, they go first, followed by the others
  if (preferredRecipes.length > 0) {
    return [
      ...preferredRecipes, 
      ...recipes.filter(r => !preferredRecipes.includes(r))
    ];
  }
  
  return recipes;
}

// Get a random recipe that fits calorie and macros criteria
export function getRandomRecipe(
  recipes: Recipe[],
  targetCalories: number,
  targetProtein: number,
  previousMeals: string[] = []
): Recipe | null {
  // Clone and shuffle the recipes array
  const shuffled = [...recipes]
    .filter(r => !previousMeals.includes(r.id))
    .sort(() => 0.5 - Math.random());
  
  // Find a recipe that fits our criteria
  const recipe = shuffled.find(r => {
    // Allow some flexibility in calorie count (±20%)
    const minCalories = targetCalories * 0.8;
    const maxCalories = targetCalories * 1.2;
    
    return (
      r.calories >= minCalories && 
      r.calories <= maxCalories && 
      r.protein >= targetProtein * 0.7
    );
  });
  
  return recipe || (shuffled.length > 0 ? shuffled[0] : null);
}

// Helper function to generate context/explanation for meal choices
export function getContextForMeal(
  mealType: string, 
  recipe: Recipe, 
  profile: UserProfile
): string {
  // Default explanations
  const defaultContexts: Record<string, string> = {
    breakfast: "A nutritious breakfast to start your day",
    lunch: "A balanced lunch with good macronutrient distribution",
    dinner: "A satisfying dinner with plenty of nutrients",
    snack: "A light snack to maintain energy levels"
  };
  
  if (!profile.fitness_goal) {
    return defaultContexts[mealType] || defaultContexts.snack;
  }
  
  // More personalized explanations based on user goals
  const explanations: { [key: string]: string[] } = {
    lose: [
      `Lower calorie option to support your weight loss goal`,
      `Good protein-to-calorie ratio to help preserve muscle while losing weight`,
      `Nutrient-dense meal with fiber to help you feel full longer`,
      `Balanced macros to support your weight loss journey`
    ],
    maintain: [
      `Well-balanced meal to maintain your current weight`,
      `Good mix of nutrients to support your health goals`,
      `Provides sustained energy throughout the day`,
      `Balanced protein, carbs and fats for your maintenance goal`
    ],
    gain: [
      `Calorie-dense option to support your weight gain goal`,
      `Good source of protein to support muscle building`,
      `Higher carbohydrate content to fuel workouts and recovery`,
      `Nutrient-rich meal to support your growth goals`
    ]
  };
  
  // Choose a random explanation based on the user's goal
  const goalExplanations = explanations[profile.fitness_goal] || explanations.maintain;
  const randomExplanation = goalExplanations[Math.floor(Math.random() * goalExplanations.length)];
  
  // Add recipe-specific context if available
  let recipeContext = "";
  if (recipe.protein > 25) {
    recipeContext = " High in protein.";
  } else if (recipe.carbs > 50) {
    recipeContext = " Good source of energy from carbs.";
  } else if (recipe.fat > 20) {
    recipeContext = " Contains healthy fats.";
  }
  
  return randomExplanation + recipeContext;
}
