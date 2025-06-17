
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateAIMealPlan } from "./openaiClient.ts";
import { corsHeaders, handleCorsPreflightRequest, createCorsResponse } from "./corsHandler.ts";
import { validateRequestBody } from "./requestValidator.ts";
import { createSupabaseClient, fetchUserProfile, fetchRecipes } from "./supabaseClient.ts";
import { prepareRecipeData, validateRecipeData } from "./dataPreparation.ts";

// Define UserProfile interface directly in edge function context
interface UserProfile {
  id: string;
  username?: string | null;
  weight?: number | null;
  target_weight?: number | null;
  height?: number | null;
  age?: number | null;
  gender?: 'male' | 'female' | 'other' | null;
  fitness_goal?: 'lose' | 'maintain' | 'gain' | null;
  activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  bmr?: number | null;
  dietary_preferences?: string[] | null;
  nutritional_theory?: string | null;
  food_allergies?: string[] | null;
  preferred_cuisines?: string[] | null;
  foods_to_avoid?: string[] | null;
  meal_complexity?: 'simple' | 'moderate' | 'complex' | null;
  ical_feed_url?: string | null;
  avatar_url?: string | null;
  batch_cooking_repetitions?: number | null;
  batch_cooking_people?: number | null;
}

serve(async (req) => {
  console.log('🚀 Generate meal plan function started');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling CORS preflight request');
    return handleCorsPreflightRequest();
  }
  
  try {
    console.log('📋 Processing meal plan request...');
    
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createCorsResponse(JSON.stringify({ error: 'No authorization header' }), 401);
    }
    
    // Get and validate the request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('📝 Request body received:', JSON.stringify(requestBody, null, 2));
    } catch (e) {
      console.error("Error parsing request body:", e);
      return createCorsResponse(JSON.stringify({ 
        error: 'Invalid JSON in request body' 
      }), 400);
    }
    
    const validation = validateRequestBody(requestBody);
    if (!validation.isValid) {
      return createCorsResponse(JSON.stringify({ 
        error: validation.error 
      }), 400);
    }
    
    const { userId, startDate, endDate, runs } = validation.data!;
    console.log(`✅ Processing meal plan request for user ${userId} from ${startDate} to ${endDate}`);
    console.log(`🏃 Received ${runs ? runs.length : 0} runs in request:`, runs);
    
    // Log each run in detail
    if (runs && runs.length > 0) {
      runs.forEach((run, index) => {
        console.log(`🏃‍♂️ Run ${index + 1}:`, {
          title: run.title,
          date: run.date,
          distance: run.distance,
          duration: run.duration,
          isPlanned: run.isPlanned,
          isImported: run.isImported
        });
      });
    } else {
      console.log('⚠️ No runs provided in request body');
    }
    
    // Create Supabase client
    const supabase = createSupabaseClient(authHeader);
    console.log('✅ Supabase client created');
    
    // Get user profile
    console.log('👤 Fetching user profile...');
    let profile;
    try {
      profile = await fetchUserProfile(supabase, userId);
      console.log('✅ User profile fetched successfully');
      console.log(`👤 Profile batch cooking: ${profile.batch_cooking_repetitions}x repetitions for ${profile.batch_cooking_people || 1} people`);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return createCorsResponse(JSON.stringify({ 
        error: error.message
      }), error.message.includes('not found') ? 404 : 500);
    }
    
    // Get available recipes with proper meal type handling
    console.log('🍽️ Fetching recipes...');
    let rawRecipes;
    try {
      rawRecipes = await fetchRecipes(supabase);
      console.log(`✅ Fetched ${rawRecipes.length} raw recipes for meal planning`);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return createCorsResponse(JSON.stringify({ 
        error: error.message
      }), error.message.includes('not found') ? 404 : 500);
    }
    
    // Prepare and validate recipe data
    console.log('🔄 Preparing recipe data...');
    const recipes = prepareRecipeData(rawRecipes);
    console.log('✅ Prepared', recipes.length, 'recipes');
    
    console.log('🔍 Validating', recipes.length, 'recipes...');
    const isValidData = validateRecipeData(recipes);
    
    if (!isValidData) {
      console.warn('Recipe data validation failed, but continuing with meal plan generation...');
    } else {
      console.log('✅ Recipe data validation passed');
    }
    
    // Generate meal plan (with improved fallback system)
    console.log('🤖 Generating meal plan with AI and fallback system...');
    console.log(`🏃 Passing ${runs ? runs.length : 0} runs to meal planner`);
    try {
      const result = await generateAIMealPlan(
        userId, 
        profile as UserProfile, 
        recipes,
        runs || [],
        startDate,
        endDate
      );
      
      console.log("✅ Meal plan generated successfully");
      console.log("📊 Result overview:", {
        hasMealPlan: !!result?.mealPlan,
        messageLength: result?.message?.length || 0,
        totalDays: result?.mealPlan?.days?.length || 0,
        isFallback: !!result?.fallback
      });
      
      return createCorsResponse(JSON.stringify(result));
    } catch (planError) {
      console.error("❌ Meal plan generation failed completely:", planError);
      
      // Last resort: return meaningful error
      return createCorsResponse(JSON.stringify({ 
        error: 'Meal plan generation failed. Please check your recipes have meal type classifications and try again.',
        details: planError.message
      }), 500);
    }
  } catch (error) {
    console.error('Error in generate-meal-plan function:', error);
    return createCorsResponse(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), 500);
  }
});
