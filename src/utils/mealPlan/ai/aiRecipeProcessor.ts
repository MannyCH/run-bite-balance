
import { supabase } from '@/integrations/supabase/client';
import { Recipe } from '@/context/types';
import crypto from 'crypto';
import { ContentHashMap } from './types';
import { extractMainIngredient } from './ingredientUtils';
import { generateContentHash } from './contentHash';

/**
 * Process and save AI-generated recipes to the database
 */
export async function processAIRecipes(
  aiGeneratedRecipes: any[] | undefined
): Promise<Record<string, Recipe>> {
  // Track content hashes of AI recipes to ensure uniqueness
  const contentHashMap = new Map<string, Recipe>();
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
      // Get main ingredient from recipe if available
      const mainIngredient = recipe.main_ingredient || extractMainIngredient(recipe);
      
      // Create a content hash for deduplication
      const contentFields = [
        (recipe.ingredients || []).join('').toLowerCase(),
        (recipe.instructions || []).join('').toLowerCase(),
        recipe.meal_type?.toLowerCase() || '',
        String(recipe.calories || 0),
        String(recipe.protein || 0),
        String(recipe.carbs || 0),
        String(recipe.fat || 0),
        mainIngredient
      ].filter(Boolean).join('|');
      
      const contentHash = crypto.createHash('md5').update(contentFields).digest('hex');
      
      // Check if we already have a recipe with very similar content
      if (!contentHashMap.has(contentHash)) {
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
          main_ingredient: mainIngredient, // Add main ingredient field
          created_at: new Date(timestamp + (index * 1000) + randomSuffix).toISOString(), // Give each recipe a different timestamp
          content_hash: contentHash // Store the content hash for future reference
        };
        
        // Add to our tracking maps
        contentHashMap.set(contentHash, newRecipe as unknown as Recipe);
        newAIRecipesToSave.push(newRecipe);
        
        console.log(`Added AI recipe "${uniqueTitle}" with main ingredient "${mainIngredient}" and hash ${contentHash.substring(0, 8)}`);
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
