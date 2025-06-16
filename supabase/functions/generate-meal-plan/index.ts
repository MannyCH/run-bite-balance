
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import type { UserProfile } from "../../../src/types/profile.ts";
import { generateAIMealPlan } from "./openaiClient.ts";
import { corsHeaders, handleCorsPreflightRequest, createCorsResponse } from "./corsHandler.ts";
import { validateRequestBody } from "./requestValidator.ts";
import { createSupabaseClient, fetchUserProfile, fetchRecipes } from "./supabaseClient.ts";
import { prepareRecipeData, validateRecipeData } from "./dataPreparation.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest();
  }
  
  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createCorsResponse(JSON.stringify({ error: 'No authorization header' }), 401);
    }
    
    // Get and validate the request body
    let requestBody;
    try {
      requestBody = await req.json();
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
    console.log(`Processing meal plan request for user ${userId} from ${startDate} to ${endDate}`);
    
    // Create Supabase client
    const supabase = createSupabaseClient(authHeader);
    
    // Get user profile
    let profile;
    try {
      profile = await fetchUserProfile(supabase, userId);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return createCorsResponse(JSON.stringify({ 
        error: error.message
      }), error.message.includes('not found') ? 404 : 500);
    }
    
    // Get available recipes with proper meal type handling
    let rawRecipes;
    try {
      rawRecipes = await fetchRecipes(supabase);
      console.log(`Fetched ${rawRecipes.length} raw recipes for meal planning`);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return createCorsResponse(JSON.stringify({ 
        error: error.message
      }), error.message.includes('not found') ? 404 : 500);
    }
    
    // Prepare and validate recipe data
    const recipes = prepareRecipeData(rawRecipes);
    const isValidData = validateRecipeData(recipes);
    
    if (!isValidData) {
      console.warn('Recipe data validation failed, but continuing with meal plan generation...');
    }
    
    console.log(`Received ${runs.length} planned runs from frontend`);
    
    // Generate AI meal plan with properly formatted recipe data
    try {
      const result = await generateAIMealPlan(
        userId, 
        profile as unknown as UserProfile, 
        recipes,
        runs,
        startDate,
        endDate
      );
      
      console.log("Meal plan generated successfully");
      
      return createCorsResponse(JSON.stringify(result));
    } catch (aiError) {
      console.error("AI meal plan generation failed:", aiError);
      console.log("Falling back to algorithmic meal planning...");
      
      // Return a specific error that the frontend can handle
      return createCorsResponse(JSON.stringify({ 
        error: aiError.message || 'Error generating AI meal plan',
        fallback: true 
      }));
    }
  } catch (error) {
    console.error('Error in generate-meal-plan function:', error);
    return createCorsResponse(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), 500);
  }
});
