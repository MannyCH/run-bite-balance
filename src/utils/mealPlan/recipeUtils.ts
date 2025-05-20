import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from '@/types/profile';
import { Recipe } from '@/context/types';

/**
 * Saves a recipe to the user's collection
 */
export async function saveRecipeToCollection(recipeData: any): Promise<boolean> {
  try {
    // Ensure the recipe has the is_ai_generated flag set
    if (recipeData.is_ai_generated === undefined) {
      recipeData.is_ai_generated = true;
    }

    // Insert the recipe into the database
    const { data, error } = await supabase
      .from('recipes')
      .insert({
        title: recipeData.title,
        calories: recipeData.calories || 0,
        protein: recipeData.protein || 0,
        carbs: recipeData.carbs || 0,
        fat: recipeData.fat || 0,
        ingredients: recipeData.ingredients || [],
        instructions: recipeData.instructions || [],
        categories: recipeData.categories || [],
        is_ai_generated: recipeData.is_ai_generated
      });
    
    if (error) {
      console.error("Error saving recipe to collection:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in saveRecipeToCollection:", error);
    return false;
  }
}

/**
 * Filters recipes based on user preferences
 */
export function filterRecipesByPreferences(recipes: Recipe[], profile: UserProfile): Recipe[] {
  if (!recipes.length || !profile) return recipes;

  // Filter out recipes that contain allergens
  let filtered = recipes;
  
  if (profile.food_allergies && profile.food_allergies.length > 0) {
    filtered = filtered.filter(recipe => {
      // Skip recipes without ingredients
      if (!recipe.ingredients || recipe.ingredients.length === 0) return true;
      
      // Check if any ingredient contains allergic foods
      const hasAllergen = profile.food_allergies?.some(allergen => 
        recipe.ingredients.some(ingredient => 
          ingredient.toLowerCase().includes(allergen.toLowerCase())
        )
      );
      
      return !hasAllergen;
    });
  }
  
  // Filter out foods to avoid
  if (profile.foods_to_avoid && profile.foods_to_avoid.length > 0) {
    filtered = filtered.filter(recipe => {
      // Skip recipes without ingredients
      if (!recipe.ingredients || recipe.ingredients.length === 0) return true;
      
      // Check if any ingredient contains foods to avoid
      const hasAvoid = profile.foods_to_avoid?.some(food => 
        recipe.ingredients.some(ingredient => 
          ingredient.toLowerCase().includes(food.toLowerCase())
        )
      );
      
      return !hasAvoid;
    });
  }
  
  // Filter based on dietary preferences
  if (profile.dietary_preferences && profile.dietary_preferences.length > 0) {
    const preferences = profile.dietary_preferences;
    
    if (preferences.includes("vegetarian")) {
      filtered = filtered.filter(recipe => {
        // Skip recipes without categories or ingredients
        if (!recipe.ingredients || recipe.ingredients.length === 0) return true;
        
        // Check if recipe contains meat
        const meatKeywords = ["meat", "beef", "chicken", "pork", "fish", "seafood", "lamb", "turkey"];
        const hasMeat = recipe.ingredients.some(ingredient => 
          meatKeywords.some(keyword => ingredient.toLowerCase().includes(keyword))
        );
        
        return !hasMeat;
      });
    }
    
    if (preferences.includes("vegan")) {
      filtered = filtered.filter(recipe => {
        // Skip recipes without ingredients
        if (!recipe.ingredients || recipe.ingredients.length === 0) return true;
        
        // Check if recipe contains animal products
        const animalProductKeywords = ["meat", "beef", "chicken", "pork", "fish", "seafood", "lamb", "turkey", "egg", "milk", "cheese", "cream", "butter", "honey", "yogurt"];
        const hasAnimalProduct = recipe.ingredients.some(ingredient => 
          animalProductKeywords.some(keyword => ingredient.toLowerCase().includes(keyword))
        );
        
        return !hasAnimalProduct;
      });
    }
  }
  
  return filtered;
}

/**
 * Prioritizes recipes based on user preferences
 */
export function prioritizeRecipes(recipes: Recipe[], profile: UserProfile): Recipe[] {
  if (!recipes.length || !profile) return recipes;
  
  // Create a scoring system for recipes
  const scoredRecipes = recipes.map(recipe => {
    let score = 0;
    
    // Preferred cuisines get a higher score
    if (profile.preferred_cuisines && recipe.categories) {
      profile.preferred_cuisines.forEach(cuisine => {
        if (recipe.categories?.some(cat => cat.toLowerCase().includes(cuisine.toLowerCase()))) {
          score += 5;
        }
      });
    }
    
    // Recipes matching the fitness goal get a higher score
    if (profile.fitness_goal && recipe.categories) {
      const goalWords = {
        "weight_loss": ["light", "low-calorie", "diet", "lean"],
        "muscle_gain": ["protein", "high-protein", "muscle", "bodybuilding"],
        "maintenance": ["balanced", "healthy", "nutrition"]
      };
      
      const words = goalWords[profile.fitness_goal as keyof typeof goalWords] || [];
      
      if (words.some(word => 
        recipe.categories?.some(cat => cat.toLowerCase().includes(word))
      )) {
        score += 3;
      }
    }
    
    // Score based on nutritional values (if available)
    if (profile.fitness_goal === "weight_loss" && recipe.calories) {
      if (recipe.calories < 500) score += 2;
    } else if (profile.fitness_goal === "muscle_gain" && recipe.protein) {
      if (recipe.protein > 20) score += 2;
    }
    
    return { recipe, score };
  });
  
  // Sort by score (descending) and return recipes
  scoredRecipes.sort((a, b) => b.score - a.score);
  return scoredRecipes.map(item => item.recipe);
}

/**
 * Gets a random recipe based on criteria
 */
export function getRandomRecipe(
  recipes: Recipe[], 
  targetCalories: number, 
  targetProtein: number, 
  usedRecipeIds: string[] = [],
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'breakfast'
): Recipe | null {
  if (!recipes.length) return null;
  
  // Filter out already used recipes
  let available = recipes.filter(recipe => !usedRecipeIds.includes(recipe.id));
  
  // If no recipes left, return null
  if (available.length === 0) return null;
  
  // Filter by meal type if possible
  const mealTypeFilters = {
    breakfast: ["breakfast", "morning", "brunch"],
    lunch: ["lunch", "midday", "sandwich", "salad"],
    dinner: ["dinner", "supper", "evening"],
    snack: ["snack", "appetizer", "small plate"]
  };
  
  const typeKeywords = mealTypeFilters[mealType];
  const typedRecipes = available.filter(recipe => 
    recipe.categories?.some(category => 
      typeKeywords.some(keyword => category.toLowerCase().includes(keyword))
    )
  );
  
  // Use typed recipes if available, otherwise use all available recipes
  const recipePool = typedRecipes.length > 0 ? typedRecipes : available;
  
  // Get 20% calorie variance for flexibility
  const calorieMin = targetCalories * 0.8;
  const calorieMax = targetCalories * 1.2;
  
  // Find recipes that match calorie and protein criteria
  const matchingRecipes = recipePool.filter(recipe => 
    recipe.calories >= calorieMin && 
    recipe.calories <= calorieMax && 
    recipe.protein >= targetProtein * 0.8
  );
  
  // If we have matching recipes, pick a random one from those
  if (matchingRecipes.length > 0) {
    const randomIndex = Math.floor(Math.random() * matchingRecipes.length);
    return matchingRecipes[randomIndex];
  }
  
  // Otherwise, just pick a random recipe from the pool
  const randomIndex = Math.floor(Math.random() * recipePool.length);
  return recipePool[randomIndex];
}

/**
 * Generates nutritional context for a meal
 */
export function getContextForMeal(
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  recipe: Recipe,
  profile: UserProfile
): string {
  const mealContexts = {
    breakfast: [
      "A nutritious breakfast to kickstart your day",
      "Provides energy for your morning activities",
      "A healthy start to your day with balanced nutrients"
    ],
    lunch: [
      "A balanced midday meal to maintain your energy levels",
      "Keeps you going through the afternoon",
      "Provides sustained energy and nutrients for the day"
    ],
    dinner: [
      "A satisfying dinner with balanced nutrition",
      "Completes your daily nutritional needs",
      "A fulfilling dinner to end your day right"
    ],
    snack: [
      "A light snack to keep hunger at bay",
      "A quick energy boost between meals",
      "Helps maintain your metabolism between main meals"
    ]
  };
  
  let context = mealContexts[mealType][Math.floor(Math.random() * mealContexts[mealType].length)];
  
  // Add protein-specific context if it's high in protein
  if (recipe.protein >= 20) {
    context += ". High in protein";
    
    if (profile.fitness_goal === "muscle_gain") {
      context += ", supporting your muscle gain goals";
    } else {
      context += ", helping maintain muscle mass";
    }
  }
  
  // Add calorie-specific context if relevant
  if (profile.fitness_goal === "weight_loss" && recipe.calories < 500) {
    context += ". Lower in calories to support your weight loss goals";
  } else if (profile.fitness_goal === "muscle_gain" && recipe.calories > 600) {
    context += ". Provides adequate calories to support your training goals";
  }
  
  return context;
}
