/*
  # Recipe Application Database Schema

  1. New Tables
    - `users` - User profiles and preferences
    - `recipes` - Recipe data with ingredients, steps, and metadata
    - `user_preferences` - User dietary preferences and cooking habits
    - `recipe_ratings` - User ratings for recipes
    - `recipe_comments` - Comments on recipes
    - `saved_recipes` - User's saved/bookmarked recipes
    - `recipe_collections` - User-created recipe collections
    - `shopping_lists` - Generated shopping lists
    - `user_follows` - User following relationships

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Public read access for recipes with proper filtering

  3. Indexes
    - Add indexes for better query performance on commonly searched fields
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
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

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  ingredients jsonb NOT NULL DEFAULT '[]',
  steps jsonb NOT NULL DEFAULT '[]',
  cuisine text,
  dietary_tags text[] DEFAULT '{}',
  cooking_time integer, -- in minutes
  prep_time integer, -- in minutes
  difficulty text DEFAULT 'easy',
  servings integer DEFAULT 1,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  image_url text,
  is_public boolean DEFAULT true,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Recipe ratings table
CREATE TABLE IF NOT EXISTS recipe_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(recipe_id, user_id)
);

-- Recipe comments table
CREATE TABLE IF NOT EXISTS recipe_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Saved recipes table
CREATE TABLE IF NOT EXISTS saved_recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

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

-- User follows table
CREATE TABLE IF NOT EXISTS user_follows (
  follower_id uuid REFERENCES users(id) ON DELETE CASCADE,
  followed_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

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

-- RLS Policies for users
CREATE POLICY "Users can view public profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for user_preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for recipes
CREATE POLICY "Anyone can view public recipes" ON recipes FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own recipes" ON recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own recipes" ON recipes FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for recipe_ratings
CREATE POLICY "Anyone can view ratings" ON recipe_ratings FOR SELECT USING (true);
CREATE POLICY "Users can manage own ratings" ON recipe_ratings FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for recipe_comments
CREATE POLICY "Anyone can view comments" ON recipe_comments FOR SELECT USING (true);
CREATE POLICY "Users can manage own comments" ON recipe_comments FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for saved_recipes
CREATE POLICY "Users can manage own saved recipes" ON saved_recipes FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for recipe_collections
CREATE POLICY "Anyone can view public collections" ON recipe_collections FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own collections" ON recipe_collections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own collections" ON recipe_collections FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for shopping_lists
CREATE POLICY "Users can manage own shopping lists" ON shopping_lists FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user_follows
CREATE POLICY "Anyone can view follows" ON user_follows FOR SELECT USING (true);
CREATE POLICY "Users can manage own follows" ON user_follows FOR ALL USING (auth.uid() = follower_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);
CREATE INDEX IF NOT EXISTS idx_recipes_cooking_time ON recipes(cooking_time);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_comments_recipe_id ON recipe_comments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_id ON saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_followed_id ON user_follows(followed_id);

-- Insert sample data
INSERT INTO users (id, email, username, full_name, bio) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'chef@example.com', 'masterchef', 'Master Chef', 'Professional chef with 20 years of experience'),
  ('550e8400-e29b-41d4-a716-446655440001', 'home@example.com', 'homecook', 'Home Cook', 'Passionate about healthy home cooking')
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_preferences (user_id, dietary_restrictions, favorite_cuisines, cooking_habits, skill_level) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', '{}', '{"Italian", "French", "Asian"}', '{"Professional", "Innovative"}', 'advanced'),
  ('550e8400-e29b-41d4-a716-446655440001', '{"vegetarian"}', '{"Mediterranean", "Asian"}', '{"Quick meals", "Healthy"}', 'intermediate')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO recipes (id, title, description, ingredients, steps, cuisine, dietary_tags, cooking_time, prep_time, difficulty, servings, user_id, is_public) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440000',
    'Classic Margherita Pizza',
    'A traditional Italian pizza with fresh tomatoes, mozzarella, and basil',
    '[{"name": "Pizza dough", "amount": "1", "unit": "ball"}, {"name": "San Marzano tomatoes", "amount": "400", "unit": "g"}, {"name": "Fresh mozzarella", "amount": "200", "unit": "g"}, {"name": "Fresh basil", "amount": "10", "unit": "leaves"}, {"name": "Extra virgin olive oil", "amount": "2", "unit": "tbsp"}, {"name": "Salt", "amount": "1", "unit": "tsp"}]',
    '[{"step": 1, "instruction": "Preheat oven to 475°F (245°C)", "tips": "Make sure your oven is fully preheated for best results"}, {"step": 2, "instruction": "Roll out pizza dough on floured surface", "tips": "Don\'t over-work the dough to keep it light and airy"}, {"step": 3, "instruction": "Spread tomato sauce evenly", "tips": "Leave a border for the crust"}, {"step": 4, "instruction": "Add torn mozzarella pieces", "tips": "Tear by hand for better melting"}, {"step": 5, "instruction": "Bake for 12-15 minutes until golden", "tips": "Watch for bubbling cheese and golden crust"}, {"step": 6, "instruction": "Add fresh basil and drizzle with olive oil", "tips": "Add basil after baking to preserve its flavor"}]',
    'Italian',
    '{"vegetarian"}',
    25,
    15,
    'intermediate',
    2,
    '550e8400-e29b-41d4-a716-446655440000',
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'Healthy Buddha Bowl',
    'A nutritious bowl packed with quinoa, roasted vegetables, and tahini dressing',
    '[{"name": "Quinoa", "amount": "1", "unit": "cup"}, {"name": "Sweet potato", "amount": "1", "unit": "large"}, {"name": "Broccoli", "amount": "2", "unit": "cups"}, {"name": "Chickpeas", "amount": "1", "unit": "can"}, {"name": "Avocado", "amount": "1", "unit": "piece"}, {"name": "Tahini", "amount": "3", "unit": "tbsp"}, {"name": "Lemon juice", "amount": "2", "unit": "tbsp"}, {"name": "Olive oil", "amount": "2", "unit": "tbsp"}]',
    '[{"step": 1, "instruction": "Cook quinoa according to package directions", "tips": "Rinse quinoa before cooking to remove bitterness"}, {"step": 2, "instruction": "Roast sweet potato cubes at 400°F for 25 minutes", "tips": "Cut evenly for uniform cooking"}, {"step": 3, "instruction": "Steam broccoli until tender", "tips": "Don\'t overcook to maintain nutrients"}, {"step": 4, "instruction": "Drain and rinse chickpeas", "tips": "Pat dry for better roasting if desired"}, {"step": 5, "instruction": "Make tahini dressing by whisking tahini, lemon juice, and water", "tips": "Add water gradually until desired consistency"}, {"step": 6, "instruction": "Assemble bowl with quinoa, vegetables, and dressing", "tips": "Arrange colorfully for visual appeal"}]',
    'Mediterranean',
    '{"vegan", "gluten-free", "healthy"}',
    35,
    15,
    'easy',
    2,
    '550e8400-e29b-41d4-a716-446655440001',
    true
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO recipe_ratings (recipe_id, user_id, rating) VALUES
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 5),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 4)
ON CONFLICT (recipe_id, user_id) DO NOTHING;