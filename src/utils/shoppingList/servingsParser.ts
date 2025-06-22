
/**
 * Parse servings information from recipe data
 */
export function parseRecipeServings(recipe: any): number {
  if (!recipe.servings) return 1;
  
  const servings = recipe.servings.toString().toLowerCase().trim();
  
  // Handle various formats
  // "4", "serves 4", "4 people", "serves 4-6", "4-6 servings", etc.
  
  // Extract first number from the string
  const numberMatch = servings.match(/(\d+)/);
  if (numberMatch) {
    return parseInt(numberMatch[1], 10);
  }
  
  // Default to 1 if no number found
  return 1;
}
