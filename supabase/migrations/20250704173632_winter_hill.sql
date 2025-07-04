/*
  # Search History and Privacy Implementation

  1. New Tables
    - `user_search_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `search_query` (text, the search term)
      - `search_type` (text, type of search: general, ingredient, cuisine, etc.)
      - `filters_applied` (jsonb, filters used in search)
      - `results_count` (integer, number of results returned)
      - `clicked_recipe_id` (uuid, recipe clicked from results)
      - `created_at` (timestamp)

    - `user_privacy_settings`
      - `user_id` (uuid, primary key, foreign key to users)
      - `allow_search_history` (boolean, consent for search tracking)
      - `allow_personalized_recommendations` (boolean, consent for recommendations)
      - `data_retention_days` (integer, how long to keep data)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `recipe_recommendations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `recipe_id` (uuid, foreign key to recipes)
      - `recommendation_type` (text, based on: search_history, saved_recipes, etc.)
      - `confidence_score` (decimal, how confident the recommendation is)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add policies for users to manage their own data
    - Add policies for privacy compliance

  3. Indexes
    - Performance indexes for search queries
    - Indexes for recommendation queries
*/

-- Create user_search_history table
CREATE TABLE IF NOT EXISTS user_search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  search_query text NOT NULL,
  search_type text DEFAULT 'general' CHECK (search_type IN ('general', 'ingredient', 'cuisine', 'dietary', 'difficulty', 'time')),
  filters_applied jsonb DEFAULT '{}',
  results_count integer DEFAULT 0,
  clicked_recipe_id uuid REFERENCES recipes(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_privacy_settings table
CREATE TABLE IF NOT EXISTS user_privacy_settings (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  allow_search_history boolean DEFAULT true,
  allow_personalized_recommendations boolean DEFAULT true,
  allow_analytics boolean DEFAULT false,
  data_retention_days integer DEFAULT 365 CHECK (data_retention_days > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create recipe_recommendations table
CREATE TABLE IF NOT EXISTS recipe_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  recommendation_type text DEFAULT 'search_history' CHECK (
    recommendation_type IN ('search_history', 'saved_recipes', 'similar_users', 'trending', 'seasonal')
  ),
  confidence_score decimal(3,2) DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  reasoning text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recipe_id, recommendation_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_search_history_user_id ON user_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_history_created_at ON user_search_history(created_at);
CREATE INDEX IF NOT EXISTS idx_user_search_history_search_type ON user_search_history(search_type);
CREATE INDEX IF NOT EXISTS idx_user_search_history_query ON user_search_history USING gin(to_tsvector('english', search_query));

CREATE INDEX IF NOT EXISTS idx_recipe_recommendations_user_id ON recipe_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_recommendations_confidence ON recipe_recommendations(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_recipe_recommendations_created_at ON recipe_recommendations(created_at DESC);

-- Enable RLS
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_search_history
CREATE POLICY "Users can manage own search history"
  ON user_search_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_privacy_settings
CREATE POLICY "Users can manage own privacy settings"
  ON user_privacy_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for recipe_recommendations
CREATE POLICY "Users can view own recommendations"
  ON recipe_recommendations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage recommendations"
  ON recipe_recommendations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to clean up old search history based on user preferences
CREATE OR REPLACE FUNCTION cleanup_old_search_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM user_search_history 
  WHERE created_at < (
    SELECT CURRENT_TIMESTAMP - INTERVAL '1 day' * COALESCE(ups.data_retention_days, 365)
    FROM user_privacy_settings ups 
    WHERE ups.user_id = user_search_history.user_id
  );
END;
$$;

-- Function to generate recommendations based on search history
CREATE OR REPLACE FUNCTION generate_search_based_recommendations(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_allows_recommendations boolean;
BEGIN
  -- Check if user allows recommendations
  SELECT allow_personalized_recommendations INTO user_allows_recommendations
  FROM user_privacy_settings
  WHERE user_id = target_user_id;
  
  -- If user doesn't allow recommendations, exit
  IF user_allows_recommendations IS FALSE THEN
    RETURN;
  END IF;
  
  -- Clear existing search-based recommendations
  DELETE FROM recipe_recommendations 
  WHERE user_id = target_user_id AND recommendation_type = 'search_history';
  
  -- Generate recommendations based on search patterns
  INSERT INTO recipe_recommendations (user_id, recipe_id, recommendation_type, confidence_score, reasoning)
  SELECT DISTINCT
    target_user_id,
    r.id,
    'search_history',
    LEAST(0.9, 0.3 + (search_frequency * 0.1) + (click_rate * 0.3)),
    'Based on your search history for ' || search_terms
  FROM (
    SELECT 
      unnest(string_to_array(lower(search_query), ' ')) as search_term,
      COUNT(*) as search_frequency,
      COUNT(clicked_recipe_id)::float / COUNT(*) as click_rate,
      string_agg(DISTINCT search_query, ', ') as search_terms
    FROM user_search_history 
    WHERE user_id = target_user_id 
      AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
    GROUP BY search_term
    HAVING COUNT(*) >= 2
  ) search_patterns
  JOIN recipes r ON (
    lower(r.title) LIKE '%' || search_patterns.search_term || '%' OR
    lower(r.description) LIKE '%' || search_patterns.search_term || '%' OR
    lower(r.cuisine) LIKE '%' || search_patterns.search_term || '%' OR
    EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(r.ingredients) as ingredient
      WHERE lower(ingredient::text) LIKE '%' || search_patterns.search_term || '%'
    )
  )
  WHERE r.is_public = true
    AND NOT EXISTS (
      SELECT 1 FROM saved_recipes sr 
      WHERE sr.user_id = target_user_id AND sr.recipe_id = r.id
    )
  LIMIT 20;
END;
$$;

-- Create default privacy settings for existing users
INSERT INTO user_privacy_settings (user_id, allow_search_history, allow_personalized_recommendations)
SELECT id, true, true
FROM users
WHERE id NOT IN (SELECT user_id FROM user_privacy_settings)
ON CONFLICT (user_id) DO NOTHING;