/*
  # Create comprehensive recipe application schema

  1. New Tables
    - `users` - User profiles extending Supabase auth
    - `user_preferences` - User dietary preferences and cooking habits
    - `recipes` - Recipe data with ingredients and instructions
    - `recipe_ratings` - User ratings for recipes
    - `recipe_comments` - Comments on recipes
    - `saved_recipes` - User's bookmarked recipes
    - `recipe_collections` - User-created recipe collections
    - `shopping_lists` - Generated shopping lists
    - `user_follows` - User following relationships

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Allow public read access to public recipes and comments

  3. Performance
    - Add indexes for frequently queried columns
    - Optimize for search and filtering operations

  4. Sample Data
    - Insert sample users, recipes, and ratings for testing
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

-- Insert sample recipes using proper JSON escaping
INSERT INTO recipes (id, title, description, ingredients, steps, cuisine, dietary_tags, cooking_time, prep_time, difficulty, servings, user_id, is_public) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440000',
    'Classic Margherita Pizza',
    'A traditional Italian pizza with fresh tomatoes, mozzarella, and basil',
    '[
      {"name": "Pizza dough", "amount": "1", "unit": "ball"},
      {"name": "San Marzano tomatoes", "amount": "400", "unit": "g"},
      {"name": "Fresh mozzarella", "amount": "200", "unit": "g"},
      {"name": "Fresh basil", "amount": "10", "unit": "leaves"},
      {"name": "Extra virgin olive oil", "amount": "2", "unit": "tbsp"},
      {"name": "Salt", "amount": "1", "unit": "tsp"}
    ]'::jsonb,
    '[
      {"step": 1, "instruction": "Preheat oven to 475°F (245°C)", "tips": "Make sure your oven is fully preheated for best results"},
      {"step": 2, "instruction": "Roll out pizza dough on floured surface", "tips": "Do not over-work the dough to keep it light and airy"},
      {"step": 3, "instruction": "Spread tomato sauce evenly", "tips": "Leave a border for the crust"},
      {"step": 4, "instruction": "Add torn mozzarella pieces", "tips": "Tear by hand for better melting"},
      {"step": 5, "instruction": "Bake for 12-15 minutes until golden", "tips": "Watch for bubbling cheese and golden crust"},
      {"step": 6, "instruction": "Add fresh basil and drizzle with olive oil", "tips": "Add basil after baking to preserve its flavor"}
    ]'::jsonb,
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
    '[
      {"name": "Quinoa", "amount": "1", "unit": "cup"},
      {"name": "Sweet potato", "amount": "1", "unit": "large"},
      {"name": "Broccoli", "amount": "2", "unit": "cups"},
      {"name": "Chickpeas", "amount": "1", "unit": "can"},
      {"name": "Avocado", "amount": "1", "unit": "piece"},
      {"name": "Tahini", "amount": "3", "unit": "tbsp"},
      {"name": "Lemon juice", "amount": "2", "unit": "tbsp"},
      {"name": "Olive oil", "amount": "2", "unit": "tbsp"}
    ]'::jsonb,
    '[
      {"step": 1, "instruction": "Cook quinoa according to package directions", "tips": "Rinse quinoa before cooking to remove bitterness"},
      {"step": 2, "instruction": "Roast sweet potato cubes at 400°F for 25 minutes", "tips": "Cut evenly for uniform cooking"},
      {"step": 3, "instruction": "Steam broccoli until tender", "tips": "Do not overcook to maintain nutrients"},
      {"step": 4, "instruction": "Drain and rinse chickpeas", "tips": "Pat dry for better roasting if desired"},
      {"step": 5, "instruction": "Make tahini dressing by whisking tahini, lemon juice, and water", "tips": "Add water gradually until desired consistency"},
      {"step": 6, "instruction": "Assemble bowl with quinoa, vegetables, and dressing", "tips": "Arrange colorfully for visual appeal"}
    ]'::jsonb,
    'Mediterranean',
    '{"vegan", "gluten-free", "healthy"}',
    35,
    15,
    'easy',
    2,
    '550e8400-e29b-41d4-a716-446655440001',
    true
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    'Spicy Thai Green Curry',
    'Aromatic and spicy Thai curry with coconut milk and fresh vegetables',
    '[
      {"name": "Green curry paste", "amount": "3", "unit": "tbsp"},
      {"name": "Coconut milk", "amount": "400", "unit": "ml"},
      {"name": "Chicken breast", "amount": "500", "unit": "g"},
      {"name": "Thai eggplant", "amount": "2", "unit": "cups"},
      {"name": "Thai basil", "amount": "1", "unit": "bunch"},
      {"name": "Fish sauce", "amount": "2", "unit": "tbsp"},
      {"name": "Palm sugar", "amount": "1", "unit": "tbsp"},
      {"name": "Lime leaves", "amount": "4", "unit": "leaves"}
    ]'::jsonb,
    '[
      {"step": 1, "instruction": "Heat coconut cream in a wok over medium heat", "tips": "Use the thick cream from the top of the can"},
      {"step": 2, "instruction": "Add curry paste and fry until fragrant", "tips": "This releases the essential oils and flavors"},
      {"step": 3, "instruction": "Add chicken and cook until white", "tips": "Cut chicken into bite-sized pieces for even cooking"},
      {"step": 4, "instruction": "Pour in remaining coconut milk", "tips": "Add gradually to prevent curdling"},
      {"step": 5, "instruction": "Add eggplant and simmer for 10 minutes", "tips": "Thai eggplant should be tender but not mushy"},
      {"step": 6, "instruction": "Season with fish sauce and palm sugar", "tips": "Balance salty, sweet, and spicy flavors"},
      {"step": 7, "instruction": "Garnish with Thai basil and lime leaves", "tips": "Add herbs at the end to preserve their aroma"}
    ]'::jsonb,
    'Thai',
    '{"gluten-free", "dairy-free"}',
    30,
    20,
    'medium',
    4,
    '550e8400-e29b-41d4-a716-446655440000',
    true
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO recipe_ratings (recipe_id, user_id, rating) VALUES
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 5),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 4),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 5)
ON CONFLICT (recipe_id, user_id) DO NOTHING;

INSERT INTO recipe_comments (recipe_id, user_id, comment) VALUES
  ('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'Amazing pizza! The crust was perfectly crispy and the flavors were authentic.'),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'Such a healthy and delicious meal. The tahini dressing really makes it special.'),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Perfect level of spice! This tastes just like the curry from my favorite Thai restaurant.')
ON CONFLICT DO NOTHING;