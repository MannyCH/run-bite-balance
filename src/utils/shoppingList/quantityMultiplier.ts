/**
 * Utilities for multiplying ingredient quantities based on meal plan frequency
 */

/**
 * Multiply the quantity in an ingredient string by a given factor
 */
export function multiplyIngredientQuantity(ingredient: string, multiplier: number): string {
  // Match patterns like "2 cups flour", "500g rice", "1 tbsp olive oil", "1/2 tsp salt"
  const quantityMatch = ingredient.match(/^(\d+(?:\/\d+)?(?:\.\d+)?)\s*(.*)$/);
  
  if (quantityMatch) {
    const originalQuantity = quantityMatch[1];
    const restOfIngredient = quantityMatch[2];
    
    let numericQuantity: number;
    
    // Handle fractions like "1/2"
    if (originalQuantity.includes('/')) {
      const [numerator, denominator] = originalQuantity.split('/');
      numericQuantity = parseFloat(numerator) / parseFloat(denominator);
    } else {
      numericQuantity = parseFloat(originalQuantity);
    }
    
    const multipliedQuantity = numericQuantity * multiplier;
    
    // Convert back to a reasonable format
    if (multipliedQuantity % 1 === 0) {
      // If it's a whole number
      return `${multipliedQuantity} ${restOfIngredient}`;
    } else {
      // If it has decimals, keep 2 decimal places max
      return `${multipliedQuantity.toFixed(2)} ${restOfIngredient}`;
    }
  }
  
  // If no quantity pattern found, just return original ingredient
  // This handles cases like "salt", "pepper", "olive oil" where quantity isn't specified
  return ingredient;
}
