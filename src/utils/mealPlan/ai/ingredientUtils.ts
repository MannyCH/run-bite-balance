
/**
 * Extract the main ingredient from a recipe based on ingredients list
 * This is a fallback for recipes that don't have a main_ingredient field
 */
export function extractMainIngredient(recipe: any): string {
  if (!recipe) return "unknown";
  
  if (recipe.main_ingredient) {
    return recipe.main_ingredient;
  }
  
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return "unknown";
  }
  
  // Common protein sources that are often main ingredients
  const proteinKeywords = ["chicken", "beef", "pork", "turkey", "fish", "salmon", "tuna", "tofu", "tempeh", "eggs"];
  
  // Common grains that are often main ingredients
  const grainKeywords = ["rice", "pasta", "quinoa", "bread", "tortilla", "noodle", "couscous", "farro"];
  
  // Common vegetables that might be main ingredients
  const vegKeywords = ["cauliflower", "broccoli", "potato", "sweet potato", "squash", "eggplant", "zucchini"];
  
  // Common legumes
  const legumeKeywords = ["beans", "lentils", "chickpeas"];
  
  // All potential main ingredient keywords
  const allKeywords = [...proteinKeywords, ...grainKeywords, ...vegKeywords, ...legumeKeywords];
  
  // Look for potential main ingredients in the first few ingredients (which are usually the main ones)
  const firstFewIngredients = recipe.ingredients.slice(0, 3).join(" ").toLowerCase();
  
  for (const keyword of allKeywords) {
    if (firstFewIngredients.includes(keyword)) {
      return keyword;
    }
  }
  
  // If we couldn't find a match in common ingredients, just return the first ingredient
  try {
    const firstIngredient = recipe.ingredients[0].toLowerCase();
    // Extract the main part by removing quantities and prep instructions
    const mainPart = firstIngredient.split(" ").slice(1).join(" ").split(",")[0];
    return mainPart || "unknown";
  } catch (e) {
    return "unknown";
  }
}
