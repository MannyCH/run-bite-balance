
import { Recipe } from '@/context/types';
import { IngredientTracking } from './types';
import { generateContentHash } from './contentHash';
import { extractMainIngredient } from './ingredientUtils';

/**
 * Helper function to get all available AI recipes for a meal type
 * Considers main ingredient to ensure variety
 */
export function getAvailableAIRecipes(
  savedAIRecipes: Record<string, Recipe>,
  mealType: string, 
  usedRecipeIds: Set<string>,
  usedContentHashes: Set<string>,
  mainIngredientsToAvoid: Set<string>
): string[] {
  return Object.entries(savedAIRecipes)
    .filter(([id, recipe]) => {
      // Skip already used recipes
      if (usedRecipeIds.has(id)) return false;
      
      // Skip recipes with similar content (true deduplication)
      const contentHash = generateContentHash(recipe);
      if (usedContentHashes.has(contentHash)) return false;
      
      // Get main ingredient
      const mainIngredient = recipe.main_ingredient || extractMainIngredient(recipe);
      
      // Skip recipes with main ingredients we've already used
      if (mainIngredientsToAvoid.has(mainIngredient)) return false;
      
      // Check if recipe has categories that match the meal type
      if (recipe.categories && recipe.categories.length > 0) {
        return recipe.categories.some(category => 
          category.toLowerCase().includes(mealType.toLowerCase())
        );
      }
      
      // If no categories or no match, it's still available for use
      return true;
    })
    .map(([id]) => id);
}

/**
 * Find real recipe ID for AI-generated recipes
 * with enhanced uniqueness checks based on content and main ingredients
 */
export function findRealRecipeId(
  tempId: string, 
  mealType: string, 
  date: string,
  recipesMap: Record<string, Recipe>,
  savedAIRecipes: Record<string, Recipe>,
  globalUsedRecipeIds: Set<string>,
  globalUsedContentHashes: Set<string>,
  ingredientTracking: IngredientTracking
): string | null {
  // Initialize ingredient tracking for this day if not exists
  if (!ingredientTracking.byDay[date]) {
    ingredientTracking.byDay[date] = new Set<string>();
  }
  
  // Get ingredients already used for this day
  const usedIngredientsToday = ingredientTracking.byDay[date];
  
  // If it's a regular recipe ID, return it (if not already used)
  if (!tempId.startsWith('ai-')) {
    // For non-AI recipes, check if already used to prevent duplication
    if (globalUsedRecipeIds.has(tempId)) {
      // If already used, find another similar recipe
      const recipe = recipesMap[tempId];
      if (recipe) {
        // Extract its main ingredient
        const mainIngredient = recipe.main_ingredient || extractMainIngredient(recipe);
        
        // Find similar recipes by meal type that aren't already used
        // and have different main ingredients than what we've used today
        const similarRecipes = Object.entries(recipesMap)
          .filter(([id, r]) => {
            if (globalUsedRecipeIds.has(id)) return false;
            
            // Extract this recipe's main ingredient
            const rMainIngredient = r.main_ingredient || extractMainIngredient(r);
            
            // Skip if we've already used this ingredient today
            if (usedIngredientsToday.has(rMainIngredient)) return false;
            
            // Check for category match
            if (!r.categories) return false;
            return r.categories.some(cat => 
              recipe.categories?.some(originalCat => 
                cat.toLowerCase().includes(originalCat.toLowerCase())
              )
            );
          })
          .map(([id]) => id);
        
        if (similarRecipes.length > 0) {
          const alternativeId = similarRecipes[Math.floor(Math.random() * similarRecipes.length)];
          console.log(`Recipe ${tempId} already used, substituting with similar recipe ${alternativeId}`);
          
          // Mark as used
          globalUsedRecipeIds.add(alternativeId);
          
          // Track main ingredient
          const altRecipe = recipesMap[alternativeId];
          if (altRecipe) {
            const altMainIngredient = altRecipe.main_ingredient || extractMainIngredient(altRecipe);
            usedIngredientsToday.add(altMainIngredient);
            ingredientTracking.allWeek.add(altMainIngredient);
          }
          
          // Also track content hash
          const contentHash = generateContentHash(recipesMap[alternativeId]);
          globalUsedContentHashes.add(contentHash);
          
          return alternativeId;
        }
      }
    }
    
    // Mark as used
    globalUsedRecipeIds.add(tempId);
    
    // Track main ingredient usage
    const recipe = recipesMap[tempId];
    if (recipe) {
      const mainIngredient = recipe.main_ingredient || extractMainIngredient(recipe);
      usedIngredientsToday.add(mainIngredient);
      ingredientTracking.allWeek.add(mainIngredient);
      
      // Track content hash
      const contentHash = generateContentHash(recipe);
      globalUsedContentHashes.add(contentHash);
    }
    
    return tempId;
  }
  
  // It's a temporary AI recipe ID from the meal plan
  // Find a corresponding real recipe ID that hasn't been used yet
  // and has a different main ingredient than what we've used for this day
  const availableAIRecipeIds = getAvailableAIRecipes(
    savedAIRecipes, 
    mealType, 
    globalUsedRecipeIds, 
    globalUsedContentHashes, 
    usedIngredientsToday
  );
  
  if (availableAIRecipeIds.length > 0) {
    // Get a random recipe from the available ones
    const randomIndex = Math.floor(Math.random() * availableAIRecipeIds.length);
    const chosenRecipeId = availableAIRecipeIds[randomIndex];
    
    // Mark this recipe as used so we don't use it again anywhere in the meal plan
    globalUsedRecipeIds.add(chosenRecipeId);
    
    // Track its content hash and main ingredient
    const recipe = recipesMap[chosenRecipeId];
    if (recipe) {
      // Track content hash for true deduplication
      const contentHash = generateContentHash(recipe);
      globalUsedContentHashes.add(contentHash);
      
      // Track main ingredient for variety
      const mainIngredient = recipe.main_ingredient || extractMainIngredient(recipe);
      usedIngredientsToday.add(mainIngredient);
      ingredientTracking.allWeek.add(mainIngredient);
      
      console.log(`Assigned AI recipe ${chosenRecipeId} with main ingredient "${mainIngredient}" for meal type ${mealType} on ${date}`);
    }
    
    return chosenRecipeId;
  }
  
  console.log(`No available AI recipes for meal type ${mealType} with unique main ingredients, using non-AI recipe instead`);
  return null;
}
