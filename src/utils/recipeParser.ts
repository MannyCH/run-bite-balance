
import { Recipe } from "@/context/AppContext";

/**
 * Parse recipe content from a text file
 */
export const parseRecipeFromText = (content: string, baseName: string, imageUrl?: string): Recipe | null => {
  try {
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

    // Create recipe object
    return {
      id: crypto.randomUUID(),
      title,
      calories: 0, // Default values
      protein: 0,
      carbs: 0,
      fat: 0,
      imgUrl: imageUrl,
      ingredients,
      instructions,
      categories,
      website,
      servings
    };
  } catch (err) {
    console.error(`Error parsing recipe:`, err);
    return null;
  }
};
