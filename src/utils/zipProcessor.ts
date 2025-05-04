const BATCH_SIZE = 1;
const BATCH_DELAY = 200; // ms between batches
const UPLOAD_TIMEOUT = 10000; // ms

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
