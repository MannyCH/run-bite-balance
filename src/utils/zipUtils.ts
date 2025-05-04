
import JSZip from "jszip";
import { Recipe } from "@/context/AppContext";

/**
 * Extract recipes from a zip file containing txt files and images
 * The text file format expects:
 * - First line: Recipe title
 * - Second line: Calories, Protein, Carbs, Fat (comma-separated)
 * - Following lines: Ingredients (one per line until "Instructions:" is found)
 * - Remaining lines: Instructions
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
      
      if (lines.length < 2) return; // Skip invalid files
      
      const title = lines[0];
      const nutritionLine = lines[1].split(",");
      
      if (nutritionLine.length < 4) return; // Skip files with invalid nutrition format
      
      const calories = parseInt(nutritionLine[0], 10) || 0;
      const protein = parseInt(nutritionLine[1], 10) || 0;
      const carbs = parseInt(nutritionLine[2], 10) || 0;
      const fat = parseInt(nutritionLine[3], 10) || 0;
      
      const instructionIndex = lines.findIndex(line => line === "Instructions:");
      let ingredients: string[] = [];
      let instructions: string[] = [];
      
      if (instructionIndex > 2) {
        ingredients = lines.slice(2, instructionIndex).filter(line => line.trim() !== "");
        instructions = lines.slice(instructionIndex + 1).filter(line => line.trim() !== "");
      } else {
        // If no "Instructions:" marker, assume all remaining lines are ingredients
        ingredients = lines.slice(2).filter(line => line.trim() !== "");
      }
      
      // Try to find a matching image
      const baseName = fileName.split("/").pop()?.split(".")[0] || "";
      const imgUrl = imageMap[baseName] || undefined;
      
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
