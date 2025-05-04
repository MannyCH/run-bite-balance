
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
    const zipContents = await zip.loadAsync(zipFile);
    const txtFiles = Object.keys(zipContents.files).filter(name => name.endsWith(".txt"));
    const imageFiles = Object.keys(zipContents.files).filter(name => 
      name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png")
    );
    
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
    
    // Process text files
    await Promise.all(txtFiles.map(async (fileName) => {
      const content = await zipContents.files[fileName].async("text");
      const lines = content.split("\n").map(line => line.trim());
      
      if (lines.length < 3) return; // Skip invalid files
      
      const title = lines[0];
      
      // Find section markers
      const ingredientsIndex = lines.findIndex(line => line === "Ingredients:");
      const instructionsIndex = lines.findIndex(line => line === "Instructions:");
      const servingsIndex = lines.findIndex(line => line === "Servings:");
      const categoriesIndex = lines.findIndex(line => line === "Categories:");
      const websiteIndex = lines.findIndex(line => line === "Website:");
      
      if (ingredientsIndex === -1 || instructionsIndex === -1) return; // Skip files without mandatory sections
      
      // Extract ingredients and instructions
      const ingredients: string[] = [];
      const instructions: string[] = [];
      
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
      
      // Try to find a matching image
      const baseName = fileName.split("/").pop()?.split(".")[0] || "";
      const imgUrl = imageMap[baseName] || undefined;
      
      // Default nutritional values (since they're not specified in the text file)
      // These can be updated later if we find nutrition info in the file
      const calories = 0;
      const protein = 0;
      const carbs = 0;
      const fat = 0;
      
      recipes.push({
        id: Math.random().toString(36).substr(2, 9),
        title,
        calories,
        protein,
        carbs,
        fat,
        imgUrl,
        ingredients,
        instructions
      });
    }));
    
    return recipes;
    
  } catch (error) {
    console.error("Error processing zip file:", error);
    throw new Error("Failed to process zip file. Please make sure it contains valid recipe files.");
  }
};
