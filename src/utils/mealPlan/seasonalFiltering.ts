
// Frontend seasonal filtering for meal plan generation
import { Recipe } from '@/context/types';

export interface SeasonalContext {
  season: string;
  averageTemp: number;
  temperatureCategory: 'hot' | 'cold' | 'mild';
}

// Get current season based on date
export function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

// Get temperature category based on season (simplified for frontend)
export function getTemperatureCategory(season: string): 'hot' | 'cold' | 'mild' {
  switch (season) {
    case 'summer': return 'hot';
    case 'winter': return 'cold';
    default: return 'mild';
  }
}

// Calculate seasonal score for a recipe (0-10 scale)
export function calculateSeasonalScore(recipe: Recipe, context: SeasonalContext): number {
  let score = 5; // Base score

  // Season match
  if (recipe.seasonal_suitability?.includes(context.season)) {
    score += 3;
  } else if (recipe.seasonal_suitability?.includes('year_round')) {
    score += 1;
  } else if (recipe.seasonal_suitability?.length && recipe.seasonal_suitability.length > 0) {
    const hasSpecificSeasons = recipe.seasonal_suitability.some(s => s !== 'year_round');
    if (hasSpecificSeasons) {
      score -= 2; // Penalty for wrong season
    }
  }

  // Temperature preference
  if (recipe.temperature_preference) {
    switch (context.temperatureCategory) {
      case 'hot':
        if (recipe.temperature_preference === 'hot_weather') score += 2;
        else if (recipe.temperature_preference === 'cold_weather') score -= 3;
        break;
      case 'cold':
        if (recipe.temperature_preference === 'cold_weather') score += 2;
        else if (recipe.temperature_preference === 'hot_weather') score -= 2;
        break;
      case 'mild':
        if (recipe.temperature_preference === 'any') score += 1;
        break;
    }
  }

  // Dish type preference
  if (recipe.dish_type) {
    if (context.temperatureCategory === 'hot' && recipe.dish_type === 'cooling') score += 2;
    else if (context.temperatureCategory === 'cold' && recipe.dish_type === 'warming') score += 2;
    else if (context.temperatureCategory === 'hot' && recipe.dish_type === 'warming') score -= 2;
  }

  return Math.max(0, Math.min(10, score));
}

// Filter recipes by seasonal appropriateness
export function filterSeasonallyAppropriateRecipes(
  recipes: Recipe[], 
  minSeasonalScore: number = 3
): Recipe[] {
  const season = getCurrentSeason();
  const temperatureCategory = getTemperatureCategory(season);
  const context: SeasonalContext = {
    season,
    averageTemp: temperatureCategory === 'hot' ? 25 : temperatureCategory === 'cold' ? 5 : 15,
    temperatureCategory
  };

  console.log(`Filtering recipes for ${season} season (${temperatureCategory} weather)`);

  return recipes
    .map(recipe => ({
      ...recipe,
      seasonalScore: calculateSeasonalScore(recipe, context)
    }))
    .filter(recipe => recipe.seasonalScore >= minSeasonalScore)
    .sort((a, b) => (b.seasonalScore || 0) - (a.seasonalScore || 0));
}
