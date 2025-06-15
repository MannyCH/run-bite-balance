
// OpenAI API client and meal plan generation
import OpenAI from "https://esm.sh/openai@4.20.0";
import type { UserProfile } from "../../../src/types/profile.ts";
import type { DailyRequirements, DailyBreakdown, RecipeSummary } from "./types.ts";
import { calculateDailyRequirements, calculateDaySpecificRequirements } from "./nutritionCalculator.ts";
import { getNutritionalTheoryGuidance } from "./nutritionalTheories.ts";

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
    
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY_PERSONAL");
    if (!openaiApiKey) {
      console.error("OpenAI API key not found in environment variables");
      throw new Error("OpenAI API key not configured");
    }
    
    console.log("OpenAI API key found, attempting to use OpenAI API");

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });
    
    // Calculate base daily requirements
    const baseRequirements = calculateDailyRequirements(profile);
    if (!baseRequirements) {
      throw new Error("Unable to calculate daily requirements - missing profile data");
    }

    // Get nutritional theory guidance
    const nutritionalGuidance = getNutritionalTheoryGuidance(profile.nutritional_theory);
    
    // Create a summarized version of the recipes to send to OpenAI
    const recipeSummaries: RecipeSummary[] = recipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      ingredients: recipe.ingredients || [],
      categories: recipe.categories || [],
    }));
    
    // Format dietary preferences and restrictions
    const dietaryInfo = {
      fitness_goal: profile.fitness_goal || "maintain",
      nutritional_theory: profile.nutritional_theory || "balanced",
      allergies: profile.food_allergies || [],
      preferred_cuisines: profile.preferred_cuisines || [],
      foods_to_avoid: profile.foods_to_avoid || [],
      dietary_preferences: profile.dietary_preferences || [],
    };
    
    // Calculate dates for the meal plan and group runs by date
    const today = new Date(startDate);
    const endDateObj = new Date(endDate);
    const dayCount = Math.ceil((endDateObj.getTime() - today.getTime()) / (1000 * 3600 * 24)) + 1;
    
    // Group runs by date
    const runsByDate: Record<string, any[]> = {};
    runs.forEach(run => {
      const runDate = new Date(run.date).toISOString().split('T')[0];
      if (!runsByDate[runDate]) {
        runsByDate[runDate] = [];
      }
      runsByDate[runDate].push(run);
    });
    
    // Calculate day-specific requirements
    const dailyRequirements: Record<string, DailyRequirements> = {};
    for (let day = 0; day < dayCount; day++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + day);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const dayRuns = runsByDate[dateStr] || [];
      dailyRequirements[dateStr] = calculateDaySpecificRequirements(
        baseRequirements, 
        dayRuns, 
        profile.weight || 70
      );
    }
    
    console.log(`Creating meal plan for ${dayCount} days`);
    console.log(`User preferences: ${JSON.stringify(dietaryInfo)}`);
    console.log(`Base daily requirements: ${JSON.stringify(baseRequirements)}`);
    console.log(`Runs found: ${runs.length}`);
    
    // Create detailed daily breakdown for OpenAI
    const dailyBreakdown: DailyBreakdown[] = Object.entries(dailyRequirements).map(([date, reqs]) => {
      const dayRuns = runsByDate[date] || [];
      return {
        date,
        targetCalories: reqs.targetCalories,
        runCalories: reqs.runCalories || 0,
        hasRuns: dayRuns.length > 0,
        runs: dayRuns.map(run => ({
          title: run.title,
          distance: run.distance,
          duration: Math.round(run.duration / 60)
        })),
        meals: {
          breakfast: reqs.mealDistribution.breakfast,
          lunch: reqs.mealDistribution.lunch,
          dinner: reqs.mealDistribution.dinner
        }
      };
    });
    
    // Prepare the enhanced prompt for OpenAI
    const prompt = {
      role: "system",
      content: `You are a professional nutritionist creating a personalized meal plan for ${dayCount} days.

USER PROFILE & GOALS:
- Fitness Goal: ${profile.fitness_goal} weight
- Current Weight: ${profile.weight || 'unknown'}kg
- BMR: ${profile.bmr || 'unknown'} calories
- Activity Level: ${profile.activity_level || 'moderate'}

BASE DAILY CALORIC & MACRO TARGETS:
- Base Target Daily Calories: ${baseRequirements.targetCalories} calories
- Maintenance Calories: ${baseRequirements.maintenanceCalories} calories
- Daily Protein Target: ${baseRequirements.proteinGrams}g
- Daily Carbohydrate Target: ${baseRequirements.carbGrams}g  
- Daily Fat Target: ${baseRequirements.fatGrams}g

DAILY ACTIVITY & CALORIE ADJUSTMENTS:
${dailyBreakdown.map(day => `
Date ${day.date}:
- Target Calories: ${day.targetCalories} calories${day.runCalories > 0 ? ` (${baseRequirements.targetCalories} base + ${day.runCalories} run calories)` : ' (base calories)'}
- Breakfast: ~${day.meals.breakfast} calories
- Lunch: ~${day.meals.lunch} calories  
- Dinner: ~${day.meals.dinner} calories
${day.hasRuns ? `- Planned Runs: ${day.runs.map(run => `${run.title} (${run.distance}km, ${run.duration}min)`).join(', ')}` : '- No planned runs'}
`).join('')}

NUTRITIONAL APPROACH: ${nutritionalGuidance.focus}
Key Guidelines:
${nutritionalGuidance.guidelines.map(g => `- ${g}`).join('\n')}

DIETARY RESTRICTIONS & PREFERENCES:
- Food Allergies: ${dietaryInfo.allergies.join(', ') || 'None'}
- Foods to Avoid: ${dietaryInfo.foods_to_avoid.join(', ') || 'None'}
- Dietary Preferences: ${dietaryInfo.dietary_preferences.join(', ') || 'None'}
- Preferred Cuisines: ${dietaryInfo.preferred_cuisines.join(', ') || 'Any'}

Your task is to create a meal plan that:
1. Meets the specific caloric targets for each day and meal
2. On run days, adds strategic pre-run and post-run snacks for optimal performance and recovery
3. Follows the user's nutritional approach (${profile.nutritional_theory || 'balanced'})
4. Respects all dietary restrictions and preferences
5. Provides appropriate portion guidance to meet caloric goals
6. Ensures variety and nutritional balance across the week

MEAL PLANNING RULES:

**REGULAR DAYS (No Runs):**
- THREE main meals only: breakfast, lunch, dinner
- No snacks needed

**RUN DAYS (Planned Runs):**
- THREE main meals: breakfast, lunch, dinner (normal portions)
- PRE-RUN SNACK: Select a recipe from the database that is:
  - 100-200 calories
  - High in easily digestible carbohydrates (>20g carbs)
  - Low in fiber and fat to avoid digestive issues
  - Simple preparation/minimal ingredients
  - Examples from recipes: smoothies, fruit-based dishes, yogurt parfaits, oatmeal variations
- POST-RUN SNACK: Select a recipe from the database that is:
  - 150-250 calories
  - Contains both protein (>10g) and carbs (>15g) for recovery
  - Can include healthy fats
  - Examples from recipes: protein smoothies, Greek yogurt dishes, nuts/seeds combinations, recovery bowls

**SNACK SELECTION STRATEGY:**
You MUST analyze the provided recipes and intelligently select the most appropriate ones for snacks based on:
- Caloric content matching the target ranges
- Macronutrient profile (carbs for pre-run, protein+carbs for post-run)
- Ingredient complexity (simpler is better for snacks)
- Digestibility (avoid high-fiber/high-fat for pre-run)
- Preparation time and convenience

**CRITICAL INSTRUCTION:** Always use actual recipe IDs from the provided recipe list for ALL meals and snacks. Do NOT use "simple-snack" or generic placeholders. If no suitable snack recipe exists in the database, select the closest appropriate recipe and explain the timing/portion adjustment needed.

IMPORTANT: Each meal_type MUST be one of these exact values: "breakfast", "lunch", "dinner", "pre_run_snack", or "post_run_snack".

The response should be a JSON object following this exact structure:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "meals": [
        {
          "meal_type": "breakfast", // MUST be "breakfast", "lunch", "dinner", "pre_run_snack", or "post_run_snack"
          "recipe_id": "actual-recipe-id-from-database", 
          "explanation": "Why this recipe fits the nutritional approach, timing, and activity level for this day. For snacks, include specific guidance on timing (e.g., '30 minutes before run') and any portion adjustments needed."
        }
      ]
    }
  ]
}

NEVER use "simple-snack" as a recipe_id. Always select actual recipes from the provided database that best match the snack requirements.`
    };

    console.log(`Making request to OpenAI API with model: gpt-4o`);
    console.log(`Recipes count: ${recipeSummaries.length}`);
    
    // Make the request to OpenAI
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", 
        messages: [
          prompt,
          {
            role: "user", 
            content: `Create a meal plan from ${startDate} to ${endDate}. Here are the available recipes: ${JSON.stringify(recipeSummaries)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });
      
      console.log("OpenAI API response received successfully!");
      
      // Parse the AI-generated meal plan
      const aiResponse = response.choices[0].message.content;
      if (!aiResponse) {
        console.error("OpenAI returned empty response");
        throw new Error("Failed to generate meal plan from OpenAI");
      }
      
      try {
        const mealPlanData = JSON.parse(aiResponse);
        console.log("AI meal plan successfully generated and parsed");
        return {
          message: "AI-generated meal plan created successfully",
          mealPlan: mealPlanData
        };
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError);
        console.log("Raw response:", aiResponse);
        throw new Error("Failed to parse meal plan data");
      }
    } catch (apiError) {
      console.error("OpenAI API error details:", JSON.stringify(apiError, null, 2));
      if (apiError.status === 401) {
        throw new Error("OpenAI API authentication failed. Please check your API key.");
      } else if (apiError.status === 429) {
        throw new Error("OpenAI API rate limit exceeded or insufficient quota.");
      } else {
        throw new Error(`OpenAI API error: ${apiError.message || "Unknown error"}`);
      }
    }
  } catch (error) {
    console.error("Error generating AI meal plan:", error);
    throw error;
  }
}
