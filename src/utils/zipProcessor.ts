
import type { default as JSZip } from 'jszip';
import { uploadImageToSupabase } from './supabaseStorage';

// Define the progress callback type
export type ProgressCallback = (message: string, percent: number) => void;

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
      const url = await withTimeout(uploadImageToSupabase(fileName, blob), UPLOAD_TIMEOUT);
      if (url) return url;
    } catch (err) {
      console.warn(`❌ Upload failed (attempt ${attempt + 1}) for ${fileName}:`, err);
      if (attempt === retries) return null;
      await new Promise((r) => setTimeout(r, 500)); // brief wait before retry
    }
  }
  return null;
};

const BATCH_SIZE = 1;
const BATCH_DELAY = 200; // ms between batches
const UPLOAD_TIMEOUT = 10000; // ms

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

  for (let i = 0; i < imageFiles.length; i += BATCH_SIZE) {
    batches.push(imageFiles.slice(i, i + BATCH_SIZE));
  }

  let processedImages = 0;

  for (const batch of batches) {
    await Promise.all(
      batch.map(async (fileName) => {
        try {
          const blob = await zipContents.files[fileName].async("blob");
          const publicUrl = await retryUpload(fileName, blob);
          const baseName = fileName.split("/").pop()?.split(".")[0] || "";

          if (publicUrl) {
            imageMap[baseName] = publicUrl;
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

  return imageMap;
};

/**
 * Main function to extract recipes and related images from a ZIP file
 */
export const extractRecipesFromZip = async (
  file: File,
  progressCallback?: ProgressCallback
): Promise<any[]> => {
  // Import JSZip dynamically to improve initial load time
  const JSZip = (await import('jszip')).default;
  const { readFileAsArrayBuffer } = await import('./zipFileReader');
  const { parseRecipesFromJSON } = await import('./recipeParser');
  
  try {
    if (progressCallback) {
      progressCallback("Reading ZIP file...", 5);
    }
    
    // Read the file as an ArrayBuffer
    const fileBuffer = await readFileAsArrayBuffer(file);
    
    // Load the ZIP file contents
    if (progressCallback) {
      progressCallback("Unzipping contents...", 10);
    }
    const zipContents = await JSZip.loadAsync(fileBuffer);
    
    // Identify JSON and image files
    const jsonFiles: string[] = [];
    const imageFiles: string[] = [];
    
    Object.keys(zipContents.files).forEach((fileName) => {
      if (!zipContents.files[fileName].dir) {
        if (fileName.toLowerCase().endsWith(".json")) {
          jsonFiles.push(fileName);
        } else if (/\.(jpe?g|png|gif|webp|avif)$/i.test(fileName)) {
          imageFiles.push(fileName);
        }
      }
    });
    
    if (progressCallback) {
      progressCallback(`Found ${jsonFiles.length} recipes and ${imageFiles.length} images`, 15);
    }
    
    // Process and upload images first
    const imageMap = await processImagesFromZip(zipContents, imageFiles, progressCallback);
    
    // Process recipe JSON files
    if (progressCallback) {
      progressCallback("Processing recipe data...", 60);
    }
    
    const recipes = await parseRecipesFromJSON(zipContents, jsonFiles, imageMap, progressCallback);
    
    if (progressCallback) {
      progressCallback("Recipe import complete!", 100);
    }
    
    return recipes;
  } catch (error) {
    console.error("Error extracting recipes from ZIP:", error);
    throw new Error(`Failed to process ZIP: ${error instanceof Error ? error.message : String(error)}`);
  }
};
