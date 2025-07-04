-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS generate_search_based_recommendations(uuid);
DROP FUNCTION IF EXISTS get_popular_search_terms(integer);
DROP FUNCTION IF EXISTS get_user_search_analytics(uuid);

-- Create improved recommendation generation function
CREATE OR REPLACE FUNCTION generate_search_based_recommendations(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rec_count integer := 0;
    search_count integer := 0;
    saved_count integer := 0;
BEGIN
    -- Check if user exists and has privacy settings allowing recommendations
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE id = target_user_id
    ) THEN
        RAISE NOTICE 'User % does not exist', target_user_id;
        RETURN false;
    END IF;

    -- Check privacy settings
    IF EXISTS (
        SELECT 1 FROM user_privacy_settings 
        WHERE user_id = target_user_id 
        AND allow_personalized_recommendations = false
    ) THEN
        RAISE NOTICE 'User % has disabled personalized recommendations', target_user_id;
        RETURN false;
    END IF;

    -- Clear existing recommendations for this user
    DELETE FROM recipe_recommendations WHERE user_id = target_user_id;

    -- Get user's search history count
    SELECT COUNT(*) INTO search_count
    FROM user_search_history 
    WHERE user_id = target_user_id;

    -- Get user's saved recipes count
    SELECT COUNT(*) INTO saved_count
    FROM saved_recipes 
    WHERE user_id = target_user_id;

    RAISE NOTICE 'User % has % searches and % saved recipes', target_user_id, search_count, saved_count;

    -- Strategy 1: Recommendations based on search history
    IF search_count > 0 THEN
        INSERT INTO recipe_recommendations (user_id, recipe_id, recommendation_type, confidence_score, reasoning)
        SELECT DISTINCT
            target_user_id,
            r.id,
            'search_history',
            LEAST(0.9, 0.3 + (search_matches::float / GREATEST(search_count, 1)) * 0.6),
            'Based on your search for "' || sh.search_query || '"'
        FROM (
            SELECT DISTINCT search_query, search_type
            FROM user_search_history 
            WHERE user_id = target_user_id 
            AND created_at > NOW() - INTERVAL '30 days'
            ORDER BY created_at DESC
            LIMIT 10
        ) sh
        JOIN recipes r ON (
            r.is_public = true
            AND (
                r.title ILIKE '%' || sh.search_query || '%'
                OR r.description ILIKE '%' || sh.search_query || '%'
                OR r.cuisine ILIKE '%' || sh.search_query || '%'
                OR EXISTS (
                    SELECT 1 FROM jsonb_array_elements(r.ingredients) AS ing
                    WHERE ing->>'name' ILIKE '%' || sh.search_query || '%'
                )
                OR sh.search_query = ANY(r.dietary_tags)
            )
        )
        CROSS JOIN LATERAL (
            SELECT COUNT(*) as search_matches
            FROM user_search_history sh2
            WHERE sh2.user_id = target_user_id
            AND (
                r.title ILIKE '%' || sh2.search_query || '%'
                OR r.description ILIKE '%' || sh2.search_query || '%'
                OR r.cuisine ILIKE '%' || sh2.search_query || '%'
            )
        ) matches
        WHERE r.user_id != target_user_id
        AND NOT EXISTS (
            SELECT 1 FROM saved_recipes sr 
            WHERE sr.user_id = target_user_id AND sr.recipe_id = r.id
        )
        ORDER BY matches.search_matches DESC, r.view_count DESC
        LIMIT 8;

        GET DIAGNOSTICS rec_count = ROW_COUNT;
        RAISE NOTICE 'Added % search-based recommendations', rec_count;
    END IF;

    -- Strategy 2: Recommendations based on saved recipes (similar recipes)
    IF saved_count > 0 THEN
        INSERT INTO recipe_recommendations (user_id, recipe_id, recommendation_type, confidence_score, reasoning)
        SELECT DISTINCT
            target_user_id,
            r.id,
            'saved_recipes',
            LEAST(0.85, 0.4 + (similarity_score::float / 10.0) * 0.45),
            'Similar to your saved recipe "' || saved_r.title || '"'
        FROM saved_recipes sr
        JOIN recipes saved_r ON sr.recipe_id = saved_r.id
        JOIN recipes r ON (
            r.is_public = true
            AND r.id != saved_r.id
            AND r.user_id != target_user_id
            AND (
                r.cuisine = saved_r.cuisine
                OR r.difficulty = saved_r.difficulty
                OR r.dietary_tags && saved_r.dietary_tags
                OR ABS(r.cooking_time - saved_r.cooking_time) <= 15
            )
        )
        CROSS JOIN LATERAL (
            SELECT (
                CASE WHEN r.cuisine = saved_r.cuisine THEN 3 ELSE 0 END +
                CASE WHEN r.difficulty = saved_r.difficulty THEN 2 ELSE 0 END +
                CASE WHEN r.dietary_tags && saved_r.dietary_tags THEN 2 ELSE 0 END +
                CASE WHEN ABS(r.cooking_time - saved_r.cooking_time) <= 15 THEN 1 ELSE 0 END +
                CASE WHEN ABS(r.servings - saved_r.servings) <= 2 THEN 1 ELSE 0 END
            ) as similarity_score
        ) sim
        WHERE sr.user_id = target_user_id
        AND NOT EXISTS (
            SELECT 1 FROM saved_recipes sr2 
            WHERE sr2.user_id = target_user_id AND sr2.recipe_id = r.id
        )
        AND NOT EXISTS (
            SELECT 1 FROM recipe_recommendations rr
            WHERE rr.user_id = target_user_id AND rr.recipe_id = r.id
        )
        ORDER BY sim.similarity_score DESC, r.view_count DESC
        LIMIT 6;

        GET DIAGNOSTICS rec_count = ROW_COUNT;
        RAISE NOTICE 'Added % saved-recipe-based recommendations', rec_count;
    END IF;

    -- Strategy 3: Trending recipes (popular recipes from last 7 days)
    INSERT INTO recipe_recommendations (user_id, recipe_id, recommendation_type, confidence_score, reasoning)
    SELECT DISTINCT
        target_user_id,
        r.id,
        'trending',
        LEAST(0.7, 0.3 + (r.view_count::float / GREATEST(max_views.max_views, 1)) * 0.4),
        'Trending recipe with ' || r.view_count || ' views'
    FROM recipes r
    CROSS JOIN (
        SELECT MAX(view_count) as max_views 
        FROM recipes 
        WHERE is_public = true 
        AND created_at > NOW() - INTERVAL '7 days'
    ) max_views
    WHERE r.is_public = true
    AND r.user_id != target_user_id
    AND r.view_count > 0
    AND NOT EXISTS (
        SELECT 1 FROM saved_recipes sr 
        WHERE sr.user_id = target_user_id AND sr.recipe_id = r.id
    )
    AND NOT EXISTS (
        SELECT 1 FROM recipe_recommendations rr
        WHERE rr.user_id = target_user_id AND rr.recipe_id = r.id
    )
    ORDER BY r.view_count DESC, r.created_at DESC
    LIMIT 4;

    GET DIAGNOSTICS rec_count = ROW_COUNT;
    RAISE NOTICE 'Added % trending recommendations', rec_count;

    -- Strategy 4: Seasonal recommendations (if no other recommendations)
    IF NOT EXISTS (
        SELECT 1 FROM recipe_recommendations WHERE user_id = target_user_id
    ) THEN
        INSERT INTO recipe_recommendations (user_id, recipe_id, recommendation_type, confidence_score, reasoning)
        SELECT DISTINCT
            target_user_id,
            r.id,
            'seasonal',
            0.5,
            'Popular ' || r.cuisine || ' recipe'
        FROM recipes r
        WHERE r.is_public = true
        AND r.user_id != target_user_id
        AND r.view_count > 0
        ORDER BY r.view_count DESC, r.created_at DESC
        LIMIT 8;

        GET DIAGNOSTICS rec_count = ROW_COUNT;
        RAISE NOTICE 'Added % seasonal recommendations', rec_count;
    END IF;

    -- Log the total recommendations generated
    SELECT COUNT(*) INTO rec_count
    FROM recipe_recommendations 
    WHERE user_id = target_user_id;

    RAISE NOTICE 'Total recommendations for user %: %', target_user_id, rec_count;

    RETURN rec_count > 0;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error generating recommendations for user %: %', target_user_id, SQLERRM;
        RETURN false;
