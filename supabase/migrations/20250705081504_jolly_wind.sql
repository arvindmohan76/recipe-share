/*
  # Add AI Recommendations Support

  1. New Functions
    - Update recipe_recommendations table to support AI-generated recommendations
    - Add new recommendation types
    - Ensure proper indexing for AI recommendations

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- Update recipe_recommendations table to support AI reasoning field if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'recipe_recommendations' AND column_name = 'reasoning'
  ) THEN
    ALTER TABLE recipe_recommendations ADD COLUMN reasoning text;
  END IF;
END $$;

-- Update recommendation_type check constraint to include AI types
ALTER TABLE recipe_recommendations 
DROP CONSTRAINT IF EXISTS recipe_recommendations_recommendation_type_check;

ALTER TABLE recipe_recommendations 
ADD CONSTRAINT recipe_recommendations_recommendation_type_check 
CHECK (recommendation_type IN (
  'search_history', 
  'saved_recipes', 
  'similar_users', 
  'trending', 
  'seasonal',
  'ai_personalized',
  'ai_dietary',
  'ai_cuisine'
));

-- Create index on reasoning field for full-text search
CREATE INDEX IF NOT EXISTS idx_recipe_recommendations_reasoning 
ON recipe_recommendations USING gin(to_tsvector('english', COALESCE(reasoning, '')));

-- Create function to clean up old recommendations
CREATE OR REPLACE FUNCTION cleanup_old_recommendations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete recommendations older than 30 days
  DELETE FROM recipe_recommendations 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Create function to get AI recommendations
CREATE OR REPLACE FUNCTION get_ai_recommendations(target_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  recipe_id uuid,
  recommendation_type text,
  confidence_score numeric,
  reasoning text,
  created_at timestamptz,
  recipe jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rr.id,
    rr.user_id,
    rr.recipe_id,
    rr.recommendation_type,
    rr.confidence_score,
    rr.reasoning,
    rr.created_at,
    row_to_json(r.*)::jsonb as recipe
  FROM recipe_recommendations rr
  JOIN recipes r ON rr.recipe_id = r.id
  WHERE rr.user_id = target_user_id
  AND rr.recommendation_type LIKE 'ai_%'
  ORDER BY rr.confidence_score DESC, rr.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cleanup_old_recommendations() TO service_role;
GRANT EXECUTE ON FUNCTION get_ai_recommendations(uuid) TO authenticated;