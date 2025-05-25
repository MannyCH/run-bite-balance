
/**
 * Utilities for parsing and cleaning ingredient strings
 */

/**
 * Clean ingredient name by removing preparation instructions and irrelevant words
 */
function cleanIngredientName(name: string): string {
  // Convert to lowercase for consistency
  name = name.toLowerCase();
  
  // Remove preparation instructions and irrelevant words
  const wordsToRemove = [
    // German preparation words
    "geviertelt", "geschnitten", "gehackt", "gerieben", "gewürfelt", "ganz", "fein",
    // English preparation words
    "sliced", "diced", "chopped", "minced", "grated", "whole", "fine", "fresh",
    // Irrelevant words
    "guss", "quality", "premium", "organic", "free-range", "for serving", "for garnish",
    "to taste", "as needed", "optional", "approximately", "about", "roughly", "packed"
  ];
  
  // Regular expression to match any word in the array with word boundaries
  const regex = new RegExp(`\\b(${wordsToRemove.join("|")})\\b`, "gi");
  name = name.replace(regex, "");
  
  // Remove extra spaces and trim
  name = name.replace(/\s+/g, " ").trim();
  
  return name;
}

/**
 * Normalize ingredient names to group similar ingredients
 */
function normalizeIngredientName(name: string): string {
  // Common ingredient variations to consolidate
  const normalizations: Record<string, string[]> = {
    "olive oil": ["oliveoil", "extra virgin olive oil", "evoo", "virgin olive oil"],
    "garlic": ["garlic clove", "garlic cloves", "garlic bulb", "fresh garlic"],
    "onion": ["brown onion", "red onion", "yellow onion", "white onion", "shallot"],
    "salt": ["sea salt", "kosher salt", "table salt", "flaked salt", "himalayan salt"],
    "pepper": ["black pepper", "white pepper", "ground pepper", "peppercorn"],
    "sugar": ["white sugar", "granulated sugar", "caster sugar"],
    "flour": ["all-purpose flour", "plain flour", "wheat flour"],
  };
  
  // Check if the ingredient name matches any known variations
  for (const [normalized, variations] of Object.entries(normalizations)) {
    if (variations.some(variation => name.includes(variation))) {
      return normalized;
    }
  }
  
  return name;
}

/**
 * Extract and normalize ingredients from a string
 */
export function parseIngredient(ingredient: string): { name: string; quantity: string } {
  // Simple regex to separate quantity from ingredient name
  // This handles common formats like "2 cups flour", "500g rice", "1 tbsp olive oil"
  const match = ingredient.match(/^([\d\/\.\s]+\s*(?:g|kg|ml|l|cup|cups|tbsp|tsp|oz|lb|pack|can|bottle|bunch|piece|pieces|slice|slices|clove|cloves)?)?\s*(.+)$/i);
  
  if (match && match[2]) {
    const quantity = (match[1] || "").trim();
    let name = match[2].trim();
    
    // Clean and normalize the ingredient name
    name = cleanIngredientName(name);
    name = normalizeIngredientName(name);
    
    return { name, quantity };
  }
  
  return { name: cleanIngredientName(ingredient.toLowerCase()), quantity: "" };
}
