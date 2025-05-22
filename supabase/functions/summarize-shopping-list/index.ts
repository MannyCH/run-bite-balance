
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!openAIApiKey) {
    return new Response(
      JSON.stringify({ error: 'OpenAI API key not found' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { items } = await req.json();

    // Format our request to OpenAI
    const prompt = `
      Please analyze and clean up this shopping list:
      ${JSON.stringify(items, null, 2)}
      
      Do the following:
      1. Remove preparation instructions and irrelevant words (like "chopped", "sliced", "organic", etc.)
      2. Consolidate similar ingredients (e.g., different types of olive oil should become just "Olive oil")
      3. Group basic ingredients like salt, pepper, oils into single items
      4. Summarize quantities when possible
      5. Format for easy reading
      
      Return the result as a JSON array with the same structure as the input (id, name, quantity, isBought).
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful shopping list organizer. Clean up and summarize shopping lists.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error('Failed to process shopping list with OpenAI');
    }
    
    let processedItems;
    try {
      // Extract the JSON from the response
      const content = data.choices[0].message.content;
      // Find JSON content (assuming it's properly formatted in the response)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        processedItems = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not extract JSON from OpenAI response');
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw new Error('Failed to parse OpenAI response');
    }

    return new Response(
      JSON.stringify({ items: processedItems }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in summarize-shopping-list function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
