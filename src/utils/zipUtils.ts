
import JSZip from "jszip";
import { Recipe } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";

/**
 * Upload an image to Supabase Storage and return the public URL
 */
const uploadImageToSupabase = async (fileName: string, blob: Blob): Promise<string | null> => {
  const ext = fileName.split('.').pop();
  const nameOnly = fileName.split('/').pop()?.split('.')[0] || `recipe-${Date.now()}`;
  const uploadPath = `${nameOnly}.${ext}`;

  const { error } = await supabase.storage
    .from("recipe-images")
    .upload(uploadPath, blob, {
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    console.error("❌ Failed to upload image:", fileName, error);
    return null;
  }

  const { data } = supabase.storage.from("recipe-images").getPublicUrl(uploadPath);
  return data?.publicUrl ?? null;
};

/**
 * Extract recipes from a zip file containing txt files and images
 */
export const extractRecipesFromZip = async (zipFile: File): Promise<Recipe[]> => {
  const zip = new JSZip();
  const recipes: Recipe[] = [];

  try {
    console.log("Loading ZIP file...", zipFile.name, "Size:", zipFile.size, "Type:", zipFile.type);
    const zipContents = await zip.loadAsync(zipFile);
    console.log("ZIP loaded, finding files...");

    const files = Object.keys(zipContents.files);
    const txtFiles = files.filter(name => name.endsWith(".txt") && !zipContents.files[name].dir);
    const imageFiles = files.filter(name =>
      (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png")) && !zipContents.files[name].dir
    );

    // Map of baseName => public image URL
    const imageMap: Record<string, string> = {};

    // Upload image files to Supabase
    await Promise.all(imageFiles.map(async (fileName) => {
      const blob = await zipContents.files[fileName].async("blob");
      const publicUrl = await uploadImageToSupabase(fileName, blob);
      const baseName = fileName.split("/").pop()?.split(".")[0] || "";
      if (publicUrl) {
        imageMap[baseName] = publicUrl;
      }
    }));

    // Parse recipes
    await Promise.all(txtFiles.map(async (fileName) => {
      const content = await zipContents.files[fileName].async("text");
      const lines = content.split("\n").map(line => line.trim());

      if (lines.length < 3) return;

      const title = lines[0];

      const ingredientsIndex = lines.findIndex(line => line === "Ingredients:");
      const instructionsIndex = lines.findIndex(line => line === "Instructions:");
      const servingsIndex = lines.findIndex(line => line === "Servings:");
      const categoriesIndex = lines.findIndex(line => line === "Categories:");
      const websiteIndex = lines.findIndex(line => line === "Website:");

      if (ingredientsIndex === -1 || instructionsIndex === -1) return;

      const ingredients: string[] = [];
      const instructions: string[] = [];
      let categories: string[] = [];
      let website: string | undefined = undefined;
      let servings: string | undefined = undefined;

      let currentIndex = ingredientsIndex + 1;
      // Parse ingredients
      while (currentIndex < instructionsIndex && currentIndex < lines.length) {
        const line = lines[currentIndex].trim();
        if (line) ingredients.push(line);
        currentIndex++;
      }

      // Parse instructions
      currentIndex = instructionsIndex + 1;
      const nextSection = Math.min(
        ...[servingsIndex, categoriesIndex, websiteIndex].filter(i => i > 0)
      );
      
      while (currentIndex < (nextSection > 0 ? nextSection : lines.length) && currentIndex < lines.length) {
        const line = lines[currentIndex].trim();
        if (line) instructions.push(line);
        currentIndex++;
      }

      // Parse servings
      if (servingsIndex > 0) {
        servings = lines[servingsIndex + 1]?.trim();
      }

      // Parse categories
      if (categoriesIndex > 0) {
        const categoriesLine = lines[categoriesIndex + 1]?.trim();
        if (categoriesLine) {
          categories = categoriesLine.split(',').map(cat => cat.trim());
        }
      }

      // Parse website
      if (websiteIndex > 0) {
        website = lines[websiteIndex + 1]?.trim();
      }

      // Look for a matching image
      const baseName = fileName.split("/").pop()?.split(".")[0] || "";
      const imgUrl = imageMap[baseName];

      // Create recipe object
      const recipe: Recipe = {
        id: crypto.randomUUID(),
        title,
        calories: 0, // Default values
        protein: 0,
        carbs: 0,
        fat: 0,
        imgUrl,
        ingredients,
        instructions,
        categories,
        website,
        servings
      };

      recipes.push(recipe);
    }));
    
    console.log(`Successfully extracted ${recipes.length} recipes from ZIP file`);
    return recipes;
  } catch (error) {
    console.error("Error extracting recipes from ZIP:", error);
    throw error;
  }
};
