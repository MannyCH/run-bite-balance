
import { Recipe } from '@/context/types';
import { UserProfile } from '@/types/profile';

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
