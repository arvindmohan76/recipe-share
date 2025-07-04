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
    <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white p-8 rounded-lg mb-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold mb-4">Welcome to RecipeHub</h1>
        <p className="text-xl mb-6">
          Discover amazing recipes, plan your meals, and cook with confidence using our AI-powered cooking assistant.
        </p>
        <div className="flex justify-center gap-4">
          <Button
            label="Explore Recipes"
            icon="pi pi-search"
            size="large"
            className="bg-white text-orange-500 hover:bg-gray-100 mr-3"
            onClick={() => navigate('/recipes')}
          />
          {user && (
            <Button
              label="Create Recipe"
              icon="pi pi-plus"
              size="large"
              onClick={() => navigate('/recipes/new')}
              className="bg-orange-600 hover:bg-orange-700"
            />
          )}
        </div>
      </div>
    </div>
  );

  const featuresSection = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="text-center p-6 hover:shadow-lg transition-shadow">
        <div className="text-4xl text-blue-500 mb-4">🎤</div>
        <h3 className="text-xl font-bold mb-2">Voice Cooking</h3>
        <p className="text-gray-600">
          Cook hands-free with voice commands. Navigate through recipes without touching your device.
        </p>
      </Card>
      <Card className="text-center p-6 hover:shadow-lg transition-shadow">
        <div className="text-4xl text-green-500 mb-4">🤖</div>
        <h3 className="text-xl font-bold mb-2">AI Recommendations</h3>
        <p className="text-gray-600">
          Get personalized recipe suggestions based on your preferences and cooking history.
        </p>
      </Card>
      <Card className="text-center p-6 hover:shadow-lg transition-shadow">
        <div className="text-4xl text-purple-500 mb-4">📅</div>
        <h3 className="text-xl font-bold mb-2">Meal Planning</h3>
        <p className="text-gray-600">
          Plan your weekly meals and automatically generate shopping lists.
        </p>
      </Card>
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
      {featuresSection}

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <div className="text-center p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Ready to Start Cooking?
          </h3>
          <p className="text-gray-600 mb-6">
            Join thousands of home cooks sharing their favorite recipes and discovering new ones.
          </p>
          {!user ? (
            <div className="flex justify-center gap-4">
              <Button
                label="Sign Up Now"
                icon="pi pi-user-plus"
                size="large"
                onClick={() => navigate('/auth?mode=signup')}
                className="bg-blue-500 hover:bg-blue-600"
              />
              <Button
                label="Browse Recipes"
                icon="pi pi-search"
                size="large"
                onClick={() => navigate('/recipes')}
                className="p-button-outlined"
              />
            </div>
          ) : (
            <div className="flex justify-center gap-4">
              <Button
                label="Share Your Recipe"
                icon="pi pi-plus"
                size="large"
                className="bg-green-500 hover:bg-green-600 px-6 py-3"
                onClick={() => navigate('/recipes/new')}
              />
              <Button
                label="View My Bookmarks"
                icon="pi pi-heart"
                size="large"
                className="p-button-outlined"
                onClick={() => navigate('/saved-recipes')}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Home;