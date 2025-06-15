
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { runData, userId } = await req.json();
    console.log('Estimating calories for run:', runData);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get user profile data for more accurate estimation
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile } = await supabase
      .from('profiles')
      .select('weight, height, age, gender')
      .eq('id', userId)
      .single();

    // Prepare the prompt for OpenAI
    const userInfo = profile ? 
      `User profile: Weight: ${profile.weight || 'unknown'}kg, Height: ${profile.height || 'unknown'}cm, Age: ${profile.age || 'unknown'}, Gender: ${profile.gender || 'unknown'}` :
      'User profile: No specific data available';

    const prompt = `As a fitness expert, estimate the calories burned during this run and provide recommendations for calorie intake needed for recovery and energy replenishment.

Run Details:
- Title: ${runData.title}
- Distance: ${runData.distance} km
- Duration: ${Math.round(runData.duration / 60)} minutes
- Pace: ${runData.pace} minutes per km
- Type: Planned run

${userInfo}

Please provide:
1. Estimated calories burned during this run
2. Recommended additional calories needed for recovery and energy replenishment
3. Brief explanation of the calculation

Format your response as JSON:
{
  "caloriesBurned": number,
  "recommendedIntake": number,
  "explanation": "brief explanation"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a fitness and nutrition expert. Always respond with valid JSON in the specified format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response from OpenAI
    let calorieEstimate;
    try {
      calorieEstimate = JSON.parse(content);
    } catch (parseError) {
      // Fallback estimation if OpenAI doesn't return valid JSON
      const estimatedBurn = Math.round(runData.distance * 60); // Rough estimate: 60 cal/km
      calorieEstimate = {
        caloriesBurned: estimatedBurn,
        recommendedIntake: Math.round(estimatedBurn * 1.2),
        explanation: "Estimated based on distance (60 calories per km) with 20% recovery buffer"
      };
    }

    console.log('Calorie estimation completed:', calorieEstimate);

    return new Response(JSON.stringify(calorieEstimate), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in estimate-run-calories function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        caloriesBurned: 0,
        recommendedIntake: 0,
        explanation: "Could not estimate calories"
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
