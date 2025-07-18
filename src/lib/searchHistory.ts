import { supabase } from './supabase';

export interface SearchHistoryEntry {
  id: string;
  user_id: string;
  search_query: string;
  search_type: 'general' | 'ingredient' | 'cuisine' | 'dietary' | 'difficulty' | 'time';
  filters_applied: Record<string, any>;
  results_count: number;
  clicked_recipe_id?: string;
  created_at: string;
}

export interface PrivacySettings {
  user_id: string;
  allow_search_history: boolean;
  allow_personalized_recommendations: boolean;
  allow_analytics: boolean;
  data_retention_days: number;
  created_at: string;
  updated_at: string;
}

export interface RecipeRecommendation {
  id: string;
  user_id: string;
  recipe_id: string;
  recommendation_type: 'search_history' | 'saved_recipes' | 'similar_users' | 'trending' | 'seasonal';
  confidence_score: number;
  reasoning?: string;
  created_at: string;
  recipe?: any; // Will be populated with recipe data
}

/**
 * Get user's privacy settings
 */
export const getUserPrivacySettings = async (userId: string): Promise<PrivacySettings | null> => {
  try {
    const { data, error } = await supabase
      .from('user_privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching privacy settings:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Failed to fetch privacy settings:', err);
    return null;
  }
};

/**
 * Update user's privacy settings
 */
export const updatePrivacySettings = async (
  userId: string, 
  settings: Partial<Omit<PrivacySettings, 'user_id' | 'created_at' | 'updated_at'>>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_privacy_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating privacy settings:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to update privacy settings:', err);
    return false;
  }
};

/**
 * Record a search query (with privacy check)
 */
export const recordSearchQuery = async (
  userId: string,
  searchQuery: string,
  searchType: SearchHistoryEntry['search_type'],
  filtersApplied: Record<string, any>,
  resultsCount: number
): Promise<string | null> => {
  try {
    // Don't record empty or very short queries
    if (!searchQuery || searchQuery.trim().length < 2) {
      return null;
    }

    // Check if user allows search history tracking
    const privacySettings = await getUserPrivacySettings(userId);
    // Default to allowing tracking if no privacy settings exist
    if (privacySettings && privacySettings.allow_search_history === false) {
      return null; // User has opted out
    }

    console.log('Recording search query:', { userId, searchQuery, searchType, resultsCount });

    const { data, error } = await supabase
      .from('user_search_history')
      .insert([{
        user_id: userId,
        search_query: searchQuery.trim(),
        search_type: searchType,
        filters_applied: filtersApplied,
        results_count: resultsCount
      }])
      .select('id')
      .single();

    if (error) {
      console.error('Error recording search query:', error);
      return null;
    }

    console.log('Search query recorded successfully:', data.id);
    return data.id;
  } catch (err) {
    console.error('Failed to record search query:', err);
    return null;
  }
};

/**
 * Record a recipe click from search results
 */
export const recordRecipeClick = async (
  searchHistoryId: string,
  recipeId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_search_history')
      .update({ clicked_recipe_id: recipeId })
      .eq('id', searchHistoryId);

    if (error) {
      console.error('Error recording recipe click:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to record recipe click:', err);
    return false;
  }
};

/**
 * Get user's search history
 */
export const getUserSearchHistory = async (
  userId: string,
  limit: number = 50
): Promise<SearchHistoryEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('user_search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching search history:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch search history:', err);
    return [];
  }
};

/**
 * Get popular search terms (anonymized)
 */
export const getPopularSearchTerms = async (limit: number = 10): Promise<Array<{term: string, count: number}>> => {
  try {
    const { data, error } = await supabase
      .rpc('get_popular_search_terms', { term_limit: limit });

    if (error) {
      console.error('Error fetching popular search terms:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch popular search terms:', err);
    return [];
  }
};

/**
 * Clear user's search history
 */
export const clearSearchHistory = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('user_search_history')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error clearing search history:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to clear search history:', err);
    return false;
  }
};

/**
 * Generate recommendations for a user
 */
export const generateRecommendations = async (userId: string): Promise<boolean> => {
  try {
    console.log('Generating recommendations for user:', userId);
    
    // First check if the function exists and user has data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.error('User not found:', userError);
      return false;
    }
    
    // Check if we have any recipes in the database
    const { data: recipesData, error: recipesError } = await supabase
      .from('recipes')
      .select('id')
      .eq('is_public', true)
      .limit(1);
    
    if (recipesError || !recipesData || recipesData.length === 0) {
      console.error('No public recipes found in database');
      return false;
    }
    
    console.log('Prerequisites check passed, calling recommendation function...');
    
    const { error } = await supabase
      .rpc('generate_search_based_recommendations', { target_user_id: userId });

    if (error) {
      console.error('Error generating recommendations:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      return false;
    }

    console.log('Recommendations generated successfully');
    
    // Verify recommendations were actually created
    const { data: createdRecs, error: checkError } = await supabase
      .from('recipe_recommendations')
      .select('id')
      .eq('user_id', userId);
    
    if (checkError) {
      console.error('Error checking created recommendations:', checkError);
      return false;
    }
    
    console.log(`Created ${createdRecs?.length || 0} recommendations`);
    return true;
  } catch (err) {
    console.error('Failed to generate recommendations:', err);
    return false;
  }
};

/**
 * Get user's personalized recommendations
 */
export const getUserRecommendations = async (
  userId: string,
  limit: number = 10
): Promise<RecipeRecommendation[]> => {
  try {
    console.log('Fetching recommendations for user:', userId, 'limit:', limit);
    
    const { data, error } = await supabase
      .from('recipe_recommendations')
      .select(`
        *,
        recipes(*)
      `)
      .eq('user_id', userId)
      .order('confidence_score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recommendations:', error);
      return [];
    }

    console.log('Raw recommendation data:', data);
    
    // Transform the data to match our interface
    const recommendations = (data || []).map(item => ({
      ...item,
      recipe: item.recipes
    }));
    
    console.log('Transformed recommendations:', recommendations);
    return recommendations;
  } catch (err) {
    console.error('Failed to fetch recommendations:', err);
    return [];
  }
};

/**
 * Get search suggestions based on user's history
 */
export const getSearchSuggestions = async (
  userId: string,
  currentQuery: string,
  limit: number = 5
): Promise<string[]> => {
  try {
    if (currentQuery.length < 2) return [];

    const { data, error } = await supabase
      .from('user_search_history')
      .select('search_query')
      .eq('user_id', userId)
      .ilike('search_query', `%${currentQuery}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching search suggestions:', error);
      return [];
    }

    // Remove duplicates and return unique suggestions
    const suggestions = [...new Set(data?.map(item => item.search_query) || [])];
    return suggestions.slice(0, limit);
  } catch (err) {
    console.error('Failed to fetch search suggestions:', err);
    return [];
  }
};

/**
 * Get analytics data for user (if they've consented)
 */
export const getUserAnalytics = async (userId: string): Promise<{
  totalSearches: number;
  topSearchTerms: Array<{term: string, count: number}>;
  searchTrends: Array<{date: string, count: number}>;
  clickThroughRate: number;
} | null> => {
  try {
    // Check if user allows analytics
    const privacySettings = await getUserPrivacySettings(userId);
    if (!privacySettings?.allow_analytics) {
      return null;
    }

    const { data, error } = await supabase
      .rpc('get_user_search_analytics', { target_user_id: userId });

    if (error) {
      console.error('Error fetching user analytics:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Failed to fetch user analytics:', err);
    return null;
  }
};