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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Bookmarked Recipes</h1>
          <p className="text-gray-600 mt-2">
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
            <h3 className="text-xl font-semibold text-gray-600">No Saved Recipes Yet</h3>
            <p className="text-gray-500">
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
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSave={handleUnsaveRecipe}
              isSaved={savedRecipeIds.has(recipe.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedRecipes;