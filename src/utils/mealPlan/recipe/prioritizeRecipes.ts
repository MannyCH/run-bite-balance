
import { Recipe } from '@/context/types';
import { UserProfile } from '@/types/profile';

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
      const goalWords: Record<string, string[]> = {
        "lose": ["light", "low-calorie", "diet", "lean"],
        "gain": ["protein", "high-protein", "muscle", "bodybuilding"],
        "maintain": ["balanced", "healthy", "nutrition"]
      };
      
      const words = goalWords[profile.fitness_goal] || [];
      
      if (words.some(word => 
        recipe.categories?.some(cat => cat.toLowerCase().includes(word))
      )) {
        score += 3;
      }
    }
    
    // Score based on nutritional values (if available)
    if (profile.fitness_goal === "lose" && recipe.calories) {
      if (recipe.calories < 500) score += 2;
    } else if (profile.fitness_goal === "gain" && recipe.protein) {
      if (recipe.protein > 20) score += 2;
    }
    
    return { recipe, score };
  });
  
  // Sort by score (descending) and return recipes
  scoredRecipes.sort((a, b) => b.score - a.score);
  return scoredRecipes.map(item => item.recipe);
}
