

import React, { useState } from 'react';
import RecipeImporter from '@/components/Recipe/RecipeImporter';
import { RecipeSeasonalClassifier } from '@/components/Recipe/RecipeSeasonalClassifier';
import { RecipeMealTypeClassifier } from '@/components/Recipe/RecipeMealTypeClassifier';
import MainLayout from '@/components/Layout/MainLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { exportAllRecipesAsZip } from '@/utils/recipeExporter';
import { toast } from 'sonner';

const RecipeImporterPage: React.FC = () => {
  const { recipes } = useApp();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (recipes.length === 0) {
      toast.error('No recipes to export');
      return;
    }
    setIsExporting(true);
    try {
      await exportAllRecipesAsZip(recipes);
      toast.success(`Exported ${recipes.length} recipes as ZIP`);
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export recipes');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recipe Management</h1>
            <p className="text-muted-foreground mt-2">
              Import recipes from ZIP files and manage classifications for smart meal planning
            </p>
          </div>
          <Button onClick={handleExport} disabled={isExporting || recipes.length === 0} variant="outline">
            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Export All ({recipes.length})
          </Button>
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
