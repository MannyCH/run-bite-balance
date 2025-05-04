
import type { ProgressCallback } from './zipProcessor';

/**
 * Parse and process recipe JSON files from a ZIP archive
 */
export const parseRecipesFromJSON = async (
  zipContents: any,
  jsonFiles: string[],
  imageMap: Record<string, string>,
  progressCallback?: ProgressCallback
): Promise<any[]> => {
  const recipes: any[] = [];
  let processedRecipes = 0;

  for (const fileName of jsonFiles) {
    try {
      // Get the JSON content
      const jsonContent = await zipContents.files[fileName].async("text");
      const recipeData = JSON.parse(jsonContent);

      // Basic validation - ensure it has at least a title
      if (!recipeData.title) {
        console.warn(`⚠️ Skipping invalid recipe in ${fileName}: Missing title`);
        continue;
      }

      // Process the recipe - normalize fields
      const processedRecipe = {
        id: crypto.randomUUID(),
        title: recipeData.title,
        calories: recipeData.calories || 0,
        protein: recipeData.protein || 0,
        carbs: recipeData.carbs || 0,
        fat: recipeData.fat || 0,
        ingredients: Array.isArray(recipeData.ingredients) ? recipeData.ingredients : [],
        instructions: Array.isArray(recipeData.instructions) ? recipeData.instructions : [],
        categories: Array.isArray(recipeData.categories) ? recipeData.categories : [],
        website: recipeData.website || null,
        servings: recipeData.servings || null,
        imgurl: null, // Will be populated below if an image match is found
        is_blob_url: false,
        created_at: new Date().toISOString()
      };

      // Match recipe with image using naming conventions
      const baseName = fileName.split("/").pop()?.split(".")[0] || "";
      if (imageMap[baseName]) {
        processedRecipe.imgurl = imageMap[baseName];
      }

      recipes.push(processedRecipe);
    } catch (err) {
      console.error(`❌ Error processing recipe ${fileName}:`, err);
    } finally {
      processedRecipes++;
      if (progressCallback) {
        const percent = 60 + (processedRecipes / jsonFiles.length) * 30;
        progressCallback(
          `Processed ${processedRecipes}/${jsonFiles.length} recipes`,
          Math.round(percent)
        );
      }
    }
  }

  return recipes;
};
