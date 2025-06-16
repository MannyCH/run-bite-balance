
import React from 'react';
import RecipeImporter from '@/components/Recipe/RecipeImporter';
import { RecipeSeasonalClassifier } from '@/components/Recipe/RecipeSeasonalClassifier';
import MainLayout from '@/components/Layout/MainLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const RecipeImporterPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipe Management</h1>
          <p className="text-muted-foreground mt-2">
            Import recipes from ZIP files and manage seasonal classifications for smart meal planning
          </p>
        </div>

        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="space-y-1">
              <div className="font-medium">Important: Seasonal Classification Required</div>
              <div className="text-sm">
                For best results with seasonal meal planning, classify your recipes after importing them. 
                This ensures winter dishes don't appear in summer meal plans and vice versa.
              </div>
            </div>
          </AlertDescription>
        </Alert>
        
        <div className="space-y-8">
          {/* Recipe Classification - Move to top for prominence */}
          <RecipeSeasonalClassifier />
          
          {/* Recipe Import */}
          <RecipeImporter />
        </div>
      </div>
    </MainLayout>
  );
};

export default RecipeImporterPage;
