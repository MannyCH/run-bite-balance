
// CORS handling utilities
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function handleCorsPreflightRequest(): Response {
  return new Response(null, { headers: corsHeaders });
}

export function createCorsResponse(body: string, status: number = 200): Response {
  return new Response(body, {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
