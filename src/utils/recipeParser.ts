import type { ProgressCallback } from './zipProcessor';

// Import the sanitizeFilename function to use the same sanitization logic
import { sanitizeFilename } from './zipProcessor';

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

  // Log the full image map for debugging
  console.log("Available images for matching:", Object.keys(imageMap));

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

      // Try multiple strategies to match recipe with image
      const baseName = fileName.split("/").pop()?.split(".")[0] || "";
      const baseNameLower = baseName.toLowerCase();
      
      // NEW: Apply the same sanitization function to recipe filenames
      const sanitizedBaseName = sanitizeFilename(baseName);
      
      // Keep original matching attempts
      const baseNameNoUnderscores = baseName.replace(/_/g, "").toLowerCase();
      const titleNoSpaces = recipeData.title.replace(/\s+/g, "").toLowerCase();
      
      // Log all potential matching keys we're trying
      console.log(`Trying to match image for recipe: "${recipeData.title}"`);
      console.log(`Image matching attempts: [${baseName}, ${baseNameLower}, ${sanitizedBaseName}, ${baseNameNoUnderscores}, ${titleNoSpaces}]`);
      
      // Check for matches in different formats, prioritizing sanitized name first
      if (imageMap[sanitizedBaseName]) {
        console.log(`✅ Found sanitized name match for ${sanitizedBaseName}`);
        processedRecipe.imgurl = imageMap[sanitizedBaseName];
      } else if (imageMap[baseName]) {
        console.log(`✅ Found exact name match for ${baseName}`);
        processedRecipe.imgurl = imageMap[baseName];
      } else if (imageMap[baseNameLower]) {
        console.log(`✅ Found lowercase name match for ${baseNameLower}`);
        processedRecipe.imgurl = imageMap[baseNameLower];
      } else if (imageMap[baseNameNoUnderscores]) {
        console.log(`✅ Found no-underscores name match for ${baseNameNoUnderscores}`);
        processedRecipe.imgurl = imageMap[baseNameNoUnderscores];
      } else if (imageMap[titleNoSpaces]) {
        console.log(`✅ Found title-based match for ${titleNoSpaces}`);
        processedRecipe.imgurl = imageMap[titleNoSpaces];
      } else {
        // Try a fuzzy match for images with similar names
        const possibleMatches = Object.keys(imageMap).filter(imgName => 
          imgName.includes(baseNameNoUnderscores) || baseNameNoUnderscores.includes(imgName)
        );
        
        if (possibleMatches.length > 0) {
          console.log(`✅ Found fuzzy match: ${possibleMatches[0]}`);
          processedRecipe.imgurl = imageMap[possibleMatches[0]];
        } else {
          console.log(`❌ No image match found for ${baseName}`);
        }
      }
      
      if (processedRecipe.imgurl) {
        console.log(`✅ Recipe "${processedRecipe.title}" matched with image: ${processedRecipe.imgurl}`);
      } else {
        console.log(`⚠️ No image found for recipe "${processedRecipe.title}"`);
      }

      recipes.push(processedRecipe);
      console.log(`Added recipe: ${processedRecipe.title} with image: ${processedRecipe.imgurl || 'none'}`);
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
 * First line is the title (without a section header)
 * Then sections like "Ingredients:", "Instructions:", etc.
 */
function parseRecipeText(text: string): any {
  const recipeData: any = {
    ingredients: [],
    instructions: [],
    categories: []
  };

  // Split the text into lines
  const lines = text.split('\n');
  
  // First line is always the title, even if it contains multiple lines
  if (lines.length > 0) {
    // Get title from the first line(s) until we find a line that ends with a colon (section header)
    let titleLines = [];
    let i = 0;
    
    while (i < lines.length && !lines[i].trim().endsWith(':')) {
      const line = lines[i].trim();
      if (line) titleLines.push(line);
      i++;
    }
    
    // Join multiple title lines if needed
    recipeData.title = titleLines.join(' ').trim();
    
    // Process the rest of the content
    let currentSection: string | null = null;
    
    for (; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '') continue; // Skip empty lines
      
      // Check for section headers (lines ending with colon)
      if (line.endsWith(':')) {
        const sectionName = line.slice(0, -1).toLowerCase().trim();
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
        case 'notes':
          // Store notes if needed
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
