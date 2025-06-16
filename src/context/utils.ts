// Helper utility functions for the app context

/**
 * Validates if a string is a valid UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Generate a unique ID
 * This can be useful for local entities that don't need UUIDs
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Maps a recipe from application format to database format
 */
export const recipeToDbFormat = async (recipe: Recipe) => {
  // Check if the recipe has a valid UUID, if not generate one
  let recipeId: string;
  
  if (!recipe.id || typeof recipe.id !== 'string' || !isValidUUID(recipe.id)) {
    // Generate a new valid UUID if none exists or the existing one is invalid
    recipeId = crypto.randomUUID();
    console.log(`Generated new UUID ${recipeId} for recipe "${recipe.title}"`);
  } else {
    recipeId = recipe.id;
  }
  
  // Handle image URL - if it's a blob URL, we need to convert it
  let imageUrl = recipe.imgUrl;
  const isBlobUrl = imageUrl && imageUrl.startsWith('blob:');
  
  if (isBlobUrl) {
    console.log(`Recipe "${recipe.title}" has blob URL image that cannot be persisted to database`);
    // We can't store blob URLs in the database as they're temporary
    // Instead, we'll set to null in the database but track the blob status
    imageUrl = null;
  }
  
  const finalImageUrl = imageUrl || recipe.imgUrl;
  
  return {
    id: recipeId,
    title: recipe.title,
    calories: recipe.calories,
    protein: recipe.protein,
    carbs: recipe.carbs,
    fat: recipe.fat,
    imgurl: finalImageUrl, // Map from camelCase to lowercase for database
    is_blob_url: isBlobUrl, // Store whether this was originally a blob URL
    ingredients: recipe.ingredients || [],
    instructions: recipe.instructions || [],
    categories: recipe.categories || [],
    website: recipe.website || null,
    servings: recipe.servings || null,
    seasonal_suitability: ['year_round'], // Default for imported recipes
    temperature_preference: 'any', // Default for imported recipes
    dish_type: 'neutral', // Default for imported recipes
  };
};

/**
 * Maps a recipe from database format to application format
 */
export const dbToRecipeFormat = (dbRecipe: any): Recipe => {
  return {
    id: dbRecipe.id,
    title: dbRecipe.title,
    calories: dbRecipe.calories,
    protein: dbRecipe.protein,
    carbs: dbRecipe.carbs,
    fat: dbRecipe.fat,
    imgUrl: dbRecipe.imgurl,
    isBlobUrl: dbRecipe.is_blob_url || false,
    ingredients: dbRecipe.ingredients || [],
    instructions: dbRecipe.instructions || [],
    categories: dbRecipe.categories || [],
    website: dbRecipe.website,
    servings: dbRecipe.servings,
  };
};
