/*
  # Complete Recipe Database Schema

  1. New Tables
    - `users` - User profiles and authentication data
    - `user_preferences` - User dietary preferences and cooking settings
    - `recipes` - Recipe data with ingredients and instructions
    - `recipe_ratings` - User ratings for recipes (1-5 stars)
    - `recipe_comments` - Comments on recipes
    - `saved_recipes` - User's bookmarked recipes
    - `recipe_collections` - User-created recipe collections
    - `shopping_lists` - Generated shopping lists from recipes
    - `user_follows` - User following relationships

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Allow public access to view public recipes and comments

  3. Performance
    - Add indexes for frequently queried columns
    - Optimize for recipe browsing and user interactions
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
    CREATE TABLE users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text UNIQUE NOT NULL,
      username text UNIQUE,
      full_name text,
      profile_photo text,
      bio text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- User preferences table
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
    CREATE TABLE user_preferences (
      user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      dietary_restrictions text[] DEFAULT '{}',
      favorite_cuisines text[] DEFAULT '{}',
      cooking_habits text[] DEFAULT '{}',
      skill_level text DEFAULT 'beginner',
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Recipes table
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recipes') THEN
    CREATE TABLE recipes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      description text,
      ingredients jsonb NOT NULL DEFAULT '[]',
      steps jsonb NOT NULL DEFAULT '[]',
      cuisine text,
      dietary_tags text[] DEFAULT '{}',
      cooking_time integer,
      prep_time integer,
      difficulty text DEFAULT 'easy',
      servings integer DEFAULT 1,
      user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      image_url text,
      is_public boolean DEFAULT true,
      view_count integer DEFAULT 0,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Recipe ratings table
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recipe_ratings') THEN
    CREATE TABLE recipe_ratings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
      user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      rating integer CHECK (rating >= 1 AND rating <= 5),
      created_at timestamptz DEFAULT now(),
      UNIQUE(recipe_id, user_id)
    );
  END IF;
END $$;

-- Recipe comments table
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recipe_comments') THEN
    CREATE TABLE recipe_comments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
      user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      comment text NOT NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Saved recipes table
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saved_recipes') THEN
    CREATE TABLE saved_recipes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now(),
      UNIQUE(user_id, recipe_id)
    );
  END IF;
END $$;

-- Recipe collections table
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recipe_collections') THEN
    CREATE TABLE recipe_collections (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      name text NOT NULL,
      description text,
      recipe_ids uuid[] DEFAULT '{}',
      is_public boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Shopping lists table
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shopping_lists') THEN
    CREATE TABLE shopping_lists (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES users(id) ON DELETE CASCADE,
      name text NOT NULL,
      ingredients jsonb NOT NULL DEFAULT '[]',
      recipe_ids uuid[] DEFAULT '{}',
      is_completed boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- User follows table
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_follows') THEN
    CREATE TABLE user_follows (
      follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      followed_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now(),
      PRIMARY KEY (follower_id, followed_id),
      CHECK (follower_id <> followed_id)
    );
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_cooking_time ON recipes(cooking_time);

CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_comments_recipe_id ON recipe_comments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_id ON saved_recipes(user_id);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_followed_id ON user_follows(followed_id);

-- Row Level Security Policies (with conflict handling)

-- Users policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can view public profiles'
  ) THEN
    CREATE POLICY "Users can view public profiles" ON users
      FOR SELECT TO public USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON users
      FOR INSERT TO public WITH CHECK (auth.uid() = id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON users
      FOR UPDATE TO public USING (auth.uid() = id);
  END IF;
END $$;

-- User preferences policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_preferences' AND policyname = 'Users can manage own preferences'
  ) THEN
    CREATE POLICY "Users can manage own preferences" ON user_preferences
      FOR ALL TO public USING (auth.uid() = user_id);
  END IF;
END $$;

-- Recipes policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recipes' AND policyname = 'Anyone can view public recipes'
  ) THEN
    CREATE POLICY "Anyone can view public recipes" ON recipes
      FOR SELECT TO public USING (is_public = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recipes' AND policyname = 'Users can view own recipes'
  ) THEN
    CREATE POLICY "Users can view own recipes" ON recipes
      FOR SELECT TO public USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recipes' AND policyname = 'Users can manage own recipes'
  ) THEN
    CREATE POLICY "Users can manage own recipes" ON recipes
      FOR ALL TO public USING (auth.uid() = user_id);
  END IF;
END $$;

-- Recipe ratings policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recipe_ratings' AND policyname = 'Anyone can view ratings'
  ) THEN
    CREATE POLICY "Anyone can view ratings" ON recipe_ratings
      FOR SELECT TO public USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recipe_ratings' AND policyname = 'Users can manage own ratings'
  ) THEN
    CREATE POLICY "Users can manage own ratings" ON recipe_ratings
      FOR ALL TO public USING (auth.uid() = user_id);
  END IF;
END $$;

-- Recipe comments policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recipe_comments' AND policyname = 'Anyone can view comments'
  ) THEN
    CREATE POLICY "Anyone can view comments" ON recipe_comments
      FOR SELECT TO public USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recipe_comments' AND policyname = 'Users can manage own comments'
  ) THEN
    CREATE POLICY "Users can manage own comments" ON recipe_comments
      FOR ALL TO public USING (auth.uid() = user_id);
  END IF;
END $$;

-- Saved recipes policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'saved_recipes' AND policyname = 'Users can manage own saved recipes'
  ) THEN
    CREATE POLICY "Users can manage own saved recipes" ON saved_recipes
      FOR ALL TO public USING (auth.uid() = user_id);
  END IF;
END $$;

-- Recipe collections policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recipe_collections' AND policyname = 'Anyone can view public collections'
  ) THEN
    CREATE POLICY "Anyone can view public collections" ON recipe_collections
      FOR SELECT TO public USING (is_public = true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recipe_collections' AND policyname = 'Users can view own collections'
  ) THEN
    CREATE POLICY "Users can view own collections" ON recipe_collections
      FOR SELECT TO public USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'recipe_collections' AND policyname = 'Users can manage own collections'
  ) THEN
    CREATE POLICY "Users can manage own collections" ON recipe_collections
      FOR ALL TO public USING (auth.uid() = user_id);
  END IF;
END $$;

-- Shopping lists policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopping_lists' AND policyname = 'Users can manage own shopping lists'
  ) THEN
    CREATE POLICY "Users can manage own shopping lists" ON shopping_lists
      FOR ALL TO public USING (auth.uid() = user_id);
  END IF;
END $$;

-- User follows policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_follows' AND policyname = 'Anyone can view follows'
  ) THEN
    CREATE POLICY "Anyone can view follows" ON user_follows
      FOR SELECT TO public USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_follows' AND policyname = 'Users can manage own follows'
  ) THEN
    CREATE POLICY "Users can manage own follows" ON user_follows
      FOR ALL TO public USING (auth.uid() = follower_id);
  END IF;
END $$;