
import React from 'react';
import RecipeImporter from '@/components/Recipe/RecipeImporter';
import { RecipeSeasonalClassifier } from '@/components/Recipe/RecipeSeasonalClassifier';
import { RecipeMealTypeClassifier } from '@/components/Recipe/RecipeMealTypeClassifier';
import MainLayout from '@/components/Layout/MainLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';

const RecipeImporterPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipe Management</h1>
          <p className="text-muted-foreground mt-2">
            Import recipes from ZIP files and manage classifications for smart meal planning
          </p>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-1">
              <div className="font-medium">Recipe Classification Process</div>
              <div className="text-sm">
                1. First classify recipes by meal type (breakfast, lunch, dinner, snack)<br/>
                2. Then classify by seasonal suitability for weather-appropriate meal plans<br/>
                3. This ensures recipes appear at the right times and seasons
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="space-y-1">
              <div className="font-medium">Important: Complete Classification Required</div>
              <div className="text-sm">
                For best results with meal planning, ensure all recipes are properly classified.
                Run meal type classification first, then seasonal classification.
              </div>
            </div>
          </AlertDescription>
        </Alert>
        
        <div className="space-y-8">
          {/* Meal Type Classification - Most important */}
          <RecipeMealTypeClassifier />
          
          {/* Seasonal Classification */}
          <RecipeSeasonalClassifier />
          
          {/* Recipe Import */}
          <RecipeImporter />
        </div>
      </div>
    </MainLayout>
  );
};

export default RecipeImporterPage;
