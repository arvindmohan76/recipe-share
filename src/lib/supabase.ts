import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Handle auth state changes and clear invalid tokens
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  } else if (event === 'SIGNED_OUT') {
    // Clear any stale data from local storage
    localStorage.removeItem('supabase.auth.token');
  }
});

// Add error handling for token refresh failures
const originalRequest = supabase.auth.getSession;
supabase.auth.getSession = async function() {
  try {
    return await originalRequest.call(this);
  } catch (error: any) {
    if (error?.message?.includes('refresh_token_not_found') || 
        error?.message?.includes('Invalid Refresh Token')) {
      // Clear invalid session and sign out
      await supabase.auth.signOut();
      console.warn('Invalid refresh token detected, user signed out');
    }
    throw error;
  }
};

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Types for our database
export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
  }>;
  steps: Array<{
    step: number;
    instruction: string;
    tips?: string;
  }>;
  cuisine: string;
  dietary_tags: string[];
  cooking_time: number;
  prep_time: number;
  difficulty: string;
  servings: number;
  user_id: string;
  image_url?: string;
  is_public: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  profile_photo?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  dietary_restrictions: string[];
  favorite_cuisines: string[];
  cooking_habits: string[];
  skill_level: string;
}

export interface RecipeRating {
  id: string;
  recipe_id: string;
  user_id: string;
  rating: number;
  created_at: string;
}

export interface RecipeComment {
  id: string;
  recipe_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface SavedRecipe {
  id: string;
  user_id: string;
  recipe_id: string;
  created_at: string;
  recipe?: Recipe;
}

export interface RecipeCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  recipe_ids: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit: string;
    checked?: boolean;
  }>;
  recipe_ids: string[];
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}