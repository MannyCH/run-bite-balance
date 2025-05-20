import { Recipe } from "@/context/types";

/**
 * Extract the main ingredient from a recipe based on ingredients list
 * Always returns a non-null string
 */
export function extractMainIngredient(recipe: any): string {
  // If main_ingredient is already set, use it
  if (recipe.main_ingredient) {
    return recipe.main_ingredient;
  }
  
  // If no ingredients, return a default
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
  
  // Look for potential main ingredients in the first few ingredients
  const firstFewIngredients = recipe.ingredients.slice(0, 3).join(" ").toLowerCase();
  
  for (const keyword of ingredientKeywords) {
    if (firstFewIngredients.includes(keyword)) {
      return keyword;
    }
  }
  
  // If we couldn't find a match, extract from the first ingredient
  const firstIngredient = recipe.ingredients[0].toLowerCase();
  // Extract the main part by removing quantities and prep instructions
  const mainPart = firstIngredient.split(" ").slice(1).join(" ").split(",")[0];
  
  // Never return null or empty string
  return mainPart || "unknown";
}

/**
 * Determines if a recipe qualifies as a breakfast recipe based on ingredients or categories
 */
export function isBreakfastRecipe(recipe: Recipe): boolean {
  if (!recipe.categories || recipe.categories.length === 0) {
    return false;
  }
  
  const breakfastKeywords = ["breakfast", "morning", "brunch"];
  
  return recipe.categories.some(category => 
    breakfastKeywords.some(keyword => 
      category.toLowerCase().includes(keyword)
    )
  );
}
