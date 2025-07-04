import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Carousel } from 'primereact/carousel';
import { useNavigate } from 'react-router-dom';
import { supabase, Recipe } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import RecipeCard from '../Recipe/RecipeCard';

const Home: React.FC = () => {
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedRecipes();
    fetchTrendingRecipes();
    if (user) {
      fetchSavedRecipes();
    }
  }, [user]);

  const fetchFeaturedRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (!error) {
        setFeaturedRecipes(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch featured recipes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('is_public', true)
        .order('view_count', { ascending: false })
        .limit(4);

      if (!error) {
        setTrendingRecipes(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch trending recipes:', err);
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

  const heroSection = (
    <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white p-5 rounded-lg mb-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Welcome to RecipeHub</h1>
        <p className="text-base md:text-lg mb-4">
          Discover amazing recipes from around the world and start cooking today.
        </p>
        <div className="button-container justify-center">
          <Button
            label="Explore Recipes"
            icon="pi pi-search"
            className="p-button-success"
            onClick={() => navigate('/recipes')}
          />
          {user && (
            <Button
              label="Create Recipe"
              icon="pi pi-plus"
              className="p-button-success"
              onClick={() => navigate('/recipes/new')}
            />
          )}
        </div>
      </div>
    </div>
  );


  const recipeTemplate = (recipe: Recipe) => {
    return (
      <div className="p-2">
        <RecipeCard
          recipe={recipe}
          onSave={handleSaveRecipe}
          isSaved={savedRecipes.has(recipe.id)}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <i className="pi pi-spinner pi-spin text-4xl text-orange-500"></i>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {heroSection}

      {/* Featured Recipes */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Featured Recipes</h2>
          <Button
            label="View All"
            icon="pi pi-arrow-right"
            className="p-button-text hover:bg-gray-100 px-4 py-2 rounded-md transition-colors"
            onClick={() => navigate('/recipes')}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {featuredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSave={handleSaveRecipe}
              isSaved={savedRecipes.has(recipe.id)}
            />
          ))}
        </div>
      </section>

      {/* Trending Recipes */}
      {trendingRecipes.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Trending Now</h2>
          <Carousel
            value={trendingRecipes}
            numVisible={3}
            numScroll={1}
            responsiveOptions={[
              {
                breakpoint: '1024px',
                numVisible: 2,
                numScroll: 1
              },
              {
                breakpoint: '768px',
                numVisible: 1,
                numScroll: 1
              }
            ]}
            itemTemplate={recipeTemplate}
            className="custom-carousel"
          />
        </section>
      )}

      {/* Recipe Categories - More recipe-focused */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { name: 'Italian', emoji: '🍝', color: 'bg-red-100 text-red-700' },
            { name: 'Asian', emoji: '🥢', color: 'bg-yellow-100 text-yellow-700' },
            { name: 'Mexican', emoji: '🌮', color: 'bg-orange-100 text-orange-700' },
            { name: 'Indian', emoji: '🍛', color: 'bg-amber-100 text-amber-700' },
            { name: 'French', emoji: '🥐', color: 'bg-blue-100 text-blue-700' },
            { name: 'Healthy', emoji: '🥗', color: 'bg-green-100 text-green-700' }
          ].map((category) => (
            <button
              key={category.name}
              onClick={() => navigate(`/recipes?cuisine=${category.name}`)}
              className={`${category.color} p-4 rounded-lg text-center hover:shadow-md transition-all duration-200 hover:scale-105`}
            >
              <div className="text-2xl mb-2">{category.emoji}</div>
              <div className="font-medium text-sm">{category.name}</div>
            </button>
          ))}
        </div>
      </section>
      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200">
        <div className="text-center p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Ready to Start Cooking?
          </h3>
          <p className="text-gray-600 mb-6">
            Join thousands of home cooks sharing their favorite recipes and discovering new ones.
          </p>
          {!user ? (
            <div className="button-container justify-center">
              <Button
                label="Sign Up Now"
                icon="pi pi-user-plus"
                className="p-button-lg p-button-success"
                onClick={() => navigate('/auth?mode=signup')}
              />
              <Button
                label="Browse Recipes"
                icon="pi pi-search"
                className="p-button-lg p-button-success"
                onClick={() => navigate('/recipes')}
              />
            </div>
          ) : (
            <div className="button-container justify-center">
              <Button
                label="Share Your Recipe"
                icon="pi pi-plus"
                className="p-button-lg p-button-success"
                onClick={() => navigate('/recipes/new')}
              />
              <Button
                label="View My Bookmarks"
                icon="pi pi-heart"
                className="p-button-lg p-button-success"
                onClick={() => navigate('/saved-recipes')}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Subtle Features Footer - Much more subtle */}
      <div className="text-center py-8 border-t border-gray-200">
        <p className="text-sm text-gray-500 mb-4">
          Enhanced with smart features to make cooking easier
        </p>
        <div className="flex justify-center items-center gap-8 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <i className="pi pi-microphone"></i>
            Voice commands
          </span>
          <span className="flex items-center gap-1">
            <i className="pi pi-sparkles"></i>
            Smart descriptions
          </span>
          <span className="flex items-center gap-1">
            <i className="pi pi-calendar"></i>
            Meal planning
          </span>
        </div>
      </div>
    </div>
  );
};

export default Home;