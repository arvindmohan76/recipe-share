import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';
import { supabase, Recipe } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import RecipeCard from './RecipeCard';

const SavedRecipes: React.FC = () => {
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [recipeEngagement, setRecipeEngagement] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchSavedRecipes();
    } else {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (savedRecipes.length > 0) {
      fetchRecipeEngagement();
    }
  }, [savedRecipes]);

  const fetchSavedRecipes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_recipes')
        .select(`
          recipe_id,
          recipes (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        const recipes = data?.map(item => item.recipes).filter(Boolean) as Recipe[] || [];
        setSavedRecipes(recipes);
        setSavedRecipeIds(new Set(recipes.map(r => r.id)));
      }
    } catch (err) {
      setError('Failed to fetch saved recipes');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipeEngagement = async () => {
    try {
      const recipeIds = savedRecipes.map(r => r.id);
      
      if (recipeIds.length === 0) return;

      // Fetch bookmark counts
      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from('saved_recipes')
        .select('recipe_id')
        .in('recipe_id', recipeIds);

      // Fetch comment counts
      const { data: commentData, error: commentError } = await supabase
        .from('recipe_comments')
        .select('recipe_id')
        .in('recipe_id', recipeIds);

      if (!bookmarkError && !commentError) {
        const engagementMap = new Map();
        
        // Count bookmarks per recipe
        const bookmarkCounts = bookmarkData?.reduce((acc, item) => {
          acc[item.recipe_id] = (acc[item.recipe_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        // Count comments per recipe
        const commentCounts = commentData?.reduce((acc, item) => {
          acc[item.recipe_id] = (acc[item.recipe_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

        // Combine engagement data
        savedRecipes.forEach(recipe => {
          engagementMap.set(recipe.id, {
            bookmarkCount: bookmarkCounts[recipe.id] || 0,
            commentCount: commentCounts[recipe.id] || 0
          });
        });

        setRecipeEngagement(engagementMap);
      }
    } catch (err) {
      console.error('Failed to fetch recipe engagement:', err);
    }
  };

  const handleUnsaveRecipe = async (recipeId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId);

      if (!error) {
        setSavedRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
        setSavedRecipeIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(recipeId);
          return newSet;
        });
      }
    } catch (err) {
      console.error('Failed to unsave recipe:', err);
    }
  };

  if (!user) {
    return (
      <Message 
        severity="info" 
        text="Please sign in to view your saved recipes." 
        className="w-full"
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <i className="pi pi-spinner pi-spin text-4xl text-blue-500"></i>
      </div>
    );
  }

  if (error) {
    return (
      <Message severity="error" text={error} className="w-full" />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Bookmarked Recipes</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {savedRecipes.length} recipe{savedRecipes.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <Button
          label="Browse More"
          icon="pi pi-search"
          className="p-button-outlined"
          onClick={() => navigate('/recipes')}
        />
      </div>

      {savedRecipes.length === 0 ? (
        <Card className="text-center p-8">
          <div className="space-y-4">
            <i className="pi pi-heart text-6xl text-gray-300"></i>
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">No Saved Recipes Yet</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Start exploring recipes and bookmark your favorites to see them here.
            </p>
            <Button
              label="Discover"
              icon="pi pi-search"
             className="p-button-outlined"
              onClick={() => navigate('/recipes')}
            />
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {savedRecipes.map((recipe) => (
            <div key={recipe.id} className="h-full">
              {(() => {
                const engagement = recipeEngagement.get(recipe.id) || { bookmarkCount: 0, commentCount: 0 };
                return (
                  <RecipeCard
                    recipe={recipe}
                    onSave={handleUnsaveRecipe}
                    isSaved={savedRecipeIds.has(recipe.id)}
                    bookmarkCount={engagement.bookmarkCount}
                    commentCount={engagement.commentCount}
                  />
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedRecipes;