
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
export const recipeToDbFormat = async (recipe: any) => {
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
  
  return {
    id: recipeId,
    title: recipe.title,
    calories: recipe.calories,
    protein: recipe.protein,
    carbs: recipe.carbs,
    fat: recipe.fat,
    imgurl: imageUrl, // Map from camelCase to lowercase for database
    is_blob_url: isBlobUrl, // Store whether this was originally a blob URL
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    categories: recipe.categories,
    website: recipe.website,
    servings: recipe.servings,
    created_at: new Date().toISOString()
  };
};

/**
 * Maps a recipe from database format to application format
 */
export const dbToRecipeFormat = (recipe: any) => {
  return {
    id: recipe.id,
    title: recipe.title,
    calories: recipe.calories,
    protein: recipe.protein,
    carbs: recipe.carbs,
    fat: recipe.fat,
    imgUrl: recipe.imgurl, // Map from lowercase database field to camelCase
    isBlobUrl: recipe.is_blob_url || false, // Track blob URL status
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    categories: recipe.categories,
    website: recipe.website,
    servings: recipe.servings
  };
};
