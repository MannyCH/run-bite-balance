
import JSZip from "jszip";
import { Recipe } from "@/context/AppContext";

/**
 * Extract recipes from a zip file containing txt files and images
 * The text file format expects:
 * - First line: Recipe title
 * - Following sections marked by keywords: 
 *   - Ingredients:
 *   - Instructions:
 *   - Servings: (optional)
 *   - Categories: (optional)
 *   - Website: (optional)
 */
export const extractRecipesFromZip = async (zipFile: File): Promise<Recipe[]> => {
  const zip = new JSZip();
  const recipes: Recipe[] = [];
  
  try {
    console.log("Loading ZIP file...", zipFile.name, "Size:", zipFile.size, "Type:", zipFile.type);
    const zipContents = await zip.loadAsync(zipFile);
    console.log("ZIP loaded, finding files...");
    
    const files = Object.keys(zipContents.files);
    console.log("All files in ZIP:", files);
    
    const txtFiles = files.filter(name => name.endsWith(".txt") && !zipContents.files[name].dir);
    const imageFiles = files.filter(name => 
      (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png")) && !zipContents.files[name].dir
    );
    
    console.log("Found text files:", txtFiles);
    console.log("Found image files:", imageFiles);
    
    if (txtFiles.length === 0) {
      throw new Error("No recipe text files found in the ZIP file.");
    }
    
    // Create a map of image file names (without extension) to their blob URLs
    const imageMap: Record<string, string> = {};
    
    // Process image files first
    await Promise.all(imageFiles.map(async (fileName) => {
      const blob = await zipContents.files[fileName].async("blob");
      const blobUrl = URL.createObjectURL(blob);
      
      // Store by filename without extension for matching with recipe text files
      const baseName = fileName.split("/").pop()?.split(".")[0] || "";
      imageMap[baseName] = blobUrl;
    }));
    
    console.log("Processed images:", Object.keys(imageMap).length);
    
    // Process text files
    await Promise.all(txtFiles.map(async (fileName) => {
      const content = await zipContents.files[fileName].async("text");
      const lines = content.split("\n").map(line => line.trim());
      
      console.log(`Processing ${fileName}, found ${lines.length} lines`);
      
      if (lines.length < 3) {
        console.log(`Skipping ${fileName}: too few lines`);
        return; // Skip invalid files
      }
      
      // First line is the title (no explicit "Title:" section)
      const title = lines[0];
      console.log(`Title: ${title}`);
      
      // Find section markers
      const ingredientsIndex = lines.findIndex(line => line === "Ingredients:");
      const instructionsIndex = lines.findIndex(line => line === "Instructions:");
      const servingsIndex = lines.findIndex(line => line === "Servings:");
      const categoriesIndex = lines.findIndex(line => line === "Categories:");
      const websiteIndex = lines.findIndex(line => line === "Website:");
      
      console.log("Section markers:", { ingredientsIndex, instructionsIndex, servingsIndex, categoriesIndex, websiteIndex });
      
      if (ingredientsIndex === -1 || instructionsIndex === -1) {
        console.log(`Skipping ${fileName}: missing required sections`);
        return; // Skip files without mandatory sections
      }
      
      // Extract ingredients and instructions
      const ingredients: string[] = [];
      const instructions: string[] = [];
      let categories: string[] = [];
      let website: string | undefined = undefined;
      let servings: string | undefined = undefined;
      
      // Get ingredients - read until next section
      let nextSectionAfterIngredients = [instructionsIndex, servingsIndex, categoriesIndex, websiteIndex]
        .filter(index => index > ingredientsIndex)
        .sort((a, b) => a - b)[0];
        
      for (let i = ingredientsIndex + 1; i < nextSectionAfterIngredients; i++) {
        if (lines[i].trim() !== '') {
          ingredients.push(lines[i]);
        }
      }
      
      // Get instructions - read until next section
      let nextSectionAfterInstructions = [servingsIndex, categoriesIndex, websiteIndex]
        .filter(index => index > instructionsIndex)
        .sort((a, b) => a - b)[0];
        
      if (!nextSectionAfterInstructions) {
        nextSectionAfterInstructions = lines.length;
      }
      
      for (let i = instructionsIndex + 1; i < nextSectionAfterInstructions; i++) {
        if (lines[i].trim() !== '') {
          instructions.push(lines[i]);
        }
      }
      
      // Extract servings if available
      if (servingsIndex !== -1) {
        const nextSectionAfterServings = [categoriesIndex, websiteIndex]
          .filter(index => index > servingsIndex)
          .sort((a, b) => a - b)[0];
          
        if (nextSectionAfterServings) {
          servings = lines.slice(servingsIndex + 1, nextSectionAfterServings)
            .filter(line => line.trim() !== '')
            .join(", ");
        } else {
          servings = lines.slice(servingsIndex + 1)
            .filter(line => line.trim() !== '')
            .join(", ");
        }
      }
      
      // Extract categories if available
      if (categoriesIndex !== -1) {
        const nextSectionAfterCategories = websiteIndex > categoriesIndex ? websiteIndex : lines.length;
        const categoriesText = lines.slice(categoriesIndex + 1, nextSectionAfterCategories)
          .filter(line => line.trim() !== '')
          .join(", ");
          
        categories = categoriesText.split(",").map(cat => cat.trim()).filter(Boolean);
      }
      
      // Extract website if available
      if (websiteIndex !== -1 && websiteIndex < lines.length - 1) {
        website = lines[websiteIndex + 1].trim();
      }
      
      // Try to find a matching image
      const baseName = fileName.split("/").pop()?.split(".")[0] || "";
      const imgUrl = imageMap[baseName] || undefined;
      
      console.log("Processed recipe elements:", {
        ingredients: ingredients.length,
        instructions: instructions.length,
        categories,
        website,
        servings,
        hasImage: !!imgUrl
      });
      
      // Default nutritional values (since they're not specified in the text file)
      const calories = 0;
      const protein = 0;
      const carbs = 0;
      const fat = 0;
      
      const recipe = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        calories,
        protein,
        carbs,
        fat,
        imgUrl,
        ingredients,
        instructions,
        categories,
        website,
        servings
      };
      
      recipes.push(recipe);
      console.log(`Added recipe: ${title}`);
    }));
    
    console.log(`Total recipes extracted: ${recipes.length}`);
    return recipes;
    
  } catch (error) {
    console.error("Error processing zip file:", error);
    throw new Error("Failed to process zip file. Please make sure it contains valid recipe files.");
  }
};
