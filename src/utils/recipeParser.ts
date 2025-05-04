import type { ProgressCallback } from './zipProcessor';
import { sanitizeFilename } from './zipProcessor';

export const parseRecipesFromText = async (
  zipContents: any,
  textFiles: string[],
  imageMap: Record<string, string>,
  progressCallback?: ProgressCallback
): Promise<any[]> => {
  const recipes: any[] = [];
  let processedRecipes = 0;

  console.log("Available images for matching:", Object.keys(imageMap));

  for (const fileName of textFiles) {
    try {
      const textContent = await zipContents.files[fileName].async("text");
      console.log(`Processing text file: ${fileName}`);

      const recipeData = parseRecipeText(textContent);

      if (!recipeData.title) {
        const baseName = fileName.split("/").pop()?.split(".")[0] || "";
        if (baseName) {
          recipeData.title = baseName.replace(/_/g, " ").replace(/-/g, " ");
        } else {
          continue;
        }
      }

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
        imgUrl: null, // ✅ Corrected key
        is_blob_url: false,
        created_at: new Date().toISOString()
      };

      const baseName = fileName.split("/").pop()?.split(".")[0] || "";
      const sanitizedBaseName = sanitizeFilename(baseName);
      const baseNameLower = baseName.toLowerCase();
      const baseNameNoUnderscores = baseName.replace(/_/g, "").toLowerCase();
      const titleNoSpaces = recipeData.title.replace(/\s+/g, "").toLowerCase();

      const tryKeys = [
        sanitizedBaseName,
        baseName,
        baseNameLower,
        baseNameNoUnderscores,
        titleNoSpaces
      ];

      for (const key of tryKeys) {
        if (imageMap[key]) {
          processedRecipe.imgUrl = imageMap[key];
          break;
        }
      }

      if (!processedRecipe.imgUrl) {
        const fuzzyMatch = Object.keys(imageMap).find(img =>
          img.includes(baseNameNoUnderscores) || baseNameNoUnderscores.includes(img)
        );
        if (fuzzyMatch) {
          processedRecipe.imgUrl = imageMap[fuzzyMatch];
        }
      }

      // Optional fallback:
      // if (!processedRecipe.imgUrl) {
      //   processedRecipe.imgUrl = "https://yourdomain.com/default.jpg";
      // }

      recipes.push(processedRecipe);
      console.log(`✅ Added recipe: ${processedRecipe.title}, image: ${processedRecipe.imgUrl || 'none'}`);
    } catch (err) {
      console.error(`❌ Error processing recipe ${fileName}:`, err);
    } finally {
      processedRecipes++;
      if (progressCallback) {
        const percent = 60 + (processedRecipes / textFiles.length) * 30;
        progressCallback(`Processed ${processedRecipes}/${textFiles.length} recipes`, Math.round(percent));
      }
    }
  }

  return recipes;
};

function parseRecipeText(text: string): any {
  const recipeData: any = {
    ingredients: [],
    instructions: [],
    categories: []
  };

  const lines = text.split('\n');

  if (lines.length > 0) {
    let titleLines = [];
    let i = 0;
    while (i < lines.length && !lines[i].trim().endsWith(':')) {
      const line = lines[i].trim();
      if (line) titleLines.push(line);
      i++;
    }

    recipeData.title = titleLines.join(' ').trim();

    let currentSection: string | null = null;

    for (; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue;
      if (line.endsWith(':')) {
        currentSection = line.slice(0, -1).toLowerCase().trim();
        continue;
      }

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
        case 'notes':
          if (!recipeData.notes) recipeData.notes = [];
          recipeData.notes.push(line);
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
  }

  return recipeData;
}

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
      const jsonContent = await zipContents.files[fileName].async("text");
      let recipeData;
      try {
        recipeData = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error(`❌ Failed to parse JSON in ${fileName}:`, parseError);
        continue;
      }

      if (!recipeData.title) {
        const baseName = fileName.split("/").pop()?.split(".")[0] || "";
        if (baseName) {
          recipeData.title = baseName.replace(/_/g, " ").replace(/-/g, " ");
        } else {
          continue;
        }
      }

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
        imgUrl: null, // ✅ fixed key
        is_blob_url: false,
        created_at: new Date().toISOString()
      };

      const baseName = fileName.split("/").pop()?.split(".")[0] || "";
      const sanitizedBaseName = sanitizeFilename(baseName);
      if (imageMap[sanitizedBaseName]) {
        processedRecipe.imgUrl = imageMap[sanitizedBaseName];
      }

      recipes.push(processedRecipe);
    } catch (err) {
      console.error(`❌ Error processing recipe ${fileName}:`, err);
    } finally {
      processedRecipes++;
      if (progressCallback) {
        const percent = 60 + (processedRecipes / jsonFiles.length) * 30;
        progressCallback(`Processed ${processedRecipes}/${jsonFiles.length} recipes`, Math.round(percent));
      }
    }
  }

  return recipes;
};
