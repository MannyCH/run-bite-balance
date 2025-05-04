
import JSZip from "jszip";
import { Recipe } from "@/context/types";
import { readFileAsArrayBuffer } from "./zipFileReader";
import { uploadImageToSupabase } from "./supabaseStorage";
import { parseRecipeFromText } from "./recipeParser";

// Type for progress callback
export type ProgressCallback = (phase: string, percent: number) => void;

// Configuration for batch processing
const BATCH_SIZE = 3; // Reduced batch size for better Safari performance
const BATCH_DELAY = 200; // Milliseconds between batches

/**
 * Process images from ZIP file and return a map of baseName to image URL
 */
export const processImagesFromZip = async (
  zipContents: JSZip,
  imageFiles: string[],
  progressCallback?: ProgressCallback
): Promise<Record<string, string>> => {
  // Map of baseName => public image URL
  const imageMap: Record<string, string> = {};

  // Batch process images in smaller groups to avoid memory issues in Safari
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
          
          // Update progress if callback provided
          if (progressCallback) {
            const imageProgress = (processedImages / imageFiles.length) * 30;
            progressCallback(`Uploaded ${processedImages}/${imageFiles.length} images`, 20 + imageProgress);
          }
        } catch (err) {
          console.error(`Error processing image ${fileName}:`, err);
        }
      }));
      
      // Longer delay between batches to let the browser breathe in Safari
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    } catch (error) {
      console.error("Error processing image batch:", error);
      // Continue with next batch even if this one fails
    }
  }

  return imageMap;
};

/**
 * Process text files from ZIP file and convert them to recipes
 */
export const processRecipeFilesFromZip = async (
  zipContents: JSZip,
  txtFiles: string[],
  imageMap: Record<string, string>,
  progressCallback?: ProgressCallback
): Promise<Recipe[]> => {
  const recipes: Recipe[] = [];
  
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
        const baseName = fileName.split("/").pop()?.split(".")[0] || "";
        const imgUrl = imageMap[baseName]; // Look for a matching image
        
        return parseRecipeFromText(content, baseName, imgUrl);
      } catch (err) {
        console.error(`Error processing recipe ${fileName}:`, err);
        return null;
      }
    }));

    // Add valid recipes to the collection
    recipes.push(...batchRecipes.filter(Boolean) as Recipe[]);
    
    processedRecipes += batch.length;
    
    // Update progress if callback provided
    if (progressCallback) {
      const recipeProgress = (processedRecipes / txtFiles.length) * 50;
      progressCallback(`Processed ${processedRecipes}/${txtFiles.length} recipes`, 50 + recipeProgress);
    }
    
    // Longer delay between batches for Safari
    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
  }

  return recipes;
};

/**
 * Extract recipes from a zip file containing txt files and images
 */
export const extractRecipesFromZip = async (
  zipFile: File, 
  progressCallback?: ProgressCallback
): Promise<Recipe[]> => {
  const zip = new JSZip();

  try {
    console.log("Loading ZIP file...", zipFile.name, "Size:", zipFile.size, "Type:", zipFile.type);
    progressCallback?.("Loading ZIP file...", 0);
    
    // Safari-compatible approach to read the file
    const arrayBuffer = await readFileAsArrayBuffer(zipFile);
    
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

    // Process image files and create mapping for recipes
    const imageMap = await processImagesFromZip(zipContents, imageFiles, progressCallback);
    
    progressCallback?.("Processing recipe text files...", 50);

    // Process recipe text files and generate recipe objects
    const recipes = await processRecipeFilesFromZip(zipContents, txtFiles, imageMap, progressCallback);
    
    console.log(`Successfully extracted ${recipes.length} recipes from ZIP file`);
    progressCallback?.(`Extracted ${recipes.length} recipes`, 100);
    
    return recipes;
  } catch (error) {
    console.error("Error extracting recipes from ZIP:", error);
    throw error;
  }
};
