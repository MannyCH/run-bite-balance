import { Recipe } from '@/context/types';

/**
 * Gets a random recipe based on criteria
 */
export function getRandomRecipe(
  recipes: Recipe[], 
  targetCalories: number, 
  targetProtein: number, 
  usedRecipeIds: string[] = [],
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'breakfast'
): Recipe | null {
  if (!recipes.length) return null;
  
  // Filter out already used recipes
  let available = recipes.filter(recipe => !usedRecipeIds.includes(recipe.id));
  
  // If no recipes left, return null
  if (available.length === 0) {
    console.log(`No unused recipes available for ${mealType}. Consider allowing duplicates.`);
    return null;
  }
  
  // Filter by meal type if possible
  const mealTypeFilters = {
    breakfast: ["breakfast", "morning", "brunch"],
    lunch: ["lunch", "midday", "sandwich", "salad"],
    dinner: ["dinner", "supper", "evening"],
    snack: ["snack", "appetizer", "small plate"]
  };
  
  const typeKeywords = mealTypeFilters[mealType];
  const typedRecipes = available.filter(recipe => 
    recipe.categories?.some(category => 
      typeKeywords.some(keyword => 
        category.toLowerCase().includes(keyword)
      )
    )
  );
  
  // Use typed recipes if available, otherwise use all available recipes
  const recipePool = typedRecipes.length > 0 ? typedRecipes : available;
  
  // Log how many recipes are available
  console.log(`Found ${recipePool.length} available recipes for ${mealType} (${typedRecipes.length} match meal type)`);
  
  // Get 20% calorie variance for flexibility
  const calorieMin = targetCalories * 0.8;
  const calorieMax = targetCalories * 1.2;
  
  // Find recipes that match calorie and protein criteria
  const matchingRecipes = recipePool.filter(recipe => 
    recipe.calories >= calorieMin && 
    recipe.calories <= calorieMax && 
    recipe.protein >= targetProtein * 0.8
  );
  
  // If we have matching recipes, pick a random one from those
  if (matchingRecipes.length > 0) {
    console.log(`Found ${matchingRecipes.length} recipes matching nutritional criteria for ${mealType}`);
    const randomIndex = Math.floor(Math.random() * matchingRecipes.length);
    const selectedRecipe = matchingRecipes[randomIndex];
    console.log(`Selected recipe: ${selectedRecipe.id} - ${selectedRecipe.title}`);
    return selectedRecipe;
  }
  
  // Otherwise, just pick a random recipe from the pool
  console.log(`No recipes matching nutritional criteria, selecting from general pool of ${recipePool.length} recipes`);
  const randomIndex = Math.floor(Math.random() * recipePool.length);
  const selectedRecipe = recipePool[randomIndex];
  console.log(`Selected recipe: ${selectedRecipe.id} - ${selectedRecipe.title}`);
  return selectedRecipe;
}
