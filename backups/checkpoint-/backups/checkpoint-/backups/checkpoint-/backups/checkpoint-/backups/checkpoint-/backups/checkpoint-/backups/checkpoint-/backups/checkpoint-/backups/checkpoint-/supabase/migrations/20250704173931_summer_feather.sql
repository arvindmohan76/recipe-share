/*
  # Search Analytics Functions

  1. Functions
    - `get_popular_search_terms` - Get anonymized popular search terms
    - `get_user_search_analytics` - Get user's personal search analytics
    - `cleanup_old_search_history_job` - Scheduled cleanup job

  2. Security
    - Functions respect user privacy settings
    - Anonymized data for public analytics
    - User-specific data only for authenticated users
*/

-- Function to get popular search terms (anonymized)
CREATE OR REPLACE FUNCTION get_popular_search_terms(term_limit integer DEFAULT 10)
RETURNS TABLE(term text, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    unnest(string_to_array(lower(search_query), ' ')) as search_term,
    COUNT(*) as term_count
  FROM user_search_history 
  WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
    AND LENGTH(unnest(string_to_array(lower(search_query), ' '))) > 2
  GROUP BY search_term
  ORDER BY term_count DESC
  LIMIT term_limit;
END;
$$;

-- Function to get user's search analytics
CREATE OR REPLACE FUNCTION get_user_search_analytics(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_allows_analytics boolean;
  result jsonb;
  total_searches integer;
  click_through_rate decimal;
  top_terms jsonb;
  search_trends jsonb;
BEGIN
  -- Check if user allows analytics
  SELECT allow_analytics INTO user_allows_analytics
  FROM user_privacy_settings
  WHERE user_id = target_user_id;
  
  -- If user doesn't allow analytics, return null
  IF user_allows_analytics IS FALSE THEN
    RETURN NULL;
  END IF;
  
  -- Get total searches
  SELECT COUNT(*) INTO total_searches
  FROM user_search_history
  WHERE user_id = target_user_id
    AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days';
  
  -- Calculate click-through rate
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN 
        COUNT(clicked_recipe_id)::decimal / COUNT(*)::decimal 
      ELSE 0 
    END INTO click_through_rate
  FROM user_search_history
  WHERE user_id = target_user_id
    AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days';
  
  -- Get top search terms
  SELECT jsonb_agg(
    jsonb_build_object(
      'term', search_term,
      'count', term_count
    )
  ) INTO top_terms
  FROM (
    SELECT 
      unnest(string_to_array(lower(search_query), ' ')) as search_term,
      COUNT(*) as term_count
    FROM user_search_history 
    WHERE user_id = target_user_id
      AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
      AND LENGTH(unnest(string_to_array(lower(search_query), ' '))) > 2
    GROUP BY search_term
    ORDER BY term_count DESC
    LIMIT 10
  ) top_search_terms;
  
  -- Get search trends (daily counts for last 30 days)
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', search_date,
      'count', daily_count
    ) ORDER BY search_date
  ) INTO search_trends
  FROM (
    SELECT 
      DATE(created_at) as search_date,
      COUNT(*) as daily_count
    FROM user_search_history
    WHERE user_id = target_user_id
      AND created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY search_date
  ) daily_searches;
  
  -- Build result
  result := jsonb_build_object(
    'totalSearches', total_searches,
    'clickThroughRate', click_through_rate,
    'topSearchTerms', COALESCE(top_terms, '[]'::jsonb),
    'searchTrends', COALESCE(search_trends, '[]'::jsonb)
  );
  
  RETURN result;
END;
$$;

-- Function to cleanup old search history (can be called by a scheduled job)
CREATE OR REPLACE FUNCTION cleanup_old_search_history_job()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete old search history based on user retention preferences
  WITH deleted_rows AS (
    DELETE FROM user_search_history 
    WHERE created_at < (
      SELECT CURRENT_TIMESTAMP - INTERVAL '1 day' * COALESCE(ups.data_retention_days, 365)
      FROM user_privacy_settings ups 
      WHERE ups.user_id = user_search_history.user_id
    )
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted_rows;
  
  RETURN deleted_count;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_popular_search_terms(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_search_analytics(uuid) TO authenticated;

-- Grant execute permission for cleanup function to service role (for scheduled jobs)
GRANT EXECUTE ON FUNCTION cleanup_old_search_history_job() TO service_role;