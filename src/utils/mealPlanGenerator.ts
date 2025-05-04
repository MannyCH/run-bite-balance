import { supabase } from '@/integrations/supabase/client';
import { UserProfile, MealPlan, MealPlanItem } from '@/types/profile';
import { Recipe } from '@/context/types';

interface GenerateMealPlanParams {
  userId: string;
  profile: UserProfile;
  recipes: Recipe[];
  startDate: string;
  endDate: string;
}

interface MealPlanResult {
  mealPlan: MealPlan;
  mealPlanItems: MealPlanItem[];
}

// Function to generate a meal plan based on user profile and available recipes
export async function generateMealPlan({
  userId,
  profile,
  recipes,
  startDate,
  endDate
}: GenerateMealPlanParams): Promise<MealPlanResult | null> {
  try {
    // Check if we have the necessary data
    if (!userId || !profile || recipes.length === 0) {
      console.error('Missing required data for meal plan generation');
      return null;
    }

    // First, create or update a meal plan record
    const { data: mealPlan, error: mealPlanError } = await supabase
      .from('meal_plans')
      .upsert({
        user_id: userId,
        week_start_date: startDate,
        week_end_date: endDate,
        status: 'active' as const, // Explicitly type as 'active'
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id, week_start_date',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (mealPlanError) {
      console.error('Error creating meal plan:', mealPlanError);
      return null;
    }

    // Delete any existing meal plan items for this plan
    const { error: deleteError } = await supabase
      .from('meal_plan_items')
      .delete()
      .eq('meal_plan_id', mealPlan.id);

    if (deleteError) {
      console.error('Error deleting existing meal plan items:', deleteError);
      return null;
    }

    // Here we would normally call an AI service to generate a personalized plan
    // For now, we'll simulate this with a simpler algorithm based on available recipes
    const mealPlanItems = generateMealPlanItems(mealPlan.id, profile, recipes, startDate, endDate);

    // Insert the meal plan items - make sure each item has required fields
    const completeItems = mealPlanItems.map(item => ({
      ...item,
      date: item.date, // Ensure date is always present
      meal_plan_id: item.meal_plan_id, // Ensure meal_plan_id is always present
      meal_type: item.meal_type, // Ensure meal_type is always present
    }));

    const { data: savedItems, error: itemsError } = await supabase
      .from('meal_plan_items')
      .insert(completeItems)
      .select();

    if (itemsError) {
      console.error('Error saving meal plan items:', itemsError);
      return null;
    }

    // Convert the returned data to the expected types
    const typedMealPlan: MealPlan = {
      id: mealPlan.id,
      user_id: mealPlan.user_id,
      week_start_date: mealPlan.week_start_date,
      week_end_date: mealPlan.week_end_date,
      created_at: mealPlan.created_at,
      status: mealPlan.status as 'draft' | 'active',
    };

    return {
      mealPlan: typedMealPlan,
      mealPlanItems: savedItems as MealPlanItem[]
    };
  } catch (error) {
    console.error('Error in generateMealPlan:', error);
    return null;
  }
}

// Add a new simplified function that returns a meal plan based on user's profile data
export async function generateMealPlanForUser(
  userId: string
): Promise<MealPlanResult | null> {
  try {
    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    // Get all available recipes
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select('*');

    if (recipesError) {
      console.error('Error fetching recipes:', recipesError);
      return null;
    }

    // Calculate dates for the meal plan (1 week from today)
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 6); // 7 days total including today
    const endDateStr = endDate.toISOString().split('T')[0];

    // Generate the meal plan using the existing function
    return generateMealPlan({
      userId,
      profile: profile as UserProfile,
      recipes: recipes || [],
      startDate,
      endDate: endDateStr
    });
  } catch (error) {
    console.error('Error generating meal plan:', error);
    return null;
  }
}

