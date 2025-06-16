
// Prompt building utilities for OpenAI meal plan generation
import type { UserProfile } from "../../../src/types/profile.ts";
import type { DailyRequirements, DailyBreakdown, RecipeSummary } from "./types.ts";
import { getNutritionalTheoryGuidance } from "./nutritionalTheories.ts";

/**
 * Build the detailed system prompt for OpenAI meal planning
 */
export function buildSystemPrompt(
  profile: UserProfile,
  baseRequirements: DailyRequirements,
  dailyBreakdown: DailyBreakdown[],
  dayCount: number
): string {
  const nutritionalGuidance = getNutritionalTheoryGuidance(profile.nutritional_theory);
  
  // Format dietary preferences and restrictions
  const dietaryInfo = {
    fitness_goal: profile.fitness_goal || "maintain",
    nutritional_theory: profile.nutritional_theory || "balanced",
    allergies: profile.food_allergies || [],
    preferred_cuisines: profile.preferred_cuisines || [],
    foods_to_avoid: profile.foods_to_avoid || [],
    dietary_preferences: profile.dietary_preferences || [],
  };

  return `You are a professional nutritionist creating a personalized meal plan for ${dayCount} days.

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
${day.hasRuns ? `
- Breakfast: ~${day.meals.breakfast} calories
- Pre-run snack: ~${day.meals.pre_run_snack} calories (before lunchtime run)
- Lunch: ~${day.meals.lunch} calories (POST-RUN RECOVERY MEAL - high protein + carbs)
- Dinner: ~${day.meals.dinner} calories
- Planned Runs: ${day.runs.map(run => `${run.title} (${run.distance}km, ${run.duration}min)`).join(', ')}` : `
- Breakfast: ~${day.meals.breakfast} calories
- Lunch: ~${day.meals.lunch} calories
- Dinner: ~${day.meals.dinner} calories
- No planned runs (REST DAY)`}
`).join('')}

NUTRITIONAL APPROACH: ${nutritionalGuidance.focus}
Key Guidelines:
${nutritionalGuidance.guidelines.map(g => `- ${g}`).join('\n')}

DIETARY RESTRICTIONS & PREFERENCES:
- Food Allergies: ${dietaryInfo.allergies.join(', ') || 'None'}
- Foods to Avoid: ${dietaryInfo.foods_to_avoid.join(', ') || 'None'}
- Dietary Preferences: ${dietaryInfo.dietary_preferences.join(', ') || 'None'}
- Preferred Cuisines: ${dietaryInfo.preferred_cuisines.join(', ') || 'Any'}

IMPORTANT MEAL PLANNING RULES:

**REST DAYS (No Runs):**
- Generate exactly THREE meals: breakfast, lunch, dinner
- Standard nutritional distribution
- No snacks needed

**RUN DAYS (Planned Runs - User runs during lunchtime):**
- Generate exactly FOUR meals: breakfast, pre_run_snack, lunch, dinner
- **PRE-RUN SNACK**: Select a recipe that is:
  - 100-200 calories (light fuel before run)
  - High in easily digestible carbohydrates (>15g carbs)
  - Low in fiber and fat to avoid digestive issues
  - Simple preparation/minimal ingredients
- **LUNCH (POST-RUN RECOVERY)**: This is the main recovery meal, select a recipe that is:
  - Higher calories (matching lunch target ~40% of daily calories)
  - Rich in protein (>25g) and carbohydrates (>30g) for recovery
  - Can include healthy fats
  - Focus on recovery and refueling after the lunchtime run
- **BREAKFAST & DINNER**: Normal meals as usual

**CRITICAL INSTRUCTION:** Always use actual recipe IDs from the provided recipe list for ALL meals. Do NOT use generic placeholders. If no suitable recipe exists, select the closest appropriate recipe and explain portion adjustments.

**MEAL TYPE VALUES:** Each meal_type MUST be exactly: "breakfast", "lunch", "dinner", or "pre_run_snack".

**LUNCH ON RUN DAYS:** Remember that lunch on run days serves as the post-run recovery meal and should be nutritionally dense with adequate protein and carbs.

The response should be a JSON object following this exact structure:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "meals": [
        {
          "meal_type": "breakfast", // MUST be "breakfast", "lunch", "dinner", or "pre_run_snack"
          "recipe_id": "actual-recipe-id-from-database", 
          "explanation": "Why this recipe fits the nutritional approach, timing, and activity level for this day. For lunch on run days, emphasize recovery nutrition. For pre-run snacks, focus on quick energy."
        }
      ]
    }
  ]
}

NEVER use "simple-snack" as a recipe_id. Always select actual recipes from the provided database.`;
}
