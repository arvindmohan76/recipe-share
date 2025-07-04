/*
  # Complete RecipeHub Database Schema

  1. New Tables
    - `users` - User profiles and authentication data
    - `user_preferences` - User dietary preferences and cooking settings
    - `recipes` - Recipe data with ingredients, steps, and metadata
    - `recipe_ratings` - User ratings for recipes (1-5 stars)
    - `recipe_comments` - Comments and reviews on recipes
    - `saved_recipes` - User's bookmarked/saved recipes
    - `recipe_collections` - User-created recipe collections
    - `shopping_lists` - Generated shopping lists from recipes
    - `user_follows` - User following relationships

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access control
    - Ensure users can only access their own data where appropriate
    - Allow public access to public recipes and comments

  3. Indexes
    - Performance indexes on frequently queried columns
    - Unique constraints for data integrity
    - Foreign key relationships with cascade deletes
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  username text UNIQUE,
  full_name text,
  profile_photo text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  dietary_restrictions text[] DEFAULT '{}',
  favorite_cuisines text[] DEFAULT '{}',
  cooking_habits text[] DEFAULT '{}',
  skill_level text DEFAULT 'beginner',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
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

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Recipe ratings table
CREATE TABLE IF NOT EXISTS recipe_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(recipe_id, user_id)
);

ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;

-- Recipe comments table
CREATE TABLE IF NOT EXISTS recipe_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recipe_comments ENABLE ROW LEVEL SECURITY;

-- Saved recipes table
CREATE TABLE IF NOT EXISTS saved_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- Recipe collections table
CREATE TABLE IF NOT EXISTS recipe_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  recipe_ids uuid[] DEFAULT '{}',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE recipe_collections ENABLE ROW LEVEL SECURITY;

-- Shopping lists table
CREATE TABLE IF NOT EXISTS shopping_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  ingredients jsonb NOT NULL DEFAULT '[]',
  recipe_ids uuid[] DEFAULT '{}',
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;

-- User follows table
CREATE TABLE IF NOT EXISTS user_follows (
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followed_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);

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

-- Row Level Security Policies

-- Users policies
CREATE POLICY "Users can view public profiles" ON users
  FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT TO public WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO public USING (auth.uid() = id);

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL TO public USING (auth.uid() = user_id);

-- Recipes policies
CREATE POLICY "Anyone can view public recipes" ON recipes
  FOR SELECT TO public USING (is_public = true);

CREATE POLICY "Users can view own recipes" ON recipes
  FOR SELECT TO public USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own recipes" ON recipes
  FOR ALL TO public USING (auth.uid() = user_id);

-- Recipe ratings policies
CREATE POLICY "Anyone can view ratings" ON recipe_ratings
  FOR SELECT TO public USING (true);

CREATE POLICY "Users can manage own ratings" ON recipe_ratings
  FOR ALL TO public USING (auth.uid() = user_id);

-- Recipe comments policies
CREATE POLICY "Anyone can view comments" ON recipe_comments
  FOR SELECT TO public USING (true);

CREATE POLICY "Users can manage own comments" ON recipe_comments
  FOR ALL TO public USING (auth.uid() = user_id);

-- Saved recipes policies
CREATE POLICY "Users can manage own saved recipes" ON saved_recipes
  FOR ALL TO public USING (auth.uid() = user_id);

-- Recipe collections policies
CREATE POLICY "Anyone can view public collections" ON recipe_collections
  FOR SELECT TO public USING (is_public = true);

CREATE POLICY "Users can view own collections" ON recipe_collections
  FOR SELECT TO public USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own collections" ON recipe_collections
  FOR ALL TO public USING (auth.uid() = user_id);

-- Shopping lists policies
CREATE POLICY "Users can manage own shopping lists" ON shopping_lists
  FOR ALL TO public USING (auth.uid() = user_id);

-- User follows policies
CREATE POLICY "Anyone can view follows" ON user_follows
  FOR SELECT TO public USING (true);

CREATE POLICY "Users can manage own follows" ON user_follows
  FOR ALL TO public USING (auth.uid() = follower_id);