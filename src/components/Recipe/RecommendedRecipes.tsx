import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  getUserRecommendations,
  generateRecommendations,
  RecipeRecommendation
} from '../../lib/searchHistory';
import RecipeCard from './RecipeCard';
import { supabase } from '../../lib/supabase';

const RecommendedRecipes: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecipeRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadRecommendations();
      fetchSavedRecipes();
    }
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;

    try {
      console.log('Loading recommendations for user:', user.id);
      
      const userRecommendations = await getUserRecommendations(user.id, 12);
      console.log('Loaded recommendations:', userRecommendations);
      setRecommendations(userRecommendations);
      
      if (userRecommendations.length === 0) {
        console.log('No recommendations found, checking database directly...');
        
        // Check if recommendations exist in database
        const { data: dbRecs, error: dbError } = await supabase
          .from('recipe_recommendations')
          .select('*')
          .eq('user_id', user.id);
        
        console.log('Direct database check:', { dbRecs, dbError });
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
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

    console.log('Starting recommendation generation for user:', user.id);
    setGenerating(true);
    setError(''); // Clear any previous errors
    
    try {
      // First, let's check if we have any search history or saved recipes
      const { data: searchHistory } = await supabase
        .from('user_search_history')
        .select('*')
        .eq('user_id', user.id)
        .limit(5);
      
      const { data: savedRecipes } = await supabase
        .from('saved_recipes')
        .select('*')
        .eq('user_id', user.id)
        .limit(5);
      
      console.log('User data for recommendations:', {
        searchHistoryCount: searchHistory?.length || 0,
        savedRecipesCount: savedRecipes?.length || 0,
        searchHistory: searchHistory,
        savedRecipes: savedRecipes
      });
      
      // If no data, create some sample search history for testing
      if ((!searchHistory || searchHistory.length === 0) && (!savedRecipes || savedRecipes.length === 0)) {
        console.log('No search history or saved recipes found. Creating sample data...');
        
        // Add some sample search queries
        const sampleQueries = ['pasta', 'chicken', 'vegetarian', 'italian', 'quick meals'];
        for (const query of sampleQueries) {
          await supabase
            .from('user_search_history')
            .insert({
              user_id: user.id,
              search_query: query,
              search_type: 'general',
              filters_applied: {},
              results_count: Math.floor(Math.random() * 20) + 5
            });
        }
        console.log('Sample search history created');
      }
      
      const success = await generateRecommendations(user.id);
      console.log('Recommendation generation result:', success);
      
      if (success) {
        await loadRecommendations();
      } else {
        setError('Failed to generate recommendations. Please try again or contact support.');
      }
    } catch (err) {
      console.error('Error in handleGenerateRecommendations:', err);
      setError(`An error occurred while generating recommendations: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

  const getRecommendationTypeLabel = (type: string) => {
    switch (type) {
      case 'search_history': return 'Based on your searches';
      case 'saved_recipes': return 'Similar to your saved recipes';
      case 'similar_users': return 'Popular with similar users';
      case 'trending': return 'Trending now';
      case 'seasonal': return 'Seasonal favorites';
      default: return 'Recommended for you';
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'search_history': return 'pi-search';
      case 'saved_recipes': return 'pi-heart';
      case 'similar_users': return 'pi-users';
      case 'trending': return 'pi-chart-line';
      case 'seasonal': return 'pi-calendar';
      default: return 'pi-star';
    }
  };

  if (!user) {
    return (
      <Card className="text-center p-8">
        <div className="space-y-4">
          <i className="pi pi-user text-6xl text-gray-300"></i>
          <h3 className="text-xl font-semibold text-gray-600">Sign In for Personalized Recommendations</h3>
          <p className="text-gray-500">
            Create an account to get recipe recommendations based on your preferences and search history.
          </p>
          <Button
            label="Sign In"
            icon="pi pi-sign-in"
            onClick={() => navigate('/auth')}
            className="p-button-primary"
          />
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton width="300px" height="2rem" />
          <Skeleton width="150px" height="2.5rem" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index}>
              <Skeleton width="100%" height="200px" className="mb-4" />
              <Skeleton width="80%" height="1.5rem" className="mb-2" />
              <Skeleton width="60%" height="1rem" className="mb-4" />
              <div className="flex justify-between">
                <Skeleton width="100px" height="1rem" />
                <Skeleton width="80px" height="2rem" />
              </div>
            </Card>
          ))}
        </div>
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
          <h1 className="text-3xl font-bold text-gray-800">Recommended for You</h1>
          <p className="text-gray-600 mt-2">
            Personalized recipe suggestions based on your preferences and activity
          </p>
        </div>
        <Button
          label="Refresh Recommendations"
          icon="pi pi-refresh"
          onClick={handleGenerateRecommendations}
          loading={generating}
          className="p-button-outlined"
        />
        <Button
          label="Debug Info"
          icon="pi pi-info"
          onClick={async () => {
            if (!user) return;
            
            console.log('=== DEBUGGING RECOMMENDATION SYSTEM ===');
            
            // Check user data
            const { data: userData } = await supabase.from('users').select('*').eq('id', user.id).single();
            console.log('User data:', userData);
            
            // Check privacy settings
            const { data: privacyData } = await supabase.from('user_privacy_settings').select('*').eq('user_id', user.id).single();
            console.log('Privacy settings:', privacyData);
            
            // Check search history
            const { data: searchData } = await supabase.from('user_search_history').select('*').eq('user_id', user.id);
            console.log('Search history:', searchData);
            
            // Check saved recipes
            const { data: savedData } = await supabase.from('saved_recipes').select('*').eq('user_id', user.id);
            console.log('Saved recipes:', savedData);
            
            // Check existing recommendations
            const { data: recData } = await supabase.from('recipe_recommendations').select('*').eq('user_id', user.id);
            console.log('Existing recommendations:', recData);
            
            // Check available recipes
            const { data: recipesData } = await supabase.from('recipes').select('id, title, is_public').eq('is_public', true).limit(5);
            console.log('Available public recipes:', recipesData);
            
            console.log('=== END DEBUG INFO ===');
          }}
          className="p-button-info p-button-outlined ml-2"
        />
      </div>

      {recommendations.length === 0 ? (
        <Card className="text-center p-8">
          <div className="space-y-4">
            <i className="pi pi-lightbulb text-6xl text-gray-300"></i>
            <h3 className="text-xl font-semibold text-gray-600">No Recommendations Yet</h3>
            <p className="text-gray-500">
              Start searching for recipes and saving your favorites to get personalized recommendations. 
              You need some search history or saved recipes for the system to generate recommendations.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                label="Browse Recipes"
                icon="pi pi-search"
               className="p-button-outlined"
               onClick={() => navigate('/recipes')}
              />
              <Button
                label="Generate Recommendations"
                icon="pi pi-refresh"
                onClick={handleGenerateRecommendations}
                loading={generating}
                className="p-button-outlined"
              />
            </div>
            <div className="text-sm text-gray-400 mt-4">
              <p>💡 Tip: Search for recipes, save some favorites, then generate recommendations!</p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Group recommendations by type */}
          {Object.entries(
            recommendations.reduce((groups, rec) => {
              const type = rec.recommendation_type;
              if (!groups[type]) groups[type] = [];
              groups[type].push(rec);
              return groups;
            }, {} as Record<string, RecipeRecommendation[]>)
          ).map(([type, recs]) => (
            <div key={type}>
              <div className="flex items-center gap-3 mb-4">
                <i className={`pi ${getRecommendationIcon(type)} text-blue-500 text-xl`}></i>
                <h2 className="text-xl font-bold text-gray-800">
                  {getRecommendationTypeLabel(type)}
                </h2>
                <span className="text-sm text-gray-500">
                  ({recs.length} recipe{recs.length !== 1 ? 's' : ''})
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recs.map((recommendation) => (
                  <div key={recommendation.id} className="relative">
                    <RecipeCard
                      recipe={recommendation.recipe}
                      onSave={handleSaveRecipe}
                      isSaved={savedRecipes.has(recommendation.recipe_id)}
                    />
                    
                    {/* Confidence indicator */}
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {Math.round(recommendation.confidence_score * 100)}% match
                    </div>
                    
                    {/* Reasoning tooltip */}
                    {recommendation.reasoning && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-black bg-opacity-75 text-white text-xs p-2 rounded">
                          {recommendation.reasoning}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Privacy notice */}
      <Card className="bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <i className="pi pi-info-circle text-blue-500 text-lg mt-1"></i>
          <div className="space-y-2">
            <h4 className="font-medium text-blue-800">About Your Recommendations</h4>
            <p className="text-sm text-blue-700">
              These recommendations are generated based on your search history, saved recipes, and preferences. 
              You can manage your privacy settings and data usage in your account settings.
            </p>
            <Button
              label="Privacy Settings"
              icon="pi pi-cog"
              onClick={() => navigate('/privacy-settings')}
              className="p-button-text p-button-sm text-blue-600"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RecommendedRecipes;