
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ClassificationResult {
  message: string;
  totalRecipes: number;
  successful: number;
  errors: number;
  details?: Array<{ success: boolean; recipeId: string; error?: string }>;
}

export const RecipeSeasonalClassifier: React.FC = () => {
  const [isClassifying, setIsClassifying] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClassifyRecipes = async () => {
    setIsClassifying(true);
    setError(null);
    setResult(null);

    try {
      console.log('Starting recipe seasonal classification...');
      
      const { data, error: functionError } = await supabase.functions.invoke('classify-recipes-seasonally', {
        body: {}
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to classify recipes');
      }

      setResult(data);
      toast.success(`Classification completed! ${data.successful} recipes updated successfully.`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast.error('Classification failed: ' + errorMessage);
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Recipe Seasonal Classification
        </CardTitle>
        <CardDescription>
          Use AI to analyze and classify all recipes by their seasonal suitability, temperature preference, and dish type.
          This will improve meal plan recommendations based on weather and seasons.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleClassifyRecipes} 
          disabled={isClassifying}
          className="w-full"
        >
          {isClassifying ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Classifying Recipes...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Classify All Recipes
            </>
          )}
        </Button>

        {isClassifying && (
          <Alert>
            <Loader className="h-4 w-4 animate-spin" />
            <AlertDescription>
              This process analyzes each recipe using AI to determine its seasonal appropriateness.
              Please wait, this may take a few minutes...
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-1">
                <div className="font-medium">Classification Complete!</div>
                <div>Total recipes processed: {result.totalRecipes}</div>
                <div>Successfully updated: {result.successful}</div>
                {result.errors > 0 && (
                  <div className="text-orange-700">Errors: {result.errors}</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="font-medium">Classification Failed</div>
              <div>{error}</div>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-muted-foreground">
          <div className="font-medium mb-2">What this does:</div>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Seasonal Suitability:</strong> Determines which seasons each recipe fits (spring, summer, autumn, winter, year_round)</li>
            <li>• <strong>Temperature Preference:</strong> Classifies dishes for hot_weather, cold_weather, mild_weather, or any</li>
            <li>• <strong>Dish Type:</strong> Identifies thermal effect: warming (soups, stews), cooling (salads, cold dishes), or neutral</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
