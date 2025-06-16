
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader, RefreshCw, CheckCircle, AlertCircle, Thermometer, Calendar } from 'lucide-react';
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Thermometer className="h-5 w-5" />
          Seasonal Recipe Classification
        </CardTitle>
        <CardDescription>
          <div className="space-y-2">
            <p className="font-medium text-orange-600">
              ⚠️ Required for seasonal meal planning
            </p>
            <p>
              Use AI to analyze and classify all recipes by their seasonal suitability and temperature preference.
              This is essential for generating weather-appropriate meal plans that avoid winter dishes in summer.
            </p>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-200 bg-blue-50">
          <Calendar className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-1">
              <div className="font-medium">Why this is needed:</div>
              <div className="text-sm">
                Currently all recipes are marked as "year_round" which means winter soups and stews 
                show up in summer meal plans. After classification, recipes will be properly categorized 
                for seasonal appropriateness.
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <Button 
          onClick={handleClassifyRecipes} 
          disabled={isClassifying}
          className="w-full"
          size="lg"
        >
          {isClassifying ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Classifying Recipes...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Classify All Recipes with AI
            </>
          )}
        </Button>

        {isClassifying && (
          <Alert>
            <Loader className="h-4 w-4 animate-spin" />
            <AlertDescription>
              This process analyzes each recipe using OpenAI to determine its seasonal appropriateness.
              Please wait, this may take a few minutes...
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-1">
                <div className="font-medium">🎉 Classification Complete!</div>
                <div>Total recipes processed: <strong>{result.totalRecipes}</strong></div>
                <div>Successfully updated: <strong>{result.successful}</strong></div>
                {result.errors > 0 && (
                  <div className="text-orange-700">Errors: {result.errors}</div>
                )}
                <div className="mt-2 text-sm">
                  ✅ Your recipes are now ready for seasonal meal planning!
                </div>
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

        <div className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-md">
          <div className="font-medium mb-2">What this classification does:</div>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Seasonal Suitability:</strong> spring, summer, autumn, winter, or year_round</li>
            <li>• <strong>Temperature Preference:</strong> hot_weather, cold_weather, mild_weather, or any</li>
            <li>• <strong>Dish Type:</strong> warming (soups, stews), cooling (salads, cold dishes), or neutral</li>
            <li>• <strong>Examples:</strong> Tomato soup → winter/cold_weather/warming, Greek salad → summer/hot_weather/cooling</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
