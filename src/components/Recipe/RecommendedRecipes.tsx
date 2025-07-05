import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { DataView } from 'primereact/dataview';
import { Skeleton } from 'primereact/skeleton';
import { ChefHat, Clock, Users, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

interface Recipe {
  id: string;
  title: string;
  description: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: string;
  cuisine_type: string;
  ingredients: string[];
  instructions: string[];
  image_url?: string;
  rating?: number;
  created_at: string;
  user_id: string;
}

interface RecommendedRecipesProps {
  currentRecipeId?: string;
  limit?: number;
}

export const RecommendedRecipes: React.FC<RecommendedRecipesProps> = ({ 
  currentRecipeId, 
  limit = 6 
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchRecommendedRecipes();
  }, [currentRecipeId, limit]);

  const fetchRecommendedRecipes = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('recipes')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      // Exclude current recipe if provided
      if (currentRecipeId) {
        query = query.neq('id', currentRecipeId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setRecipes(data || []);
    } catch (err) {
      console.error('Error fetching recommended recipes:', err);
      setError('Failed to load recommended recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecipe = (recipeId: string) => {
    // Navigate to recipe detail - you can implement routing here
    window.location.href = `/recipe/${recipeId}`;
  };

  const itemTemplate = (recipe: Recipe) => {
    return (
      <div className="col-12 sm:col-6 lg:col-4 p-2">
        <Card className="h-full shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex flex-column h-full">
            {/* Recipe Image */}
            <div className="relative mb-3">
              {recipe.image_url ? (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="w-full h-48 object-cover border-round"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 border-round flex align-items-center justify-content-center">
                  <ChefHat className="w-12 h-12 text-gray-400" />
                </div>
              )}
              {recipe.rating && (
                <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 border-round flex align-items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{recipe.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Recipe Info */}
            <div className="flex-1 flex flex-column">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-height-3">
                {recipe.title}
              </h3>
              
              <p className="text-gray-600 text-sm mb-3 line-height-3 flex-1">
                {recipe.description}
              </p>

              {/* Recipe Meta */}
              <div className="flex align-items-center gap-4 mb-3 text-sm text-gray-500">
                <div className="flex align-items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{recipe.prep_time + recipe.cook_time} min</span>
                </div>
                <div className="flex align-items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{recipe.servings} servings</span>
                </div>
              </div>

              {/* Difficulty Badge */}
              <div className="mb-3">
                <span className={`px-2 py-1 border-round text-xs font-medium ${
                  recipe.difficulty === 'Easy' 
                    ? 'bg-green-100 text-green-800'
                    : recipe.difficulty === 'Medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {recipe.difficulty}
                </span>
              </div>

              {/* Action Button */}
              <Button
                label="View Recipe"
                className="w-full p-button-outlined p-button-sm"
                onClick={() => handleViewRecipe(recipe.id)}
              />
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const loadingTemplate = () => {
    return (
      <div className="col-12 sm:col-6 lg:col-4 p-2">
        <Card className="h-full">
          <div className="flex flex-column h-full">
            <Skeleton width="100%" height="12rem" className="mb-3" />
            <Skeleton width="80%" height="1.5rem" className="mb-2" />
            <Skeleton width="100%" height="3rem" className="mb-3" />
            <div className="flex gap-4 mb-3">
              <Skeleton width="4rem" height="1rem" />
              <Skeleton width="4rem" height="1rem" />
            </div>
            <Skeleton width="3rem" height="1.5rem" className="mb-3" />
            <Skeleton width="100%" height="2.5rem" />
          </div>
        </Card>
      </div>
    );
  };

  if (error) {
    return (
      <div className="w-full">
        <Message 
          severity="error" 
          text={error}
          className="w-full"
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex align-items-center justify-content-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 m-0">
          Recommended Recipes
        </h2>
        {recipes.length > 0 && (
          <Button
            label="View All"
            className="p-button-text p-button-sm"
            onClick={() => window.location.href = '/recipes'}
          />
        )}
      </div>

      {loading ? (
        <div className="grid">
          {Array.from({ length: limit }).map((_, index) => (
            <React.Fragment key={index}>
              {loadingTemplate()}
            </React.Fragment>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-8">
          <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No recipes found
          </h3>
          <p className="text-gray-500 mb-4">
            Be the first to share a recipe with the community!
          </p>
          <Button
            label="Create Recipe"
            className="p-button-primary"
            onClick={() => window.location.href = '/recipe/new'}
          />
        </div>
      ) : (
        <DataView
          value={recipes}
          itemTemplate={itemTemplate}
          layout="grid"
          paginator={false}
          className="recipe-dataview"
        />
      )}
    </div>
  );
};

export default RecommendedRecipes;