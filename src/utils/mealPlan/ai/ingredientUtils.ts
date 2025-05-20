
import { Recipe } from '@/context/types';

// Common ingredient categories for classification
const ingredientCategories = {
  proteins: ["chicken", "beef", "pork", "turkey", "fish", "salmon", "tuna", "tofu", "tempeh", "eggs"],
  grains: ["rice", "pasta", "quinoa", "bread", "tortilla", "noodle", "couscous", "farro"],
  vegetables: ["cauliflower", "broccoli", "potato", "sweet potato", "squash", "eggplant", "zucchini"],
  legumes: ["beans", "lentils", "chickpeas"]
};

/**
 * Extract the main ingredient from a recipe based on ingredients list
 */
export function extractMainIngredient(recipe: any): string {
  if (recipe.main_ingredient) {
    return recipe.main_ingredient;
  }
  
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return "unknown";
  }
  
  // All potential main ingredient keywords
  const allKeywords = [
    ...ingredientCategories.proteins,
    ...ingredientCategories.grains, 
    ...ingredientCategories.vegetables,
    ...ingredientCategories.legumes
  ];
  
  // Look for potential main ingredients in the first few ingredients (which are usually the main ones)
  const firstFewIngredients = recipe.ingredients.slice(0, 3).join(" ").toLowerCase();
  
  for (const keyword of allKeywords) {
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
