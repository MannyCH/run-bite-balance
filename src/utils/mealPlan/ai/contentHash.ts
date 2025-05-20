
import crypto from 'crypto';
import { Recipe } from '@/context/types';

/**
 * Generate a content hash for a recipe based on its core fields
 * This allows us to identify recipes that have similar content even with different IDs/titles
 */
export function generateContentHash(recipe: Recipe): string {
  // Combine key content fields to create a unique signature
  const contentFields = [
    recipe.ingredients?.join('').toLowerCase(),
    recipe.instructions?.join('').toLowerCase(),
    recipe.categories?.join('').toLowerCase(),
    String(recipe.calories),
    String(recipe.protein),
    String(recipe.carbs),
    String(recipe.fat),
    recipe.main_ingredient?.toLowerCase() // Include main ingredient in the hash
  ].filter(Boolean).join('|');
  
  // Create a hash of this content
  return crypto.createHash('md5').update(contentFields).digest('hex');
}
