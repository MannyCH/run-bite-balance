
import { Recipe } from '@/context/types';
import { simpleHash } from '../utils';

/**
 * Generate a content hash for a recipe based on its core fields
 * This is a browser-compatible version that doesn't use Node.js crypto
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
    String(recipe.fat),
    recipe.main_ingredient?.toLowerCase() // Include main ingredient in the hash
  ].filter(Boolean).join('|');
  
  // Use browser-compatible hashing
  return simpleHash(contentFields);
}

/**
 * Extract the main ingredient from a recipe based on ingredients list
 */
export function extractMainIngredient(recipe: Recipe): string {
  if (recipe.main_ingredient) {
    return recipe.main_ingredient;
  }
  
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return "unknown";
  }
  
  // Common food categories that might be main ingredients
  const ingredientKeywords = [
    "chicken", "beef", "pork", "turkey", "fish", "salmon", "tuna", 
    "tofu", "tempeh", "eggs", "rice", "pasta", "quinoa", "bread",
    "tortilla", "noodle", "couscous", "farro", "cauliflower", 
    "broccoli", "potato", "sweet potato", "squash", "eggplant",
    "zucchini", "beans", "lentils", "chickpeas"
  ];
  
  // Look for potential main ingredients in the first few ingredients (which are usually the main ones)
  const firstFewIngredients = recipe.ingredients.slice(0, 3).join(" ").toLowerCase();
  
  for (const keyword of ingredientKeywords) {
    if (firstFewIngredients.includes(keyword)) {
      return keyword;
    }
  }
  
  // If we couldn't find a match in common ingredients, just return the first ingredient
  const firstIngredient = recipe.ingredients[0].toLowerCase();
  // Extract the main part by removing quantities and prep instructions
  const mainPart = firstIngredient.split(" ").slice(1).join(" ").split(",")[0];
  return mainPart || "unknown";
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
  usedContentHashes: string[] = [],
  usedMainIngredients: string[] = []
): Recipe | null {
  if (!recipes.length) return null;
  
  // Filter out already used recipes (by ID), content hashes, and main ingredients
  let available = recipes.filter(recipe => {
    // Skip if ID is already used
    if (usedRecipeIds.includes(recipe.id)) return false;
    
    // Skip if content hash is already used (for content-level deduplication)
    const contentHash = generateRecipeContentHash(recipe);
    if (usedContentHashes.includes(contentHash)) return false;
    
    // Skip if main ingredient is already used
    const mainIngredient = recipe.main_ingredient || extractMainIngredient(recipe);
    if (usedMainIngredients.includes(mainIngredient)) return false;
    
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
