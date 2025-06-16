
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
  
  // Check seasonal suitability
  if (recipe.seasonal_suitability?.includes(weather.season)) {
    score += 2;
  } else if (recipe.seasonal_suitability?.includes('year_round')) {
    score += 1;
  }
  
  // Temperature preference scoring
  switch (weather.temperatureCategory) {
    case 'hot':
      if (recipe.temperature_preference === 'hot_weather') {
        score += 2;
      } else if (recipe.temperature_preference === 'cold_weather') {
        score -= 3; // Heavily penalize cold weather dishes in hot weather
      }
      break;
      
    case 'cold':
      if (recipe.temperature_preference === 'cold_weather') {
        score += 2;
      } else if (recipe.temperature_preference === 'hot_weather') {
        score -= 2;
      }
      break;
      
    case 'mild':
      if (recipe.temperature_preference === 'mild_weather') {
        score += 1;
      }
      break;
  }
  
  // Dish type scoring based on temperature
  if (weather.temperatureCategory === 'hot' && recipe.dish_type === 'cooling') {
    score += 1;
  } else if (weather.temperatureCategory === 'cold' && recipe.dish_type === 'warming') {
    score += 1;
  } else if (weather.temperatureCategory === 'hot' && recipe.dish_type === 'warming') {
    score -= 2;
  }
  
  // Swiss seasonal considerations
  if (context.preferences.considerSwissTraditional) {
    score += getSwissSeasonalBonus(recipe, weather.season);
  }
  
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
          recipeTitle.includes('stew')) {
        return 1;
      }
      break;
      
    case 'summer':
      if (recipeTitle.includes('salad') || 
          recipeTitle.includes('grilled') || 
          recipeTitle.includes('cold') ||
          recipeTitle.includes('fresh')) {
        return 1;
      }
      break;
      
    case 'autumn':
      if (recipeTitle.includes('pumpkin') || 
          recipeTitle.includes('mushroom') || 
          recipeTitle.includes('root')) {
        return 1;
      }
      break;
      
    case 'spring':
      if (recipeTitle.includes('asparagus') || 
          recipeTitle.includes('fresh') || 
          recipeTitle.includes('green')) {
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

SEASONAL MEAL GUIDELINES:
${seasonalGuidance}

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
- Moderate warming dishes for cool days`,
    
    summer: `
- Light, refreshing meals
- Fresh salads and cold dishes
- Grilled foods and outdoor cooking
- Seasonal fruits and vegetables
- Minimal heavy, warming dishes`,
    
    autumn: `
- Hearty harvest ingredients (pumpkin, mushrooms, root vegetables)
- Warming preparations for cooling weather
- Preserving and comfort foods
- Traditional Swiss autumn dishes`,
    
    winter: `
- Warming, comfort foods
- Traditional Swiss winter dishes (fondue, raclette)
- Hearty soups and stews
- Rich, satisfying meals for cold weather`
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
- Prioritize cooling, refreshing dishes
- Avoid heavy, warming meals
- Focus on salads, cold soups, grilled items
- Light proteins and fresh ingredients`;
      
    case 'cold':
      return `
- Emphasize warming, comforting dishes
- Include hearty soups, stews, and braised items
- Traditional winter preparations
- Rich, satisfying meals`;
      
    case 'mild':
    default:
      return `
- Balanced meal selection
- Mix of light and substantial dishes
- Seasonal ingredients preferred
- Flexible cooking methods`;
  }
}
