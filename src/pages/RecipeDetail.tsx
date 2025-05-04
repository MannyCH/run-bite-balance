
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import MainLayout from "../components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, BookOpen, Clock, Utensils } from "lucide-react";

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { recipes } = useApp();
  const [recipe, setRecipe] = useState<any | null>(null);

  useEffect(() => {
    if (id && recipes.length > 0) {
      const foundRecipe = recipes.find(r => r.id === id);
      if (foundRecipe) {
        setRecipe(foundRecipe);
        // Scroll to top when recipe loads
        window.scrollTo(0, 0);
      }
    }
  }, [id, recipes]);

  if (!recipe) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-2xl font-semibold mb-4">Recipe not found</h2>
          <Button asChild>
            <Link to="/suggested-meals">Back to recipes</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const renderHeroImage = () => {
    if (!recipe.imgUrl) {
      return (
        <div className="w-full bg-gray-100 h-48 md:h-64 lg:h-80 flex items-center justify-center mb-6">
          <BookOpen className="w-16 h-16 text-gray-400" />
        </div>
      );
    }

    return (
      <div className="w-full mb-6 overflow-hidden rounded-lg shadow-md">
        <AspectRatio ratio={16 / 9}>
          <img 
            src={recipe.imgUrl} 
            alt={recipe.title} 
            className="object-cover w-full h-full"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.classList.add('bg-gray-100', 'flex', 'items-center', 'justify-center');
              const icon = document.createElement('div');
              icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>';
              (e.target as HTMLImageElement).parentElement!.appendChild(icon);
            }}
          />
        </AspectRatio>
      </div>
    );
  };

  const renderNutritionInfo = () => {
    const hasNutrition = recipe.calories > 0 || recipe.protein > 0 || recipe.carbs > 0 || recipe.fat > 0;
    
    if (!hasNutrition) return null;
    
    return (
      <div className="flex flex-wrap gap-3 mb-6">
        {recipe.calories > 0 && (
          <div className="px-3 py-1 bg-gray-100 rounded-full text-sm">
            {recipe.calories} calories
          </div>
        )}
        {recipe.protein > 0 && (
          <div className="px-3 py-1 bg-gray-100 rounded-full text-sm">
            {recipe.protein}g protein
          </div>
        )}
        {recipe.carbs > 0 && (
          <div className="px-3 py-1 bg-gray-100 rounded-full text-sm">
            {recipe.carbs}g carbs
          </div>
        )}
        {recipe.fat > 0 && (
          <div className="px-3 py-1 bg-gray-100 rounded-full text-sm">
            {recipe.fat}g fat
          </div>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 pb-16 max-w-5xl">
        <div className="mb-6">
          <Button variant="ghost" className="pl-0 mb-2" asChild>
            <Link to="/suggested-meals">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to recipes
            </Link>
          </Button>
        </div>
        
        {renderHeroImage()}
        
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{recipe.title}</h1>
        
        {renderNutritionInfo()}
        
        <div className="flex flex-wrap items-center gap-4 mb-6">
          {recipe.servings && (
            <div className="flex items-center text-gray-600">
              <Utensils className="w-4 h-4 mr-1" />
              <span>Serves {recipe.servings}</span>
            </div>
          )}
          
          {recipe.categories && recipe.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.categories.map((category: string, index: number) => (
                <span key={index} className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-700">
                  {category}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="recipe-section">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Utensils className="w-5 h-5 mr-2" />
              Ingredients
            </h2>
            <Separator className="mb-4" />
            {recipe.ingredients && recipe.ingredients.length > 0 ? (
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient: string, index: number) => (
                  <li key={index} className="flex items-baseline">
                    <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2 mt-2"></span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No ingredients listed</p>
            )}
          </div>
          
          <div className="recipe-section">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Instructions
            </h2>
            <Separator className="mb-4" />
            {recipe.instructions && recipe.instructions.length > 0 ? (
              <ol className="space-y-4">
                {recipe.instructions.map((instruction: string, index: number) => (
                  <li key={index} className="flex">
                    <span className="font-semibold text-primary mr-3">{index + 1}.</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-500 italic">No instructions listed</p>
            )}
          </div>
        </div>
        
        {recipe.website && (
          <div className="mt-10 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-medium mb-2">Source</h3>
            <a
              href={recipe.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all inline-block"
            >
              {recipe.website}
            </a>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default RecipeDetail;
