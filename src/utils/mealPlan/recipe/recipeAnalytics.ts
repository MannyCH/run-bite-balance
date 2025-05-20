
import { Recipe } from "@/context/types";
import { MealPlanItem } from "@/types/profile";
import { generateRecipeContentHash } from "./getRandomRecipe";

/**
 * Extract the main ingredient from a recipe
 */
export function extractMainIngredient(recipe: any): string {
  if (recipe.main_ingredient) {
    return recipe.main_ingredient;
  }
  
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return "unknown";
  }
  
  // Common keywords for main ingredients
  const ingredientKeywords = [
    "chicken", "beef", "pork", "fish", "tofu", "quinoa", "rice", "pasta", 
    "potato", "cauliflower", "broccoli", "beans", "lentils", "chickpeas"
  ];
  
  // Check the first few ingredients
  const firstFewIngredients = recipe.ingredients.slice(0, 3).join(" ").toLowerCase();
  
  for (const keyword of ingredientKeywords) {
    if (firstFewIngredients.includes(keyword)) {
      return keyword;
    }
  }
  
  // Default to first ingredient - Never return null or empty
  const mainPart = recipe.ingredients[0].split(" ").slice(1).join(" ").split(",")[0] || "unknown";
  return mainPart;
}

/**
 * Calculate recipe uniqueness statistics
 */
export function calculateRecipeStats(mealPlanItems: MealPlanItem[], recipes: Record<string, any>, selectedDateMeals: MealPlanItem[]) {
  // Get all AI-generated recipes for the entire week
  const aiMeals = mealPlanItems.filter(item => item.is_ai_generated);
  
  // Count unique recipe IDs
  const uniqueIds = new Set(aiMeals.map(item => item.recipe_id));
  
  // Count unique content signatures (true uniqueness)
  const uniqueContentHashes = new Set();
  const contentToRecipeMap = new Map();
  
  // Track unique main ingredients
  const uniqueMainIngredients = new Set();
  const mainIngredientToRecipeMap = new Map();
  
  aiMeals.forEach(item => {
    if (item.recipe_id && recipes[item.recipe_id]) {
      const recipe = recipes[item.recipe_id];
      
      // Track content uniqueness
      const contentHash = generateRecipeContentHash(recipe);
      uniqueContentHashes.add(contentHash);
      
      // Store the mapping for debugging
      if (!contentToRecipeMap.has(contentHash)) {
        contentToRecipeMap.set(contentHash, []);
      }
      contentToRecipeMap.get(contentHash).push(item.recipe_id);
      
      // Track main ingredient uniqueness - ALWAYS ensure it has a value
      const mainIngredient = recipe.main_ingredient || extractMainIngredient(recipe);
      uniqueMainIngredients.add(mainIngredient);
      
      // Store main ingredient mapping
      if (!mainIngredientToRecipeMap.has(mainIngredient)) {
        mainIngredientToRecipeMap.set(mainIngredient, []);
      }
      mainIngredientToRecipeMap.get(mainIngredient).push(item.recipe_id);
    }
  });
  
  // Identify any duplicate content recipes
  const duplicateContentGroups = Array.from(contentToRecipeMap.entries())
    .filter(([_, recipeIds]) => recipeIds.length > 1)
    .map(([contentHash, recipeIds]) => ({
      contentHash,
      recipeIds,
      titles: recipeIds.map(id => recipes[id]?.title || 'Unknown').join(', ')
    }));
  
  // Identify any duplicate main ingredient recipes
  const duplicateIngredientGroups = Array.from(mainIngredientToRecipeMap.entries())
    .filter(([_, recipeIds]) => recipeIds.length > 1)
    .map(([ingredient, recipeIds]) => ({
      ingredient,
      recipeIds,
      titles: recipeIds.map(id => recipes[id]?.title || 'Unknown').join(', ')
    }));
  
  // For the selected day specifically
  const selectedDayAiMeals = selectedDateMeals.filter(item => item.is_ai_generated);
  const selectedDayContentHashes = new Set();
  const selectedDayIngredients = new Set();
  
  selectedDayAiMeals.forEach(item => {
    if (item.recipe_id && recipes[item.recipe_id]) {
      const recipe = recipes[item.recipe_id];
      // Content hash
      const contentHash = generateRecipeContentHash(recipe);
      selectedDayContentHashes.add(contentHash);
      
      // Main ingredient - ALWAYS ensure it has a value
      const mainIngredient = recipe.main_ingredient || extractMainIngredient(recipe);
      selectedDayIngredients.add(mainIngredient);
    }
  });
  
  return {
    totalAiMeals: aiMeals.length,
    uniqueIds: uniqueIds.size,
    uniqueContent: uniqueContentHashes.size,
    uniqueIngredients: uniqueMainIngredients.size,
    allContentUnique: duplicateContentGroups.length === 0,
    allIngredientsUnique: duplicateIngredientGroups.length === 0,
    duplicateContentGroups,
    duplicateIngredientGroups,
    selectedDayAiMeals: selectedDayAiMeals.length,
    selectedDayUniqueContent: selectedDayContentHashes.size,
    selectedDayUniqueIngredients: selectedDayIngredients.size,
  };
}
