import type { ProgressCallback } from './zipProcessor';

/**
 * Parse recipe text files in the format:
 * Title
 * Ingredients:
 * ingredient 1
 * ingredient 2
 * Instructions:
 * step 1
 * step 2
 * etc.
 */
export const parseRecipesFromText = async (
  zipContents: any,
  textFiles: string[],
  imageMap: Record<string, string>,
  progressCallback?: ProgressCallback
): Promise<any[]> => {
  const recipes: any[] = [];
  let processedRecipes = 0;

  for (const fileName of textFiles) {
    try {
      // Get the text content
      const textContent = await zipContents.files[fileName].async("text");
      console.log(`Processing text file: ${fileName}, content length: ${textContent.length}`);
      console.log("Text content sample:", textContent.substring(0, 200) + "...");

      // Parse the text content
      const recipeData = parseRecipeText(textContent);
      console.log(`Parsed recipe data for ${fileName}:`, recipeData);

      // Basic validation - ensure it has at least a title
      if (!recipeData.title) {
        console.warn(`⚠️ Skipping invalid recipe in ${fileName}: Missing title`);
        // Try to create a title from the filename if possible
        const baseName = fileName.split("/").pop()?.split(".")[0] || "";
        if (baseName) {
          recipeData.title = baseName.replace(/_/g, " ").replace(/-/g, " ");
          console.log(`Created title from filename: ${recipeData.title}`);
        } else {
          continue; // Skip if we can't even create a title
        }
      }

      // Process the recipe - normalize fields
      const processedRecipe = {
        id: crypto.randomUUID(),
        title: recipeData.title,
        calories: recipeData.calories || 0,
        protein: recipeData.protein || 0,
        carbs: recipeData.carbs || 0,
        fat: recipeData.fat || 0,
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        categories: recipeData.categories || [],
        website: recipeData.website || null,
        servings: recipeData.servings || null,
        imgurl: null, // Will be populated below if an image match is found
        is_blob_url: false,
        created_at: new Date().toISOString()
      };

      // Match recipe with image using naming conventions
      const baseName = fileName.split("/").pop()?.split(".")[0] || "";
      if (imageMap[baseName]) {
        console.log(`Found matching image for recipe ${baseName}`);
        processedRecipe.imgurl = imageMap[baseName];
      }

      recipes.push(processedRecipe);
      console.log(`Added recipe: ${processedRecipe.title}`);
    } catch (err) {
      console.error(`❌ Error processing recipe ${fileName}:`, err);
    } finally {
      processedRecipes++;
      if (progressCallback) {
        const percent = 60 + (processedRecipes / textFiles.length) * 30;
        progressCallback(
          `Processed ${processedRecipes}/${textFiles.length} recipes`,
          Math.round(percent)
        );
      }
    }
  }

  if (recipes.length === 0) {
    console.warn("No valid recipes were found in the ZIP file.");
  }

  return recipes;
};

/**
 * Parse recipe data from text format
 */
function parseRecipeText(text: string): any {
  const recipeData: any = {
    ingredients: [],
    instructions: [],
    categories: []
  };

  // Get title (first line)
  const lines = text.split('\n');
  if (lines.length > 0) {
    recipeData.title = lines[0].trim();
  }

  // Parse sections
  let currentSection: string | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '') continue; // Skip empty lines
    
    // Check for section headers
    if (line.toLowerCase().endsWith(':')) {
      const sectionName = line.toLowerCase().slice(0, -1);
      currentSection = sectionName;
      continue;
    }
    
    // Process based on current section
    if (!currentSection) continue;
    
    switch (currentSection) {
      case 'ingredients':
        recipeData.ingredients.push(line);
        break;
      case 'instructions':
        recipeData.instructions.push(line);
        break;
      case 'categories':
        recipeData.categories = line.split(',').map((cat: string) => cat.trim());
        break;
      case 'servings':
        recipeData.servings = line;
        break;
      case 'website':
        recipeData.website = line;
        break;
      case 'calories':
        recipeData.calories = parseInt(line) || 0;
        break;
      case 'protein':
        recipeData.protein = parseInt(line) || 0;
        break;
      case 'carbs':
        recipeData.carbs = parseInt(line) || 0;
        break;
      case 'fat':
        recipeData.fat = parseInt(line) || 0;
        break;
    }
  }
  
  return recipeData;
}

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
      console.log(`Processing JSON file: ${fileName}, content length: ${jsonContent.length}`);
      
      // Try to parse JSON and handle potential errors
      let recipeData;
      try {
        recipeData = JSON.parse(jsonContent);
        console.log(`Successfully parsed JSON for ${fileName}: `, recipeData);
      } catch (parseError) {
        console.error(`Failed to parse JSON in ${fileName}:`, parseError);
        console.log("JSON content sample:", jsonContent.substring(0, 200) + "...");
        continue; // Skip this file if JSON is invalid
      }

      // Basic validation - ensure it has at least a title
      if (!recipeData.title) {
        console.warn(`⚠️ Skipping invalid recipe in ${fileName}: Missing title`);
        // Try to create a title from the filename if possible
        const baseName = fileName.split("/").pop()?.split(".")[0] || "";
        if (baseName) {
          recipeData.title = baseName.replace(/_/g, " ").replace(/-/g, " ");
          console.log(`Created title from filename: ${recipeData.title}`);
        } else {
          continue; // Skip if we can't even create a title
        }
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
        console.log(`Found matching image for recipe ${baseName}`);
        processedRecipe.imgurl = imageMap[baseName];
      }

      recipes.push(processedRecipe);
      console.log(`Added recipe: ${processedRecipe.title}`);
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

  if (recipes.length === 0) {
    console.warn("No valid recipes were found in the ZIP file.");
  }

  return recipes;
};
