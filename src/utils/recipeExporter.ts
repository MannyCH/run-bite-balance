import JSZip from 'jszip';
import { sanitizeFilename } from './zipProcessor';
import type { Recipe } from '@/context/types';

/**
 * Formats a recipe object into the standard text format
 */
export const formatRecipeAsText = (recipe: Recipe): string => {
  const sections: string[] = [];

  sections.push(`Recipe Title:\n${recipe.title}`);

  if (recipe.ingredients && recipe.ingredients.length > 0) {
    sections.push(`Ingredients:\n${recipe.ingredients.join('\n')}`);
  }

  if (recipe.instructions && recipe.instructions.length > 0) {
    sections.push(`Instructions:\n${recipe.instructions.join('\n')}`);
  }

  if (recipe.servings) {
    sections.push(`Servings:\n${recipe.servings}`);
  }

  if (recipe.categories && recipe.categories.length > 0) {
    sections.push(`Categories:\n${recipe.categories.join(', ')}`);
  }

  if (recipe.website) {
    sections.push(`Website:\n${recipe.website}`);
  }

  return sections.join('\n\n') + '\n';
};

/**
 * Fetches an image from a URL and returns it as a blob with its extension
 */
const fetchImage = async (url: string): Promise<{ blob: Blob; ext: string } | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    // Determine extension from URL or content type
    const urlExt = url.split('.').pop()?.split('?')[0]?.toLowerCase();
    const validExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];
    const ext = urlExt && validExts.includes(urlExt) ? urlExt : 'jpg';
    return { blob, ext };
  } catch (err) {
    console.warn(`Failed to fetch image: ${url}`, err);
    return null;
  }
};

/**
 * Exports all recipes as a ZIP file containing TXT files and images
 */
export const exportAllRecipesAsZip = async (
  recipes: Recipe[],
  onProgress?: (message: string, percent: number) => void
): Promise<void> => {
  const zip = new JSZip();
  const usedNames = new Set<string>();

  const getUniqueName = (title: string): string => {
    let name = sanitizeFilename(title || 'recipe');
    if (!name) name = 'recipe';
    let uniqueName = name;
    let counter = 1;
    while (usedNames.has(uniqueName)) {
      uniqueName = `${name}_${counter}`;
      counter++;
    }
    usedNames.add(uniqueName);
    return uniqueName;
  };

  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    const safeName = getUniqueName(recipe.title);

    // Add text file
    const textContent = formatRecipeAsText(recipe);
    zip.file(`${safeName}.txt`, textContent);

    // Add image if available
    if (recipe.imgUrl && !recipe.isBlobUrl) {
      const imageData = await fetchImage(recipe.imgUrl);
      if (imageData) {
        zip.file(`${safeName}.${imageData.ext}`, imageData.blob);
      }
    }

    onProgress?.(
      `Processing ${i + 1}/${recipes.length} recipes...`,
      Math.round(((i + 1) / recipes.length) * 90)
    );
  }

  onProgress?.('Generating ZIP file...', 95);
  const blob = await zip.generateAsync({ type: 'blob' });

  // Trigger download using window.open as fallback for sandboxed iframes
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recipes_export.zip';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    // Fallback: also try opening in new tab
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  } catch {
    // If click download fails, open blob URL directly
    window.open(url, '_blank');
  }

  onProgress?.('Export complete!', 100);
};
