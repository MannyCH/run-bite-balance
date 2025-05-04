
import type { default as JSZip } from 'jszip';
import { uploadImageToSupabase } from './supabaseStorage';

// Define the progress callback type
export type ProgressCallback = (message: string, percent: number) => void;

const BATCH_SIZE = 1;
const BATCH_DELAY = 200; // ms between batches
const UPLOAD_TIMEOUT = 10000; // ms

// Sanitize filenames: replaces spaces, umlauts, special chars
// Export this function so it can be reused in recipeParser
export const sanitizeFilename = (name: string): string =>
  name
    .normalize("NFD")                   // convert e.g. ö → o + ¨
    .replace(/[\u0300-\u036f]/g, "")   // remove accent marks
    .replace(/\s+/g, "_")              // replace spaces with underscores
    .replace(/[^a-zA-Z0-9_.-]/g, "");  // remove unsafe characters

// Helper: timeout wrapper
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Upload timed out")), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });

// Helper: retry wrapper
const retryUpload = async (
  fileName: string,
  blob: Blob,
  retries = 2
): Promise<string | null> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const ext = fileName.split(".").pop() || "jpg";
      const base = fileName.split("/").pop()?.split(".")[0] || `recipe-${Date.now()}`;
      const safeName = sanitizeFilename(base);
      const safePath = `${safeName}.${ext}`;
      
      console.log(`Attempting to upload image: ${fileName} as ${safePath}`);

      const url = await withTimeout(uploadImageToSupabase(safePath, blob), UPLOAD_TIMEOUT);
      console.log(`Upload result for ${safePath}:`, url ? "Success" : "Failed");
      
      if (url) return url;
    } catch (err) {
      console.warn(`❌ Upload failed (attempt ${attempt + 1}) for ${fileName}:`, err);
      if (attempt === retries) return null;
      await new Promise((r) => setTimeout(r, 500)); // brief wait before retry
    }
  }
  return null;
};

/**
 * Safely processes and uploads image files from ZIP to Supabase
 */
export const processImagesFromZip = async (
  zipContents: JSZip,
  imageFiles: string[],
  progressCallback?: ProgressCallback
): Promise<Record<string, string>> => {
  const imageMap: Record<string, string> = {};
  const batches: string[][] = [];

  // Log basic debug info
  console.log(`Processing ${imageFiles.length} images from ZIP`);
  console.log("Image files to process:", imageFiles);

  for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
    batches.push(imageFiles.slice(i, i + BATCH_SIZE));
  }

  let processedImages = 0;

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (fileName) => {
        try {
          console.log(`Processing image: ${fileName}`);
          const blob = await zipContents.files[fileName].async("blob");
          
          // Extract the base name without extension for recipe matching
          const fullName = fileName.split("/").pop() || "";
          const baseName = fullName.split(".")[0];
          const sanitizedBaseName = sanitizeFilename(baseName);
          
          const publicUrl = await retryUpload(fileName, blob);
          
          if (publicUrl) {
            // Store using sanitized name as key
            imageMap[sanitizedBaseName] = publicUrl;
            
            // Also store original basenames for backward compatibility
            imageMap[baseName] = publicUrl;
            imageMap[baseName.toLowerCase()] = publicUrl;
            
            // Also store name without underscores for better matching
            const nameWithoutUnderscores = baseName.replace(/_/g, "").toLowerCase();
            imageMap[nameWithoutUnderscores] = publicUrl;
            
            console.log(`✅ Successfully mapped image: Original: ${baseName}, Sanitized: ${sanitizedBaseName} → ${publicUrl}`);
          } else {
            console.warn(`⚠️ Image skipped: ${fileName}`);
          }
        } catch (err) {
          console.error(`❌ Error processing image ${fileName}:`, err);
        } finally {
          processedImages++;
          if (progressCallback) {
            const percent = 20 + (processedImages / imageFiles.length) * 30;
            progressCallback(
              `Uploaded ${processedImages}/${imageFiles.length} images`,
              Math.round(percent)
            );
          }
        }
      })
    );

    await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
  }

  console.log("Final image map:", imageMap);
  return imageMap;
};

/**
 * Main function to extract recipes and related images from a ZIP file
 */
export const extractRecipesFromZip = async (
  file: File,
  progressCallback?: ProgressCallback
): Promise<any[]> => {
  const JSZip = (await import('jszip')).default;
  const { readFileAsArrayBuffer } = await import('./zipFileReader');
  const { parseRecipesFromText } = await import('./recipeParser');

  try {
    progressCallback?.("Reading ZIP file...", 5);

    const fileBuffer = await readFileAsArrayBuffer(file);

    progressCallback?.("Unzipping contents...", 10);
    const zipContents = await JSZip.loadAsync(fileBuffer);

    const textFiles: string[] = [];
    const imageFiles: string[] = [];

    // Debug: Log all files in the ZIP
    console.log("ZIP contents:", Object.keys(zipContents.files).map(f => ({ name: f, dir: zipContents.files[f].dir })));
    
    Object.keys(zipContents.files).forEach((fileName) => {
      if (!zipContents.files[fileName].dir) {
        if (fileName.toLowerCase().endsWith(".txt")) {
          textFiles.push(fileName);
          console.log("Found TXT file:", fileName);
        } else if (/\.(jpe?g|png|gif|webp|avif)$/i.test(fileName)) {
          imageFiles.push(fileName);
          console.log("Found image file:", fileName);
        }
      }
    });

    progressCallback?.(`Found ${textFiles.length} recipes and ${imageFiles.length} images`, 15);
    console.log(`Found ${textFiles.length} TXT files and ${imageFiles.length} image files in ZIP`);

    if (textFiles.length === 0) {
      throw new Error("No TXT recipe files found in the ZIP. Please ensure your ZIP contains valid .txt recipe files.");
    }

    // Process images first to create the mapping
    const imageMap = await processImagesFromZip(zipContents, imageFiles, progressCallback);
    console.log("Processed image map:", Object.keys(imageMap).length);

    progressCallback?.("Processing recipe data...", 60);
    const recipes = await parseRecipesFromText(zipContents, textFiles, imageMap, progressCallback);
    console.log("Processed recipes:", recipes.length);

    // Debug the recipes with and without images
    const withImages = recipes.filter(r => r.imgurl).length;
    const withoutImages = recipes.filter(r => !r.imgurl).length;
    console.log(`Recipes with images: ${withImages}, without images: ${withoutImages}`);

    progressCallback?.("Recipe import complete!", 100);
    return recipes;
  } catch (error) {
    console.error("Error extracting recipes from ZIP:", error);
    throw new Error(`Failed to process ZIP: ${error instanceof Error ? error.message : String(error)}`);
  }
};
