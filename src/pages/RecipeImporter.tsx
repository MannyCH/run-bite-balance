
import React from 'react';
import RecipeImporter from '@/components/Recipe/RecipeImporter';
import { RecipeSeasonalClassifier } from '@/components/Recipe/RecipeSeasonalClassifier';
import MainLayout from '@/components/Layout/MainLayout';

const RecipeImporterPage: React.FC = () => {
  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipe Management</h1>
          <p className="text-muted-foreground mt-2">
            Import recipes from ZIP files and manage seasonal classifications
          </p>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-1 xl:grid-cols-2">
          <RecipeImporter />
          <div className="flex justify-center">
            <RecipeSeasonalClassifier />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RecipeImporterPage;