// Helper function to generate meal plan items based on user profile and available recipes
function generateMealPlanItems(
  mealPlanId: string,
  profile: UserProfile,
  recipes: Recipe[],
  startDate: string,
  endDate: string
): Partial<MealPlanItem>[] {
  const mealPlanItems: Partial<MealPlanItem>[] = [];
  
  // Calculate how many days we need to plan for
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

  // Filter recipes based on user preferences
  let filteredRecipes = [...recipes];
  
  // Filter out recipes with allergies
  if (profile.food_allergies && profile.food_allergies.length > 0) {
    filteredRecipes = filteredRecipes.filter(recipe => {
      // If recipe has no ingredients, we can't check for allergies
      if (!recipe.ingredients) return true;
      
      // Check if any ingredient contains an allergen
      return !profile.food_allergies!.some(allergen => 
        recipe.ingredients!.some(ingredient => 
          ingredient.toLowerCase().includes(allergen.toLowerCase())
        )
      );
    });
  }
  
  // Filter out foods to avoid
  if (profile.foods_to_avoid && profile.foods_to_avoid.length > 0) {
    filteredRecipes = filteredRecipes.filter(recipe => {
      // If recipe has no ingredients, we can't check for foods to avoid
      if (!recipe.ingredients) return true;
      
      // Check if any ingredient contains a food to avoid
      return !profile.foods_to_avoid!.some(food => 
        recipe.ingredients!.some(ingredient => 
          ingredient.toLowerCase().includes(food.toLowerCase())
        )
      );
    });
  }

  // Prioritize preferred cuisines if available
  let prioritizedRecipes = [...filteredRecipes];
  if (profile.preferred_cuisines && profile.preferred_cuisines.length > 0) {
    const preferredRecipes = filteredRecipes.filter(recipe => 
      recipe.categories && profile.preferred_cuisines!.some(cuisine => 
        recipe.categories!.some(category => 
          category.toLowerCase().includes(cuisine.toLowerCase())
        )
      )
    );
    
    // If we have preferred recipes, they go first, followed by the others
    if (preferredRecipes.length > 0) {
      prioritizedRecipes = [...preferredRecipes, ...filteredRecipes.filter(r => !preferredRecipes.includes(r))];
    }
  }

  // Function to get a random recipe that fits calorie and macros criteria
  const getRandomRecipe = (
    targetCalories: number,
    targetProtein: number,
    previousMeals: string[] = []
  ): Recipe | null => {
    // Clone and shuffle the recipes array
    const shuffled = [...prioritizedRecipes]
      .filter(r => !previousMeals.includes(r.id))
      .sort(() => 0.5 - Math.random());
    
    // Find a recipe that fits our criteria
    const recipe = shuffled.find(r => {
      // Allow some flexibility in calorie count (±20%)
      const minCalories = targetCalories * 0.8;
      const maxCalories = targetCalories * 1.2;
      
      return (
        r.calories >= minCalories && 
        r.calories <= maxCalories && 
        r.protein >= targetProtein * 0.7
      );
    });
    
    return recipe || (shuffled.length > 0 ? shuffled[0] : null);
  };

  // Calculate daily requirements based on user profile
  const calculateDailyRequirements = () => {
    if (!profile.bmr) return null;

    // Activity level multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const multiplier = profile.activity_level ? 
      activityMultipliers[profile.activity_level as keyof typeof activityMultipliers] : 
      1.5; // Default to moderate

    // Calculate daily calories
    let dailyCalories = profile.bmr * multiplier;
    
    // Adjust based on fitness goal
    if (profile.fitness_goal === 'lose') {
      dailyCalories *= 0.85; // 15% deficit for weight loss
    } else if (profile.fitness_goal === 'gain') {
      dailyCalories *= 1.1; // 10% surplus for weight gain
    }

    // Calculate macronutrient targets
    let proteinPct, fatPct, carbsPct;
    
    if (profile.fitness_goal === 'lose') {
      proteinPct = 0.35; // Higher protein for weight loss
      fatPct = 0.35;
      carbsPct = 0.3;
    } else if (profile.fitness_goal === 'gain') {
      proteinPct = 0.25;
      fatPct = 0.3;
      carbsPct = 0.45; // Higher carbs for weight gain
    } else {
      proteinPct = 0.3;
      fatPct = 0.3;
      carbsPct = 0.4;
    }

    // Calculate grams (protein & carbs = 4 cal/g, fat = 9 cal/g)
    const proteinGrams = (dailyCalories * proteinPct) / 4;
    const carbsGrams = (dailyCalories * carbsPct) / 4;
    const fatGrams = (dailyCalories * fatPct) / 9;

    // Distribute calories throughout the day
    const breakfastCal = dailyCalories * 0.25;
    const lunchCal = dailyCalories * 0.35;
    const dinnerCal = dailyCalories * 0.3;
    const snackCal = dailyCalories * 0.1;
    
    // Distribute protein throughout the day
    const breakfastProtein = proteinGrams * 0.25;
    const lunchProtein = proteinGrams * 0.35;
    const dinnerProtein = proteinGrams * 0.3;
    const snackProtein = proteinGrams * 0.1;

    return {
      dailyCalories,
      proteinGrams,
      carbsGrams,
      fatGrams,
      meals: {
        breakfast: { calories: breakfastCal, protein: breakfastProtein },
        lunch: { calories: lunchCal, protein: lunchProtein },
        dinner: { calories: dinnerCal, protein: dinnerProtein },
        snack: { calories: snackCal, protein: snackProtein }
      }
    };
  };

  const requirements = calculateDailyRequirements();
  if (!requirements) {
    // Use generic values if we can't calculate from profile
    const genericRequirements = {
      dailyCalories: 2000,
      meals: {
        breakfast: { calories: 500, protein: 25 },
        lunch: { calories: 700, protein: 35 },
        dinner: { calories: 600, protein: 30 },
        snack: { calories: 200, protein: 10 }
      }
    };
    
    // Generate generic meal plan
    for (let day = 0; day < dayCount; day++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + day);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const usedRecipeIds: string[] = [];
      
      // Add breakfast
      const breakfast = getRandomRecipe(genericRequirements.meals.breakfast.calories, genericRequirements.meals.breakfast.protein);
      if (breakfast) {
        usedRecipeIds.push(breakfast.id);
        mealPlanItems.push({
          id: crypto.randomUUID(), // Generate a temporary id
          meal_plan_id: mealPlanId,
          recipe_id: breakfast.id,
          date: dateStr,
          meal_type: 'breakfast',
          nutritional_context: "A balanced breakfast to start your day",
          calories: breakfast.calories,
          protein: breakfast.protein,
          carbs: breakfast.carbs,
          fat: breakfast.fat
        });
      }
      
      // Add lunch
      const lunch = getRandomRecipe(genericRequirements.meals.lunch.calories, genericRequirements.meals.lunch.protein, usedRecipeIds);
      if (lunch) {
        usedRecipeIds.push(lunch.id);
        mealPlanItems.push({
          id: crypto.randomUUID(), // Generate a temporary id
          meal_plan_id: mealPlanId,
          recipe_id: lunch.id,
          date: dateStr,
          meal_type: 'lunch',
          nutritional_context: "A satisfying lunch with good protein content",
          calories: lunch.calories,
          protein: lunch.protein,
          carbs: lunch.carbs,
          fat: lunch.fat
        });
      }
      
      // Add dinner
      const dinner = getRandomRecipe(genericRequirements.meals.dinner.calories, genericRequirements.meals.dinner.protein, usedRecipeIds);
      if (dinner) {
        usedRecipeIds.push(dinner.id);
        mealPlanItems.push({
          id: crypto.randomUUID(), // Generate a temporary id
          meal_plan_id: mealPlanId,
          recipe_id: dinner.id,
          date: dateStr,
          meal_type: 'dinner',
          nutritional_context: "A nutritious dinner to end your day",
          calories: dinner.calories,
          protein: dinner.protein,
          carbs: dinner.carbs,
          fat: dinner.fat
        });
      }
      
      // Add snack
      const snack = getRandomRecipe(genericRequirements.meals.snack.calories, genericRequirements.meals.snack.protein, usedRecipeIds);
      if (snack && Math.random() > 0.3) { // 70% chance of having a snack
        mealPlanItems.push({
          id: crypto.randomUUID(), // Generate a temporary id
          meal_plan_id: mealPlanId,
          recipe_id: snack.id,
          date: dateStr,
          meal_type: 'snack',
          nutritional_context: "A light snack to keep you going",
          calories: snack.calories,
          protein: snack.protein,
          carbs: snack.carbs,
          fat: snack.fat
        });
      }
    }
    
    return mealPlanItems;
  }

  // Generate personalized meal plan based on calculated requirements
  for (let day = 0; day < dayCount; day++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const usedRecipeIds: string[] = [];
    
    // Add breakfast
    const breakfast = getRandomRecipe(requirements.meals.breakfast.calories, requirements.meals.breakfast.protein);
    if (breakfast) {
      usedRecipeIds.push(breakfast.id);
      mealPlanItems.push({
        id: crypto.randomUUID(), // Add required id field
        meal_plan_id: mealPlanId,
        recipe_id: breakfast.id,
        date: dateStr,
        meal_type: 'breakfast',
        nutritional_context: getContextForMeal('breakfast', breakfast, profile),
        calories: breakfast.calories,
        protein: breakfast.protein,
        carbs: breakfast.carbs,
        fat: breakfast.fat
      });
    }
    
    // Add lunch
    const lunch = getRandomRecipe(requirements.meals.lunch.calories, requirements.meals.lunch.protein, usedRecipeIds);
    if (lunch) {
      usedRecipeIds.push(lunch.id);
      mealPlanItems.push({
        id: crypto.randomUUID(), // Add required id field
        meal_plan_id: mealPlanId,
        recipe_id: lunch.id,
        date: dateStr,
        meal_type: 'lunch',
        nutritional_context: getContextForMeal('lunch', lunch, profile),
        calories: lunch.calories,
        protein: lunch.protein,
        carbs: lunch.carbs,
        fat: lunch.fat
      });
    }
    
    // Add dinner
    const dinner = getRandomRecipe(requirements.meals.dinner.calories, requirements.meals.dinner.protein, usedRecipeIds);
    if (dinner) {
      usedRecipeIds.push(dinner.id);
      mealPlanItems.push({
        id: crypto.randomUUID(), // Add required id field
        meal_plan_id: mealPlanId,
        recipe_id: dinner.id,
        date: dateStr,
        meal_type: 'dinner',
        nutritional_context: getContextForMeal('dinner', dinner, profile),
        calories: dinner.calories,
        protein: dinner.protein,
        carbs: dinner.carbs,
        fat: dinner.fat
      });
    }
    
    // Add snack (only some days)
    if (Math.random() > 0.3) { // 70% chance of having a snack
      const snack = getRandomRecipe(requirements.meals.snack.calories, requirements.meals.snack.protein, usedRecipeIds);
      if (snack) {
        mealPlanItems.push({
          id: crypto.randomUUID(), // Add required id field
          meal_plan_id: mealPlanId,
          recipe_id: snack.id,
          date: dateStr,
          meal_type: 'snack',
          nutritional_context: getContextForMeal('snack', snack, profile),
          calories: snack.calories,
          protein: snack.protein,
          carbs: snack.carbs,
          fat: snack.fat
        });
      }
    }
  }
  
  return mealPlanItems;
}

