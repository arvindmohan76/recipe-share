import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Carousel } from 'primereact/carousel';
import { Divider } from 'primereact/divider';
import { useNavigate } from 'react-router-dom';
import { supabase, Recipe } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import RecipeCard from '../Recipe/RecipeCard';

const Home: React.FC = () => {
  const [featuredRecipes, setFeaturedRecipes] = useState<Recipe[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<Recipe[]>([]);
  const [recipeEngagement, setRecipeEngagement] = useState<Map<string, any>>(new Map());
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

  useEffect(() => {
    if (featuredRecipes.length > 0) {
      fetchRecipeEngagement();
    }
  }, [featuredRecipes]);

  const fetchFeaturedRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(12);

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

  const fetchRecipeEngagement = async () => {
    try {
      const allRecipes = [...featuredRecipes, ...trendingRecipes];
      const recipeIds = allRecipes.map(r => r.id);
      
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
        allRecipes.forEach(recipe => {
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
    <div className="relative overflow-hidden rounded-xl shadow-xl mb-10">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/90 to-red-600/90 dark:from-orange-600/90 dark:to-red-700/90 z-10"></div>
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=1600')] bg-cover bg-center"></div>
      
      <div className="relative z-20 max-w-5xl mx-auto py-16 px-6 text-center">
        <div className="animate-fadeIn">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white drop-shadow-md">
            Discover & Share <span className="text-yellow-300">Delicious</span> Recipes
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join our community of food lovers to find inspiration, share your culinary creations, and explore flavors from around the world.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              label="Explore Recipes"
              icon="pi pi-search"
              className="p-button-lg shadow-lg bg-white text-orange-600 border-white hover:bg-orange-50"
              onClick={() => navigate('/recipes')}
            />
            {user ? (
              <Button
                label="Create Recipe"
                icon="pi pi-plus"
                className="p-button-lg p-button-outlined shadow-lg text-white border-white hover:bg-white/20"
                onClick={() => navigate('/recipes/new')}
              />
            ) : (
              <Button
                label="Join Now"
                icon="pi pi-user-plus"
                className="p-button-lg p-button-outlined shadow-lg text-white border-white hover:bg-white/20"
                onClick={() => navigate('/auth?mode=signup')}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const featuredCuisines = [
    { name: 'Italian', emoji: '🍝', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', image: 'https://images.pexels.com/photos/1527603/pexels-photo-1527603.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Asian', emoji: '🥢', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', image: 'https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Mexican', emoji: '🌮', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', image: 'https://images.pexels.com/photos/2092507/pexels-photo-2092507.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Indian', emoji: '🍛', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', image: 'https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'French', emoji: '🥐', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', image: 'https://images.pexels.com/photos/2135/food-france-morning-breakfast.jpg?auto=compress&cs=tinysrgb&w=400' },
    { name: 'Healthy', emoji: '🥗', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', image: 'https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?auto=compress&cs=tinysrgb&w=400' }
  ];

  const recipeTemplate = (recipe: Recipe) => {
    const engagement = recipeEngagement.get(recipe.id) || { bookmarkCount: 0, commentCount: 0 };
    
    return (
      <div className="p-2">
        <RecipeCard
          recipe={recipe}
          onSave={handleSaveRecipe}
          isSaved={savedRecipes.has(recipe.id)}
          bookmarkCount={engagement.bookmarkCount}
          commentCount={engagement.commentCount}
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
    <div className="space-y-12">
      {heroSection}

      {/* Stats Section */}
      <section className="py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-orange-500 mb-2">1,200+</div>
            <div className="text-gray-600 dark:text-gray-300 text-sm">Recipes</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-green-500 mb-2">25+</div>
            <div className="text-gray-600 dark:text-gray-300 text-sm">Cuisines</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-blue-500 mb-2">15K+</div>
            <div className="text-gray-600 dark:text-gray-300 text-sm">Users</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow">
            <div className="text-3xl font-bold text-purple-500 mb-2">50K+</div>
            <div className="text-gray-600 dark:text-gray-300 text-sm">Reviews</div>
          </div>
        </div>
      </section>

      {/* Featured Recipes */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Featured Recipes</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Discover our most popular and highly-rated recipes
            </p>
          </div>
          <Button
            label="View All"
            icon="pi pi-arrow-right"
            className="p-button-outlined mt-4 md:mt-0"
            onClick={() => navigate('/recipes')}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-8">
          {featuredRecipes.map((recipe) => (
            <div key={recipe.id} className="h-full">
              {(() => {
                const engagement = recipeEngagement.get(recipe.id) || { bookmarkCount: 0, commentCount: 0 };
                return (
                  <RecipeCard
                    recipe={recipe}
                    onSave={handleSaveRecipe}
                    isSaved={savedRecipes.has(recipe.id)}
                    bookmarkCount={engagement.bookmarkCount}
                    commentCount={engagement.commentCount}
                  />
                );
              })()}
            </div>
          ))}
        </div>
        
        {/* Show "Load More" if there are more recipes */}
        {featuredRecipes.length === 12 && (
          <div className="text-center">
            <Button 
              label="View All Recipes" 
              icon="pi pi-arrow-right" 
              className="p-button-outlined p-button-lg" 
              onClick={() => navigate('/recipes')} 
            />
          </div>
        )}
      </section>

      <Divider className="my-8" />

      {/* Trending Recipes */}
      {trendingRecipes.length > 0 && (
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Trending Now</h2>
              <p className="text-gray-600 dark:text-gray-400">
                See what's popular in our community this week
              </p>
            </div>
          </div>
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

      <Divider className="my-8" />

      {/* Recipe Categories - More recipe-focused */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Explore Cuisines</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Discover recipes from around the world
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {featuredCuisines.map((cuisine) => (
            <div 
              key={cuisine.name}
              onClick={() => navigate(`/recipes?cuisine=${cuisine.name}`)}
              className="group cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-xl aspect-square mb-3 shadow-md group-hover:shadow-lg transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent z-10"></div>
                <img 
                  src={cuisine.image} 
                  alt={cuisine.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                  <div className="text-3xl mb-1">{cuisine.emoji}</div>
                  <div className="text-white font-bold text-lg">{cuisine.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Divider className="my-8" />

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-2 border-orange-200 dark:border-orange-700 shadow-lg">
        <div className="text-center p-8">
          <h3 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
            Ready to Start Cooking?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg max-w-2xl mx-auto">
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
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="text-center p-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-500 mb-4">
              <i className="pi pi-microphone text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Voice Cooking Mode</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Hands-free cooking with voice commands to navigate recipes while your hands are busy.
            </p>
          </div>
          <div className="text-center p-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-500 mb-4">
              <i className="pi pi-sparkles text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">AI-Enhanced Recipes</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Smart recipe descriptions and cooking tips powered by advanced AI technology.
            </p>
          </div>
          <div className="text-center p-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 mb-4">
              <i className="pi pi-shopping-cart text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Shopping Lists</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Automatically generate shopping lists from your favorite recipes for easier meal planning.
            </p>
          </div>
        </div>
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          © 2025 RecipeHub • All recipes and images are property of their respective owners
        </div>
      </div>
    </div>
  );
};

export default Home;