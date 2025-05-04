
import { supabase } from "@/lib/supabase";

/**
 * Upload an image to Supabase Storage and return the public URL
 */
export const uploadImageToSupabase = async (fileName: string, blob: Blob): Promise<string | null> => {
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
