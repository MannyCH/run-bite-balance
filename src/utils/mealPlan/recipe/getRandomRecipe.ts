
import { Recipe } from '@/context/types';
import crypto from 'crypto';

/**
 * Generate a content hash for a recipe based on its core fields
 * This allows us to identify recipes that have similar content even with different IDs/titles
 */
export function generateRecipeContentHash(recipe: Recipe): string {
  // Combine key content fields to create a unique signature
  const contentFields = [
    recipe.ingredients?.join('').toLowerCase(),
    recipe.instructions?.join('').toLowerCase(),
    recipe.categories?.join('').toLowerCase(),
    String(recipe.calories),
    String(recipe.protein),
    String(recipe.carbs),
    String(recipe.fat)
  ].filter(Boolean).join('|');
  
  // Create a hash of this content
  return crypto.createHash('md5').update(contentFields).digest('hex');
}

/**
 * Gets a random recipe based on criteria
 */
export function getRandomRecipe(
  recipes: Recipe[], 
  targetCalories: number, 
  targetProtein: number, 
  usedRecipeIds: string[] = [],
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'breakfast',
  usedContentHashes: string[] = []
): Recipe | null {
  if (!recipes.length) return null;
  
  // Filter out already used recipes (by ID) and content hashes
  let available = recipes.filter(recipe => {
    // Skip if ID is already used
    if (usedRecipeIds.includes(recipe.id)) return false;
    
    // Skip if content hash is already used (for content-level deduplication)
    const contentHash = generateRecipeContentHash(recipe);
    if (usedContentHashes.includes(contentHash)) return false;
    
    return true;
  });
  
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
