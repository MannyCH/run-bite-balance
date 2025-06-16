// OpenAI API client and meal plan generation
import type { UserProfile } from "../../../src/types/profile.ts";
import { createOpenAIClient, callOpenAIMealPlan } from "./openaiApi.ts";
import { buildSystemPrompt } from "./promptBuilder.ts";
import { prepareRecipeSummaries, groupRunsByDate, calculateAllDailyRequirements } from "./dataPreparation.ts";
import { createDailyBreakdown } from "./mealDistribution.ts";
import { fetchBernWeather } from "./weatherService.ts";
import { filterSeasonallyAppropriateRecipes } from "./seasonalFilter.ts";

/**
 * Generate meal plan using OpenAI
 */
export async function generateAIMealPlan(
  userId: string,
  profile: UserProfile,
  recipes: any[],
  runs: any[],
  startDate: string,
  endDate: string
) {
  try {
    console.log(`Generating AI meal plan for user ${userId} from ${startDate} to ${endDate}`);
    
    // Initialize OpenAI client
    const openai = createOpenAIClient();
    
    // Fetch weather data for Bern, Switzerland
    console.log('Fetching weather data for Bern, Switzerland...');
    const weatherData = await fetchBernWeather(startDate, endDate);
    
    if (weatherData) {
      console.log(`Weather context: ${weatherData.season} season, ${weatherData.averageTemp}°C average, ${weatherData.temperatureCategory} weather`);
    } else {
      console.log('Using seasonal fallback without weather data');
    }
    
    // Prepare data
    const recipeSummaries = prepareRecipeSummaries(recipes);
    const runsByDate = groupRunsByDate(runs);
    
    // Apply seasonal filtering to recipes
    const seasonallyFilteredRecipes = weatherData 
      ? filterSeasonallyAppropriateRecipes(recipeSummaries, {
          weather: weatherData,
          location: 'Bern, Switzerland',
          preferences: {
            avoidHeavyInHeat: true,
            preferSeasonalIngredients: true,
            considerSwissTraditional: true
          }
        })
      : recipeSummaries;
    
    console.log(`Filtered to ${seasonallyFilteredRecipes.length} seasonally appropriate recipes`);
    
    // Calculate requirements
    const { baseRequirements, dailyRequirements } = calculateAllDailyRequirements(
      profile,
      startDate,
      endDate,
      runsByDate
    );
    
    // Create daily breakdown
    const dailyBreakdown = createDailyBreakdown(dailyRequirements, runsByDate);
    
    // Calculate day count for logging
    const today = new Date(startDate);
    const endDateObj = new Date(endDate);
    const dayCount = Math.ceil((endDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24)) + 1;
    
    console.log(`Creating meal plan for ${dayCount} days`);
    console.log(`User preferences: ${JSON.stringify({
      fitness_goal: profile.fitness_goal || "maintain",
      nutritional_theory: profile.nutritional_theory || "balanced",
      allergies: profile.food_allergies || [],
      preferred_cuisines: profile.preferred_cuisines || [],
      foods_to_avoid: profile.foods_to_avoid || [],
      dietary_preferences: profile.dietary_preferences || [],
    })}`);
    console.log(`Base daily requirements: ${JSON.stringify(baseRequirements)}`);
    console.log(`Runs found: ${runs.length}`);
    
    // Build system prompt with weather context
    const systemPrompt = buildSystemPrompt(profile, baseRequirements, dailyBreakdown, dayCount, weatherData);
    
    // Call OpenAI API with seasonally filtered recipes
    return await callOpenAIMealPlan(openai, systemPrompt, seasonallyFilteredRecipes, startDate, endDate);
  } catch (error) {
    console.error("Error generating AI meal plan:", error);
    throw error;
  }
}
