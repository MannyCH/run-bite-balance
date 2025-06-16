
// Seasonal and weather-based recipe filtering
import type { RecipeSummary } from "./types.ts";
import type { WeeklyWeather } from "./weatherService.ts";

export interface SeasonalContext {
  weather: WeeklyWeather;
  location: string;
  preferences: {
    avoidHeavyInHeat: boolean;
    preferSeasonalIngredients: boolean;
    considerSwissTraditional: boolean;
  };
}

/**
 * Filter and score recipes based on seasonal and weather appropriateness
 */
export function filterSeasonallyAppropriateRecipes(
  recipes: RecipeSummary[],
  context: SeasonalContext
): RecipeSummary[] {
  return recipes.map(recipe => ({
    ...recipe,
    seasonalScore: calculateSeasonalScore(recipe, context)
  })).sort((a, b) => (b.seasonalScore || 0) - (a.seasonalScore || 0));
}

/**
 * Calculate how suitable a recipe is for current weather/season (0-10 scale)
 */
function calculateSeasonalScore(recipe: RecipeSummary, context: SeasonalContext): number {
  let score = 5; // Base score
  const { weather } = context;
  
  // Check seasonal suitability - FIXED LOGIC
  if (recipe.seasonal_suitability?.includes(weather.season)) {
    score += 3; // Strong bonus for season-specific recipes
  } else if (recipe.seasonal_suitability?.includes('year_round')) {
    score += 1; // Mild bonus for year-round recipes (don't penalize them)
  } else if (recipe.seasonal_suitability && recipe.seasonal_suitability.length > 0) {
    // Only penalize if recipe has specific seasons but doesn't match current season
    const hasSpecificSeasons = recipe.seasonal_suitability.some(s => s !== 'year_round');
    if (hasSpecificSeasons) {
      score -= 2; // Penalty for non-matching seasonal recipes
    }
  }
  
  // Temperature preference scoring - IMPROVED LOGIC
  if (recipe.temperature_preference) {
    switch (weather.temperatureCategory) {
      case 'hot':
        if (recipe.temperature_preference === 'hot_weather') {
          score += 3;
        } else if (recipe.temperature_preference === 'cold_weather') {
          score -= 4; // Heavy penalty for cold weather dishes in hot weather
        } else if (recipe.temperature_preference === 'any') {
          score += 0.5; // Small bonus for flexible recipes
        }
        break;
        
      case 'cold':
        if (recipe.temperature_preference === 'cold_weather') {
          score += 3;
        } else if (recipe.temperature_preference === 'hot_weather') {
          score -= 3; // Penalty for hot weather dishes in cold weather
        } else if (recipe.temperature_preference === 'any') {
          score += 0.5; // Small bonus for flexible recipes
        }
        break;
        
      case 'mild':
        if (recipe.temperature_preference === 'mild_weather') {
          score += 2;
        } else if (recipe.temperature_preference === 'any') {
          score += 1; // Good for flexible recipes
        }
        break;
    }
  }
  
  // Dish type scoring based on temperature - ENHANCED LOGIC
  if (recipe.dish_type) {
    if (weather.temperatureCategory === 'hot' && recipe.dish_type === 'cooling') {
      score += 2; // Bonus for cooling dishes in hot weather
    } else if (weather.temperatureCategory === 'cold' && recipe.dish_type === 'warming') {
      score += 2; // Bonus for warming dishes in cold weather
    } else if (weather.temperatureCategory === 'hot' && recipe.dish_type === 'warming') {
      score -= 3; // Strong penalty for warming dishes in hot weather
    } else if (weather.temperatureCategory === 'cold' && recipe.dish_type === 'cooling') {
      score -= 2; // Penalty for cooling dishes in cold weather
    }
    // Neutral dishes get no modifier (which is good)
  }
  
  // Swiss seasonal considerations
  if (context.preferences.considerSwissTraditional) {
    score += getSwissSeasonalBonus(recipe, weather.season);
  }
  
  // Ensure score stays within reasonable bounds
  return Math.max(0, Math.min(10, score));
}

/**
 * Add bonus for traditional Swiss seasonal dishes
 */
