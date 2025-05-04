
import { supabase } from "@/lib/supabase";

/**
 * Upload an image to Supabase Storage and return the public URL
 */
export const uploadImageToSupabase = async (fileName: string, blob: Blob): Promise<string | null> => {
  const ext = fileName.split('.').pop();
  const nameOnly = fileName.split('/').pop()?.split('.')[0] || `recipe-${Date.now()}`;
  const uploadPath = `${nameOnly}.${ext}`;

  console.log(`Uploading to Supabase storage: ${uploadPath}`);

  try {
    // Make sure the recipe-images bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (!buckets?.find(bucket => bucket.name === 'recipe-images')) {
      console.log('Creating recipe-images bucket as it does not exist');
      const { error: bucketError } = await supabase.storage.createBucket('recipe-images', { 
        public: true 
      });
      
      if (bucketError) {
        console.error('Failed to create bucket:', bucketError);
      }
    }
    
    // Upload the file
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

    // Get the public URL
    const { data } = supabase.storage.from("recipe-images").getPublicUrl(uploadPath);
    console.log(`Successfully uploaded and got public URL: ${data?.publicUrl}`);
    
    return data?.publicUrl ?? null;
  } catch (err) {
    console.error("❌ Unexpected error during upload:", err);
    return null;
  }
};
