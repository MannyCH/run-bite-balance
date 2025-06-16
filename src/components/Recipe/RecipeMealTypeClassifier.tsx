
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Tags } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ClassificationResult {
  message: string;
  processed: number;
  total_found: number;
  errors?: Array<{ id: string; error: string }>;
}

export const RecipeMealTypeClassifier: React.FC = () => {
  const [isClassifying, setIsClassifying] = useState(false);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClassifyMealTypes = async () => {
    setIsClassifying(true);
    setError(null);
    setResult(null);

    try {
      console.log('Starting meal type classification...');
      
      const { data, error: functionError } = await supabase.functions.invoke('classify-recipe-meal-types', {
        body: {}
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to classify recipes');
      }

      setResult(data);
      
      if (data.processed > 0) {
        console.log(`Successfully classified ${data.processed} recipes`);
      }
    } catch (err) {
      console.error('Classification error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="h-5 w-5" />
          Meal Type Classification
        </CardTitle>
        <CardDescription>
          Automatically classify recipes into meal types (breakfast, lunch, dinner, snack) using AI.
          This improves meal plan generation by ensuring recipes appear at appropriate times.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleClassifyMealTypes}
          disabled={isClassifying}
          className="w-full"
        >
          {isClassifying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Classifying Recipes...
            </>
          ) : (
            <>
              <Tags className="h-4 w-4 mr-2" />
              Classify Recipe Meal Types
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <div className="font-medium">{result.message}</div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">
                    Processed: {result.processed}
                  </Badge>
                  <Badge variant="outline">
                    Found: {result.total_found}
                  </Badge>
                  {result.errors && result.errors.length > 0 && (
                    <Badge variant="destructive">
                      Errors: {result.errors.length}
                    </Badge>
                  )}
                </div>
                {result.processed === 0 && result.total_found === 0 && (
                  <div className="text-sm text-muted-foreground">
                    All recipes already have meal type classifications.
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