// Helper function to generate context/explanation for meal choices
function getContextForMeal(
  mealType: string, 
  recipe: Recipe, 
  profile: UserProfile
): string {
  // Default explanations
  const defaultContexts = {
    breakfast: "A nutritious breakfast to start your day",
    lunch: "A balanced lunch with good macronutrient distribution",
    dinner: "A satisfying dinner with plenty of nutrients",
    snack: "A light snack to maintain energy levels"
  };
  
  if (!profile.fitness_goal) {
    return defaultContexts[mealType as keyof typeof defaultContexts];
  }
  
  // More personalized explanations based on user goals
  let explanations: { [key: string]: string[] } = {
    lose: [
      `Lower calorie option to support your weight loss goal`,
      `Good protein-to-calorie ratio to help preserve muscle while losing weight`,
      `Nutrient-dense meal with fiber to help you feel full longer`,
      `Balanced macros to support your weight loss journey`
    ],
    maintain: [
      `Well-balanced meal to maintain your current weight`,
      `Good mix of nutrients to support your health goals`,
      `Provides sustained energy throughout the day`,
      `Balanced protein, carbs and fats for your maintenance goal`
    ],
    gain: [
      `Calorie-dense option to support your weight gain goal`,
      `Good source of protein to support muscle building`,
      `Higher carbohydrate content to fuel workouts and recovery`,
      `Nutrient-rich meal to support your growth goals`
    ]
  };
  
  // Choose a random explanation based on the user's goal
  const goalExplanations = explanations[profile.fitness_goal];
  const randomExplanation = goalExplanations[Math.floor(Math.random() * goalExplanations.length)];
  
  // Add recipe-specific context if available
  let recipeContext = "";
  if (recipe.protein > 25) {
    recipeContext = " High in protein.";
  } else if (recipe.carbs > 50) {
    recipeContext = " Good source of energy from carbs.";
  } else if (recipe.fat > 20) {
    recipeContext = " Contains healthy fats.";
  }
  
  return randomExplanation + recipeContext;
}
