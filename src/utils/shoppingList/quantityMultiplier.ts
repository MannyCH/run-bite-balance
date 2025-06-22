/**
 * Utilities for multiplying ingredient quantities based on meal plan frequency and batch cooking settings
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
    } else if (multipliedQuantity < 1) {
      // Convert small decimals to fractions for readability
      const fraction = decimalToFraction(multipliedQuantity);
      return `${fraction} ${restOfIngredient}`;
    } else {
      // For larger decimals, keep 2 decimal places max and remove trailing zeros
      const formatted = parseFloat(multipliedQuantity.toFixed(2));
      return `${formatted} ${restOfIngredient}`;
    }
  }
  
  // If no quantity pattern found, just return original ingredient
  // This handles cases like "salt", "pepper", "olive oil" where quantity isn't specified
  return ingredient;
}

/**
 * Convert decimal to fraction for better readability
 */
function decimalToFraction(decimal: number): string {
  // Common cooking fractions
  const fractions = [
    { decimal: 0.125, fraction: '1/8' },
    { decimal: 0.25, fraction: '1/4' },
    { decimal: 0.333, fraction: '1/3' },
    { decimal: 0.5, fraction: '1/2' },
    { decimal: 0.667, fraction: '2/3' },
    { decimal: 0.75, fraction: '3/4' },
  ];
  
  // Find closest fraction
  const closest = fractions.find(f => Math.abs(f.decimal - decimal) < 0.05);
  if (closest) {
    return closest.fraction;
  }
  
  // Fall back to decimal with 2 places
  return parseFloat(decimal.toFixed(2)).toString();
}
