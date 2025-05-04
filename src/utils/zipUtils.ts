
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

// Type for progress callback
type ProgressCallback = (phase: string, percent: number) => void;

/**
 * Extract recipes from a zip file containing txt files and images
 */
export const extractRecipesFromZip = async (
  zipFile: File, 
  progressCallback?: ProgressCallback
): Promise<Recipe[]> => {
  const zip = new JSZip();
  const recipes: Recipe[] = [];

  try {
    console.log("Loading ZIP file...", zipFile.name, "Size:", zipFile.size, "Type:", zipFile.type);
    progressCallback?.("Loading ZIP file...", 0);
    
    // Safari-compatible approach to read the file
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = (e) => reject(new Error("Failed to read ZIP file"));
      reader.readAsArrayBuffer(zipFile);
    });
    
    // Load the ZIP file with the array buffer
    const zipContents = await zip.loadAsync(arrayBuffer);
    console.log("ZIP loaded, finding files...");
    progressCallback?.("Analyzing ZIP contents...", 10);

    const files = Object.keys(zipContents.files);
    const txtFiles = files.filter(name => name.endsWith(".txt") && !zipContents.files[name].dir);
    const imageFiles = files.filter(name =>
      (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png")) && !zipContents.files[name].dir
    );

    console.log(`Found ${txtFiles.length} recipe files and ${imageFiles.length} image files`);
    progressCallback?.(`Found ${txtFiles.length} recipes and ${imageFiles.length} images`, 20);

    // Map of baseName => public image URL
    const imageMap: Record<string, string> = {};

    // Batch process images in smaller groups to avoid memory issues in Safari
    const BATCH_SIZE = 3; // Reduced batch size for better Safari performance
    const imageBatches = [];
    for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
      imageBatches.push(imageFiles.slice(i, i + BATCH_SIZE));
    }

    let processedImages = 0;
    // Upload image files to Supabase in batches
    for (const batch of imageBatches) {
      try {
        await Promise.all(batch.map(async (fileName) => {
          try {
            const blob = await zipContents.files[fileName].async("blob");
            const publicUrl = await uploadImageToSupabase(fileName, blob);
            const baseName = fileName.split("/").pop()?.split(".")[0] || "";
            if (publicUrl) {
              imageMap[baseName] = publicUrl;
            }
            processedImages++;
            const imageProgress = (processedImages / imageFiles.length) * 30;
            progressCallback?.(`Uploaded ${processedImages}/${imageFiles.length} images`, 20 + imageProgress);
          } catch (err) {
            console.error(`Error processing image ${fileName}:`, err);
          }
        }));
        
        // Longer delay between batches to let the browser breathe in Safari
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error("Error processing image batch:", error);
        // Continue with next batch even if this one fails
      }
    }

    progressCallback?.("Processing recipe text files...", 50);

    // Process recipe text files in smaller batches
    const textBatches = [];
    for (let i = 0; i < txtFiles.length; i += BATCH_SIZE) {
      textBatches.push(txtFiles.slice(i, i + BATCH_SIZE));
    }

    let processedRecipes = 0;
    for (const batch of textBatches) {
      const batchRecipes = await Promise.all(batch.map(async (fileName) => {
        try {
          const content = await zipContents.files[fileName].async("text");
          const lines = content.split("\n").map(line => line.trim());

          if (lines.length < 3) return null;

          const title = lines[0];

          const ingredientsIndex = lines.findIndex(line => line === "Ingredients:");
          const instructionsIndex = lines.findIndex(line => line === "Instructions:");
          const servingsIndex = lines.findIndex(line => line === "Servings:");
          const categoriesIndex = lines.findIndex(line => line === "Categories:");
          const websiteIndex = lines.findIndex(line => line === "Website:");

          if (ingredientsIndex === -1 || instructionsIndex === -1) return null;

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
          return {
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
        } catch (err) {
          console.error(`Error processing recipe ${fileName}:`, err);
          return null;
        }
      }));

      // Add valid recipes to the collection
      recipes.push(...batchRecipes.filter(Boolean) as Recipe[]);
      
      processedRecipes += batch.length;
      const recipeProgress = (processedRecipes / txtFiles.length) * 50;
      progressCallback?.(`Processed ${processedRecipes}/${txtFiles.length} recipes`, 50 + recipeProgress);
      
      // Longer delay between batches for Safari
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`Successfully extracted ${recipes.length} recipes from ZIP file`);
    progressCallback?.(`Extracted ${recipes.length} recipes`, 100);
    return recipes;
  } catch (error) {
    console.error("Error extracting recipes from ZIP:", error);
    throw error;
  }
};
