
import crypto from 'crypto';
import { Recipe } from '@/context/types';
import { ExtendedRecipe } from './types';

/**
 * Generate a content hash for a recipe based on its core fields
 * This allows us to identify recipes that have similar content even with different IDs/titles
 */
export function generateContentHash(recipe: Recipe | ExtendedRecipe): string {
  // Get main_ingredient if it exists in the recipe
  const mainIngredient = 'main_ingredient' in recipe ? recipe.main_ingredient : undefined;
  
  // Combine key content fields to create a unique signature
  const contentFields = [
    recipe.ingredients?.join('').toLowerCase(),
    recipe.instructions?.join('').toLowerCase(),
    recipe.categories?.join('').toLowerCase(),
    String(recipe.calories),
    String(recipe.protein),
    String(recipe.carbs),
    String(recipe.fat),
    mainIngredient?.toLowerCase() // Include main ingredient in the hash if available
  ].filter(Boolean).join('|');
  
  // Create a hash of this content
  return crypto.createHash('md5').update(contentFields).digest('hex');
}
