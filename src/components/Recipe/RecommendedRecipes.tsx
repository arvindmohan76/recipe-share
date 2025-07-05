import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { getUserRecommendations, generateRecommendations } from '../../lib/searchHistory';
import RecipeCard from './RecipeCard';

interface RecipeRecommendation {
  id: string;
  user_id: string;
  recipe_id: string;
  recommendation_type: string;
  confidence_score: number;
  reasoning?: string;
  created_at: string;
  recipe?: any;
}

const RecommendedRecipes: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecipeRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchRecommendations();
      fetchSavedRecipes();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    if (!user) return;

    try {
      const userRecommendations = await getUserRecommendations(user.id, 12);
      setRecommendations(userRecommendations);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedRecipes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_recipes')
        .select('recipe_id')
        .eq('user_id', user.id);

      if (!error && data) {
        setSavedRecipes(new Set(data.map(item => item.recipe_id)));
      }
    } catch (err) {
      console.error('Failed to fetch saved recipes:', err);
    }
  };

  const handleGenerateRecommendations = async () => {
    if (!user) return;

    setGenerating(true);
    try {
      const success = await generateRecommendations(user.id);
      if (success) {
        await fetchRecommendations();
      } else {
        setError('Failed to generate recommendations. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while generating recommendations.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveRecipe = async (recipeId: string) => {
    if (!user) return;

    try {
      const isSaved = savedRecipes.has(recipeId);
      
      if (isSaved) {
        const { error } = await supabase
          .from('saved_recipes')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId);

        if (!error) {
          setSavedRecipes(prev => {
            const newSet = new Set(prev);
            newSet.delete(recipeId);
            return newSet;
          });
        }
      } else {
        const { error } = await supabase
          .from('saved_recipes')
          .insert([{ user_id: user.id, recipe_id: recipeId }]);

        if (!error) {
          setSavedRecipes(prev => new Set([...prev, recipeId]));
        }
      }
    } catch (err) {
      console.error('Failed to save/unsave recipe:', err);
    }
  };

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Recipe Recommendations</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Discover personalized recipe suggestions based on your preferences
          </p>
        </div>
        <Message severity="info" text="Please sign in to view personalized recipe recommendations." className="w-full" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Recipe Recommendations</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Discover personalized recipe suggestions based on your preferences
          </p>
        </div>
        <div className="flex justify-center items-center h-64">
          <i className="pi pi-spinner pi-spin text-4xl text-blue-500"></i>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Recipe Recommendations</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Discover personalized recipe suggestions based on your preferences
          </p>
        </div>
        <Button
          label="Generate New"
          icon="pi pi-refresh"
          onClick={handleGenerateRecommendations}
          loading={generating}
          className="p-button-outlined"
        />
      </div>

      {error && (
        <Message severity="error" text={error} className="w-full" />
      )}

      {recommendations.length === 0 ? (
        <Card className="text-center p-8">
          <div className="space-y-4">
            <i className="pi pi-lightbulb text-6xl text-gray-300"></i>
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">No Recommendations Yet</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Start exploring recipes and searching to get personalized recommendations based on your preferences.
            </p>
            <div className="space-y-3">
              <Button
                label="Generate Recommendations"
                icon="pi pi-sparkles"
                onClick={handleGenerateRecommendations}
                loading={generating}
                className="p-button-success"
              />
              <div className="text-center">
                <Button
                  label="Browse All Recipes"
                  icon="pi pi-search"
                  onClick={() => navigate('/recipes')}
                  className="p-button-outlined"
                />
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Recommendation Categories */}
          {['search_history', 'saved_recipes', 'trending', 'seasonal'].map(type => {
            const typeRecommendations = recommendations.filter(rec => rec.recommendation_type === type);
            if (typeRecommendations.length === 0) return null;

            const typeLabels = {
              search_history: 'Based on Your Searches',
              saved_recipes: 'Similar to Your Saved Recipes',
              trending: 'Trending Now',
              seasonal: 'Popular Recipes'
            };

            return (
              <div key={type} className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {typeLabels[type as keyof typeof typeLabels]}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {typeRecommendations.slice(0, 4).map((recommendation) => (
                    <div key={recommendation.id} className="h-full">
                      <RecipeCard
                        recipe={recommendation.recipe}
                        onSave={handleSaveRecipe}
                        isSaved={savedRecipes.has(recommendation.recipe_id)}
                      />
                      {recommendation.reasoning && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            <i className="pi pi-info-circle mr-1"></i>
                            {recommendation.reasoning}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecommendedRecipes;