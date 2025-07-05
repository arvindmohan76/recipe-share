import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { useAuth } from '../../context/AuthContext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useNavigate } from 'react-router-dom';
import {
  getUserRecommendations,
  generateRecommendations,
  RecipeRecommendation
} from '../../lib/searchHistory';
import RecipeCard from './RecipeCard';
import { supabase } from '../../lib/supabase';
import { generateAIRecommendations } from '../../lib/openai';

const RecommendedRecipes: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecipeRecommendation[]>([]);
  const [recipeEngagement, setRecipeEngagement] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadRecommendations();
      fetchSavedRecipes();
    }
  }, [user]);

  useEffect(() => {
    if (recommendations.length > 0) {
      fetchRecipeEngagement();
    }
  }, [recommendations]);

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

  const fetchRecipeEngagement = async () => {
    try {
      const recipeIds = recommendations.map(r => r.recipe_id);
      
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
        recommendations.forEach(rec => {
          engagementMap.set(rec.recipe_id, {
            bookmarkCount: bookmarkCounts[rec.recipe_id] || 0,
            commentCount: commentCounts[rec.recipe_id] || 0
          });
        });

        setRecipeEngagement(engagementMap);
      }
    } catch (err) {
      console.error('Failed to fetch recipe engagement:', err);
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

  const handleGenerateAIRecommendations = async () => {
    if (!user) return;
    
    setGeneratingAI(true);
    setAiError('');
    
    try {
      // Check if OpenAI is available
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
      }
      
      // Fetch user's search history
      const { data: searchHistory, error: searchError } = await supabase
        .from('user_search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (searchError) throw searchError;
      
      // Fetch user's saved recipes
      const { data: savedRecipesData, error: savedError } = await supabase
        .from('saved_recipes')
        .select('recipes(*)')
        .eq('user_id', user.id);
      
      if (savedError) throw savedError;
      
      const savedRecipesList = savedRecipesData
        .map(item => item.recipes)
        .filter(Boolean);
      
      // Fetch available recipes (that the user hasn't saved)
      const { data: availableRecipes, error: availableError } = await supabase
        .from('recipes')
        .select('*')
        .eq('is_public', true)
        .limit(50);
      
      if (availableError) throw availableError;
      
      // Filter out recipes the user has already saved
      const savedIds = new Set(savedRecipesList.map((r: any) => r.id));
      const filteredAvailableRecipes = availableRecipes.filter(recipe => 
        !savedIds.has(recipe.id)
      );
      
      if (!filteredAvailableRecipes || filteredAvailableRecipes.length === 0) {
        throw new Error('No available recipes to recommend');
      }
      
      // Prepare user preferences for AI
      const userPreferences = {
        searchHistory,
        savedRecipes: savedRecipesList,
        viewedRecipes: [] // Could add view history if tracked
      };
      
      // Generate AI recommendations
      const aiRecommendations = await generateAIRecommendations(
        userPreferences,
        filteredAvailableRecipes
      );
      
      if (!aiRecommendations || aiRecommendations.length === 0) {
        setAiError('No AI recommendations could be generated. This might be due to limited user data or API limitations. Try browsing and saving more recipes first.');
        return;
      }
      
      // Clear existing recommendations
      await supabase
        .from('recipe_recommendations')
        .delete()
        .eq('user_id', user.id)
        .eq('recommendation_type', 'in', '(ai_personalized,ai_dietary,ai_cuisine)');
      
      // Insert AI recommendations into database
      const recommendationsToInsert = aiRecommendations.map(rec => ({
        user_id: user.id,
        recipe_id: rec.recipe_id,
        recommendation_type: rec.recommendation_type,
        confidence_score: rec.confidence_score,
        reasoning: rec.reasoning,
        created_at: new Date().toISOString()
      }));
      
      const { error: insertError } = await supabase
        .from('recipe_recommendations')
        .insert(recommendationsToInsert);
      
      if (insertError) throw insertError;
      
      // Reload recommendations
      await loadRecommendations();
      
    } catch (err: any) {
      console.error('Error generating AI recommendations:', err);
      if (err.message?.includes('API key')) {
        setAiError('OpenAI API key is not configured. Please check your environment variables and restart the development server.');
      } else if (err.message?.includes('No available recipes')) {
        setAiError('No recipes available for recommendations. Please add some public recipes first.');
      } else {
        setAiError(err.message || 'Could not generate AI recommendations');
      }
    } finally {
      setGeneratingAI(false);
    }
  };
        .limit(50);
      
      if (availableError) throw availableError;
      
      if (!availableRecipes || availableRecipes.length === 0) {
        throw new Error('No available recipes to recommend');
      }
      
      // Prepare user preferences for AI
      const userPreferences = {
        searchHistory,
        savedRecipes: savedRecipesList,
        viewedRecipes: [] // Could add view history if tracked
      };
      
      // Generate AI recommendations
      const aiRecommendations = await generateAIRecommendations(
        userPreferences,
        availableRecipes
      );
      
      if (aiRecommendations.length === 0) {
        setAiError('No AI recommendations could be generated. This might be due to limited user data or API limitations. Try browsing and saving more recipes first.');
        return;
      }
      
      // Clear existing recommendations
      await supabase
        .from('recipe_recommendations')
        .delete()
        .eq('user_id', user.id);
      
      // Insert AI recommendations into database
      const recommendationsToInsert = aiRecommendations.map(rec => ({
        user_id: user.id,
        recipe_id: rec.recipe_id,
        recommendation_type: rec.recommendation_type,
        confidence_score: rec.confidence_score,
        reasoning: rec.reasoning,
        created_at: new Date().toISOString()
      }));
      
      const { error: insertError } = await supabase
        .from('recipe_recommendations')
        .insert(recommendationsToInsert);
      
      if (insertError) throw insertError;
      
      // Reload recommendations
      await loadRecommendations();
      
    } catch (err: any) {
      console.error('Error generating AI recommendations:', err);
      if (err.message?.includes('API key')) {
        setAiError('OpenAI API key is not configured. Please check your environment variables and restart the development server.');
      } else if (err.message?.includes('No available recipes')) {
        setAiError('No recipes available for recommendations. Please add some public recipes first.');
      } else {
        setAiError(err.message || 'Failed to generate AI recommendations. Please try again later.');
      }
    } finally {
      setGeneratingAI(false);
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Recommended for You</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Personalized recipe suggestions based on your preferences and activity
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            label="Generate AI Recommendations"
            icon="pi pi-bolt"
            onClick={handleGenerateAIRecommendations}
            loading={generatingAI}
            className="p-button-outlined p-button-info"
          />
        </div>
        <Button
          label="Refresh Recommendations"
          icon="pi pi-refresh"
          onClick={handleGenerateRecommendations}
          loading={generating}
          className="p-button-outlined"
        />
      </div>

      {/* AI Recommendation Status */}
      {generatingAI && (
        <Card className="mb-6">
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <ProgressSpinner style={{width: '50px', height: '50px'}} className="mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Generating AI Recommendations</h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-lg">
              Our AI is analyzing your preferences, search history, and saved recipes to create personalized recommendations just for you. This may take a moment...
            </p>
          </div>
        </Card>
      )}
      
      {/* AI Error Message */}
      {aiError && (
        <Message 
          severity="error" 
          text={aiError}
          className="w-full mb-6"
        />
      )}

      {recommendations.length === 0 ? (
        <Card className="text-center p-8">
          <div className="space-y-4">
            <i className="pi pi-lightbulb text-6xl text-gray-300"></i>
            <h3 className="text-xl font-semibold text-gray-600">No Recommendations Yet</h3>
            <p className="text-gray-500">
              Start searching for recipes and saving your favorites to get personalized recommendations. 
              You need some search history or saved recipes for the system to generate recommendations.
              You can also try our AI-powered recommendations for more personalized suggestions.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                label="Browse"
                icon="pi pi-search"
               className="p-button-outlined"
               onClick={() => navigate('/recipes')}
              />
              <Button
                label="Generate AI Recommendations"
                icon="pi pi-bolt"
                onClick={handleGenerateAIRecommendations}
                loading={generatingAI}
                className="p-button-outlined p-button-info"
              />
              <Button
                label="Generate"
                icon="pi pi-refresh"
                onClick={handleGenerateRecommendations}
                loading={generating}
                className="p-button-outlined"
              />
            </div>
            <div className="text-sm text-gray-400 mt-4">
              <p>💡 Tip: Search for recipes, save some favorites, then generate recommendations!</p>
              <p className="mt-2">✨ Try our new AI-powered recommendations for even better personalization!</p>
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
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {getRecommendationTypeLabel(type)}
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({recs.length} recipe{recs.length !== 1 ? 's' : ''})
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {recs.map((recommendation) => (
                  <div key={recommendation.id} className="relative">
                    {(() => {
                      const engagement = recipeEngagement.get(recommendation.recipe_id) || { bookmarkCount: 0, commentCount: 0 };
                      return (
                        <div className="h-full">
                          <RecipeCard
                            recipe={recommendation.recipe}
                            onSave={handleSaveRecipe}
                            isSaved={savedRecipes.has(recommendation.recipe_id)}
                            bookmarkCount={engagement.bookmarkCount}
                            commentCount={engagement.commentCount}
                          />
                        </div>
                      );
                    })()}
                    
                    {/* Confidence indicator */}
                    <div className="absolute top-2 left-2 bg-blue-500 dark:bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      {Math.round(recommendation.confidence_score * 100)}% match
                    </div>
                    
                    {/* Reasoning tooltip */}
                    {recommendation.reasoning && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="bg-black dark:bg-gray-900 bg-opacity-75 text-white text-xs p-2 rounded">
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
      <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
        <div className="flex items-start gap-3">
          <i className="pi pi-info-circle text-blue-500 dark:text-blue-400 text-lg mt-1"></i>
          <div className="space-y-2 flex-1">
            <h4 className="font-medium text-blue-800 dark:text-blue-200">About Your Recommendations</h4>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Standard Recommendations:</strong> Generated based on your search history, saved recipes, and preferences.
                </p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>AI Recommendations:</strong> Uses advanced AI to analyze your preferences and suggest recipes you might enjoy.
                </p>
              </div>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              You can manage your privacy settings and data usage in your account settings.
            </p>
            <Button
              label="Privacy Settings"
              icon="pi pi-cog"
              onClick={() => navigate('/privacy-settings')}
              className="p-button-text p-button-sm text-blue-600 dark:text-blue-400"
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RecommendedRecipes;