END;
$$;

-- Create function to get popular search terms
CREATE OR REPLACE FUNCTION get_popular_search_terms(term_limit integer DEFAULT 10)
RETURNS TABLE(term text, count bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        search_query as term,
        COUNT(*) as count
    FROM user_search_history 
    WHERE created_at > NOW() - INTERVAL '30 days'
    AND LENGTH(search_query) > 2
    GROUP BY search_query
    ORDER BY count DESC, search_query
    LIMIT term_limit;
$$;

-- Create function to get user search analytics
CREATE OR REPLACE FUNCTION get_user_search_analytics(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    total_searches integer;
    click_through_rate numeric;
BEGIN
    -- Check privacy settings
    IF EXISTS (
        SELECT 1 FROM user_privacy_settings 
        WHERE user_id = target_user_id 
        AND allow_analytics = false
    ) THEN
        RETURN NULL;
    END IF;

    -- Get total searches
    SELECT COUNT(*) INTO total_searches
    FROM user_search_history 
    WHERE user_id = target_user_id;

    -- Calculate click-through rate
    SELECT 
        CASE 
            WHEN total_searches > 0 THEN 
                (COUNT(*) FILTER (WHERE clicked_recipe_id IS NOT NULL)::numeric / total_searches) * 100
            ELSE 0 
        END INTO click_through_rate
    FROM user_search_history 
    WHERE user_id = target_user_id;

    -- Build result
    SELECT json_build_object(
        'totalSearches', total_searches,
        'clickThroughRate', ROUND(click_through_rate, 2),
        'topSearchTerms', (
            SELECT json_agg(json_build_object('term', search_query, 'count', cnt))
            FROM (
                SELECT search_query, COUNT(*) as cnt
                FROM user_search_history 
                WHERE user_id = target_user_id
                GROUP BY search_query
                ORDER BY cnt DESC
                LIMIT 5
            ) top_terms
        ),
        'searchTrends', (
            SELECT json_agg(json_build_object('date', search_date, 'count', cnt))
            FROM (
                SELECT 
                    DATE(created_at) as search_date,
                    COUNT(*) as cnt
                FROM user_search_history 
                WHERE user_id = target_user_id
                AND created_at > NOW() - INTERVAL '30 days'
                GROUP BY DATE(created_at)
                ORDER BY search_date DESC
                LIMIT 30
            ) trends
        )
    ) INTO result;

    RETURN result;
END;
$$;