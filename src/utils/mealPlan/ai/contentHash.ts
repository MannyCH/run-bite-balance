
/**
 * Generate a content hash for a recipe based on its core fields
 * This is a browser-compatible version that doesn't use Node.js crypto
 */
export function generateContentHash(recipe: any): string {
  // Combine key content fields to create a unique signature
  const contentFields = [
    recipe.ingredients?.join('').toLowerCase(),
    recipe.instructions?.join('').toLowerCase(),
    recipe.categories?.join('').toLowerCase(),
    String(recipe.calories),
    String(recipe.protein),
    String(recipe.carbs),
    String(recipe.fat),
    recipe.main_ingredient?.toLowerCase() // Include main ingredient in the hash if available
  ].filter(Boolean).join('|');
  
  // Use browser-compatible hashing (simple hash function)
  return simpleHash(contentFields);
}

/**
 * A simple string hashing function that works in browsers
 * Not cryptographically secure, but adequate for our content comparison needs
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to hex string and ensure it's positive
  return (hash >>> 0).toString(16).padStart(8, '0');
}