function getSwissSeasonalBonus(recipe: RecipeSummary, season: string): number {
  const recipeTitle = recipe.title.toLowerCase();
  
  switch (season) {
    case 'winter':
      if (recipeTitle.includes('fondue') || 
          recipeTitle.includes('raclette') || 
          recipeTitle.includes('soup') ||
          recipeTitle.includes('stew') ||
          recipeTitle.includes('chili') ||
          recipeTitle.includes('curry') ||
          recipeTitle.includes('casserole')) {
        return 1.5;
      }
      break;
      
    case 'summer':
      if (recipeTitle.includes('salad') || 
          recipeTitle.includes('grilled') || 
          recipeTitle.includes('cold') ||
          recipeTitle.includes('fresh') ||
          recipeTitle.includes('gazpacho') ||
          recipeTitle.includes('smoothie') ||
          recipeTitle.includes('ice cream')) {
        return 1.5;
      }
      break;
      
    case 'autumn':
      if (recipeTitle.includes('pumpkin') || 
          recipeTitle.includes('mushroom') || 
          recipeTitle.includes('root') ||
          recipeTitle.includes('squash') ||
          recipeTitle.includes('apple') ||
          recipeTitle.includes('harvest')) {
        return 1;
      }
      break;
      
    case 'spring':
      if (recipeTitle.includes('asparagus') || 
          recipeTitle.includes('fresh') || 
          recipeTitle.includes('green') ||
          recipeTitle.includes('pea') ||
          recipeTitle.includes('herb') ||
          recipeTitle.includes('light')) {
        return 1;
      }
      break;
  }
  
  return 0;
}

/**
 * Generate weather and seasonal context for OpenAI
 */
export function generateWeatherContext(weather: WeeklyWeather): string {
  const tempRange = weather.dailyWeather.length > 0 
    ? `${Math.min(...weather.dailyWeather.map(d => d.temperature))}°C to ${Math.max(...weather.dailyWeather.map(d => d.temperature))}°C`
    : `${weather.averageTemp}°C average`;
    
  const seasonalGuidance = getSeasonalGuidance(weather.season, weather.temperatureCategory);
  
  return `
LOCATION & WEATHER CONTEXT:
- Location: Bern, Switzerland
- Season: ${weather.season}
- Weekly temperature range: ${tempRange}
- Weather category: ${weather.temperatureCategory} weather
- Average temperature: ${weather.averageTemp}°C

CRITICAL SEASONAL REQUIREMENTS:
${seasonalGuidance}

RECIPE FILTERING RULES:
- AVOID recipes marked for opposite seasons (e.g., no winter dishes in summer)
- PRIORITIZE recipes with matching seasonal_suitability
- RESPECT temperature_preference classifications strictly
- FAVOR cooling dishes in hot weather, warming dishes in cold weather
- Year-round recipes are acceptable but seasonal matches are preferred

TEMPERATURE-BASED PREFERENCES:
${getTemperatureGuidelines(weather.temperatureCategory)}
`;
}

/**
 * Get seasonal eating guidance for Switzerland
 */
function getSeasonalGuidance(season: string, tempCategory: string): string {
  const guidance = {
    spring: `
- Fresh spring vegetables (asparagus, peas, early greens)
- Lighter preparations after winter
- Fresh herbs and seasonal produce
- Moderate warming dishes for cool days
- AVOID heavy winter stews and warming soups`,
    
    summer: `
- Light, refreshing meals are ESSENTIAL
- Fresh salads and cold dishes PREFERRED
- Grilled foods and outdoor cooking
- Seasonal fruits and vegetables
- STRICTLY AVOID heavy, warming dishes, soups, stews, and comfort foods`,
    
    autumn: `
- Hearty harvest ingredients (pumpkin, mushrooms, root vegetables)
- Warming preparations for cooling weather
- Preserving and comfort foods
- Traditional Swiss autumn dishes
- AVOID light summer salads and cold dishes`,
    
    winter: `
- Warming, comfort foods are ESSENTIAL
- Traditional Swiss winter dishes (fondue, raclette) PREFERRED
- Hearty soups and stews
- Rich, satisfying meals for cold weather
- AVOID cold salads, gazpacho, and cooling dishes`
  };
  
  return guidance[season] || guidance.winter;
}

/**
 * Get temperature-specific meal guidelines
 */
function getTemperatureGuidelines(tempCategory: string): string {
  switch (tempCategory) {
    case 'hot':
      return `
- PRIORITIZE cooling, refreshing dishes ONLY
- STRICTLY AVOID heavy, warming meals
- FOCUS on salads, cold soups, grilled items
- Light proteins and fresh ingredients
- NO soups, stews, casseroles, or warming dishes`;
      
    case 'cold':
      return `
- EMPHASIZE warming, comforting dishes ONLY
- INCLUDE hearty soups, stews, and braised items
- Traditional winter preparations PREFERRED
- Rich, satisfying meals
- AVOID salads, cold dishes, and cooling foods`;
      
    case 'mild':
    default:
      return `
- Balanced meal selection
- Mix of light and substantial dishes
- Seasonal ingredients preferred
- Flexible cooking methods
- Moderate preferences for season-appropriate dishes`;
  }
}
