
import { supabase } from '@/integrations/supabase/client';
import { Recipe } from '@/context/types';

/**
 * Process and save AI-generated recipes to the database
 */
export async function processAIRecipes(
  aiGeneratedRecipes: any[] | undefined
): Promise<Record<string, Recipe>> {
  // Track content hashes of AI recipes to ensure uniqueness
  const contentHashMap = new Map<string, string>();
  const mainIngredientMap = new Map<string, string[]>(); // Track main ingredients to avoid repetition
  const newAIRecipesToSave: any[] = [];
  const savedAIRecipes: Record<string, Recipe> = {};
  
  if (!aiGeneratedRecipes || !Array.isArray(aiGeneratedRecipes)) {
    console.log('No AI-generated recipes to process');
    return savedAIRecipes;
  }
  
  console.log(`Processing ${aiGeneratedRecipes.length} new AI-generated recipes`);
  
  // Extract AI-generated recipes for saving to database
  aiGeneratedRecipes.forEach((recipe: any, index: number) => {
    if (recipe && recipe.title) {
      // Ensure main ingredient is set, never null
      const mainIngredient = recipe.main_ingredient || extractMainIngredient(recipe);
      
      // Create a content hash for deduplication
      const contentHash = generateContentHash(recipe);
      
      // Check if we already have a recipe with very similar content
      // or with the same main ingredient (to avoid repetition)
      if (!contentHashMap.has(contentHash)) {
        // Track main ingredients to avoid repetition
        if (!mainIngredientMap.has(mainIngredient)) {
          mainIngredientMap.set(mainIngredient, []);
        }
        
        // Create a really unique ID for each recipe using timestamp + random number + index
        const timestamp = new Date().getTime();
        const randomSuffix = Math.floor(Math.random() * 10000);
        const uniqueTitle = `${recipe.title} (AI ${timestamp}-${randomSuffix}-${index})`;
        
        const newRecipe = {
          title: uniqueTitle, // Make the title unique
          calories: recipe.calories || 0,
          protein: recipe.protein || 0,
          carbs: recipe.carbs || 0,
          fat: recipe.fat || 0,
          ingredients: recipe.ingredients || [],
          instructions: recipe.instructions || [],
          categories: recipe.meal_type ? [recipe.meal_type] : [],
          is_ai_generated: true, // Mark as AI-generated
          main_ingredient: mainIngredient, // Always set the main ingredient
          created_at: new Date(timestamp + (index * 1000) + randomSuffix).toISOString(),
          content_hash: contentHash // Store the content hash for future reference
        };
        
        // Add to our tracking maps
        contentHashMap.set(contentHash, uniqueTitle);
        mainIngredientMap.get(mainIngredient)?.push(uniqueTitle);
        newAIRecipesToSave.push(newRecipe);
        
        console.log(`Added AI recipe "${uniqueTitle}" with main ingredient "${mainIngredient}"`);
      } else {
        console.log(`Skipped duplicate recipe "${recipe.title}" (similar to existing recipe)`);
      }
    }
  });
  
  // Save new AI-generated recipes to the database if any
  if (newAIRecipesToSave.length > 0) {
    console.log(`Saving ${newAIRecipesToSave.length} unique AI-generated recipes to the database`);
    
    const { data: insertedRecipes, error: recipeError } = await supabase
      .from('recipes')
      .insert(newAIRecipesToSave.map(recipe => {
        // Remove the content_hash field before saving to database
        const { content_hash, ...cleanRecipe } = recipe;
        return cleanRecipe;
      }))
      .select();
    
    if (recipeError) {
      console.error('Error saving AI-generated recipes:', recipeError);
      // Continue with the meal plan without saving the new recipes
    } else if (insertedRecipes) {
      console.log(`Successfully saved ${insertedRecipes.length} AI-generated recipes`);
      
      // Add newly saved recipes to the recipesMap
      insertedRecipes.forEach(recipe => {
        const recipeObj: Recipe = {
          id: recipe.id,
          title: recipe.title,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          categories: recipe.categories,
          is_ai_generated: true,
          main_ingredient: recipe.main_ingredient
        };
        
        savedAIRecipes[recipe.id] = recipeObj;
      });
    }
  }
  
  return savedAIRecipes;
}

/**
 * Create a hash of recipe content to identify similar recipes
 */
function generateContentHash(recipe: any): string {
  // Use title and first few ingredients/instructions to create a simple content hash
  const title = recipe.title || '';
  const ingredients = recipe.ingredients?.slice(0, 3).join('') || '';
  const instructions = recipe.instructions?.slice(0, 2).join('') || '';
  
  const content = `${title}${ingredients}${instructions}`.toLowerCase();
  
  // Simple hash function for strings
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString(16); // Convert to hex string
}

/**
 * Extract the main ingredient from a recipe based on ingredients list
 */
function extractMainIngredient(recipe: any): string {
  if (recipe.main_ingredient) {
    return recipe.main_ingredient;
  }
  
  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    return "unknown";
  }
  
  // Common protein sources that are often main ingredients
  const proteinKeywords = ["chicken", "beef", "pork", "turkey", "fish", "salmon", "tuna", "tofu", "tempeh", "eggs"];
  
  // Common grains that are often main ingredients
  const grainKeywords = ["rice", "pasta", "quinoa", "bread", "tortilla", "noodle", "couscous", "farro"];
  
  // Common vegetables that might be main ingredients
  const vegKeywords = ["cauliflower", "broccoli", "potato", "sweet potato", "squash", "eggplant", "zucchini"];
  
  // Common legumes
  const legumeKeywords = ["beans", "lentils", "chickpeas"];
  
  // All potential main ingredient keywords
  const allKeywords = [...proteinKeywords, ...grainKeywords, ...vegKeywords, ...legumeKeywords];
  
  // Look for potential main ingredients in the first few ingredients (which are usually the main ones)
  const firstFewIngredients = recipe.ingredients.slice(0, 3).join(" ").toLowerCase();
  
  for (const keyword of allKeywords) {
    if (firstFewIngredients.includes(keyword)) {
      return keyword;
    }
  }
  
  // If we couldn't find a match in common ingredients, just return the first ingredient
  const firstIngredient = recipe.ingredients[0].toLowerCase();
  // Extract the main part by removing quantities and prep instructions
  const mainPart = firstIngredient.split(" ").slice(1).join(" ").split(",")[0];
  return mainPart || "unknown";
}
