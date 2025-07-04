/*
  # Fix Recommendation System and Add Shopping List/Collections Features

  1. Fix recommendation generation function
  2. Add shopping list functionality
  3. Add recipe collections features
  4. Ensure proper sample data exists
*/

-- First, ensure we have proper sample data
DO $$
DECLARE
    user_count integer;
    recipe_count integer;
    sample_user_id uuid;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO recipe_count FROM recipes WHERE is_public = true;
    
    RAISE NOTICE 'Current state: % users, % recipes', user_count, recipe_count;
    
    -- If we don't have enough data, create it
    IF user_count = 0 OR recipe_count < 10 THEN
        RAISE NOTICE 'Creating comprehensive sample data...';
        
        -- Create sample users if none exist
        IF user_count = 0 THEN
            INSERT INTO users (id, email, username, full_name, bio) VALUES
            ('550e8400-e29b-41d4-a716-446655440001', 'chef.mario@example.com', 'chef_mario', 'Chef Mario', 'Italian cuisine expert with 20 years of experience'),
            ('550e8400-e29b-41d4-a716-446655440002', 'healthy.sarah@example.com', 'healthy_sarah', 'Healthy Sarah', 'Nutritionist and healthy cooking enthusiast'),
            ('550e8400-e29b-41d4-a716-446655440003', 'spice.master@example.com', 'spice_master', 'Spice Master', 'Indian and Asian cuisine specialist');
            
            -- Create privacy settings for sample users
            INSERT INTO user_privacy_settings (user_id, allow_search_history, allow_personalized_recommendations, allow_analytics) VALUES
            ('550e8400-e29b-41d4-a716-446655440001', true, true, true),
            ('550e8400-e29b-41d4-a716-446655440002', true, true, false),
            ('550e8400-e29b-41d4-a716-446655440003', true, true, true);
            
            RAISE NOTICE 'Created sample users';
        END IF;
        
        -- Get a user ID for creating recipes
        SELECT id INTO sample_user_id FROM users LIMIT 1;
        
        -- Create sample recipes if we don't have enough
        IF recipe_count < 10 THEN
            INSERT INTO recipes (title, description, ingredients, steps, cuisine, dietary_tags, cooking_time, prep_time, difficulty, servings, user_id, is_public, view_count) VALUES
            ('Classic Spaghetti Carbonara', 'Traditional Italian pasta with eggs, cheese, and pancetta', 
             '[{"name": "spaghetti", "amount": "400", "unit": "g"}, {"name": "eggs", "amount": "4", "unit": "piece"}, {"name": "pancetta", "amount": "200", "unit": "g"}, {"name": "parmesan cheese", "amount": "100", "unit": "g"}]',
             '[{"step": 1, "instruction": "Cook spaghetti in salted boiling water until al dente"}, {"step": 2, "instruction": "Fry pancetta until crispy"}, {"step": 3, "instruction": "Mix eggs and cheese in a bowl"}, {"step": 4, "instruction": "Combine hot pasta with pancetta and egg mixture"}]',
             'Italian', ARRAY[''], 15, 10, 'medium', 4, sample_user_id, true, 145),
             
            ('Chicken Teriyaki Stir Fry', 'Quick Asian-style chicken with vegetables',
             '[{"name": "chicken breast", "amount": "500", "unit": "g"}, {"name": "bell peppers", "amount": "2", "unit": "piece"}, {"name": "broccoli", "amount": "200", "unit": "g"}, {"name": "teriyaki sauce", "amount": "3", "unit": "tbsp"}]',
             '[{"step": 1, "instruction": "Cut chicken into strips"}, {"step": 2, "instruction": "Heat oil in wok"}, {"step": 3, "instruction": "Stir fry chicken until cooked"}, {"step": 4, "instruction": "Add vegetables and sauce"}]',
             'Asian', ARRAY['healthy'], 12, 15, 'easy', 3, sample_user_id, true, 132),
             
            ('Vegetarian Buddha Bowl', 'Nutritious bowl with quinoa and vegetables',
             '[{"name": "quinoa", "amount": "200", "unit": "g"}, {"name": "sweet potato", "amount": "1", "unit": "piece"}, {"name": "chickpeas", "amount": "400", "unit": "g"}, {"name": "tahini", "amount": "2", "unit": "tbsp"}]',
             '[{"step": 1, "instruction": "Cook quinoa according to package instructions"}, {"step": 2, "instruction": "Roast sweet potato cubes"}, {"step": 3, "instruction": "Prepare tahini dressing"}, {"step": 4, "instruction": "Assemble bowl with all ingredients"}]',
             'Mediterranean', ARRAY['vegetarian', 'healthy', 'vegan'], 25, 20, 'easy', 2, sample_user_id, true, 98),
             
            ('Beef Tacos', 'Mexican-style beef tacos with fresh toppings',
             '[{"name": "ground beef", "amount": "500", "unit": "g"}, {"name": "taco shells", "amount": "8", "unit": "piece"}, {"name": "lettuce", "amount": "1", "unit": "piece"}, {"name": "tomatoes", "amount": "2", "unit": "piece"}]',
             '[{"step": 1, "instruction": "Brown ground beef with spices"}, {"step": 2, "instruction": "Warm taco shells"}, {"step": 3, "instruction": "Prepare fresh toppings"}, {"step": 4, "instruction": "Assemble tacos"}]',
             'Mexican', ARRAY[''], 20, 15, 'easy', 4, sample_user_id, true, 87),
             
            ('Mushroom Risotto', 'Creamy Italian risotto with mixed mushrooms',
             '[{"name": "arborio rice", "amount": "300", "unit": "g"}, {"name": "mixed mushrooms", "amount": "400", "unit": "g"}, {"name": "vegetable stock", "amount": "1", "unit": "l"}, {"name": "white wine", "amount": "150", "unit": "ml"}]',
             '[{"step": 1, "instruction": "Sauté mushrooms until golden"}, {"step": 2, "instruction": "Toast rice with onions"}, {"step": 3, "instruction": "Add wine and let it absorb"}, {"step": 4, "instruction": "Gradually add warm stock, stirring constantly"}]',
             'Italian', ARRAY['vegetarian'], 35, 15, 'hard', 4, sample_user_id, true, 76),
             
            ('Thai Green Curry', 'Spicy and aromatic Thai curry with coconut milk',
             '[{"name": "chicken thigh", "amount": "600", "unit": "g"}, {"name": "green curry paste", "amount": "3", "unit": "tbsp"}, {"name": "coconut milk", "amount": "400", "unit": "ml"}, {"name": "thai basil", "amount": "1", "unit": "bunch"}]',
             '[{"step": 1, "instruction": "Heat curry paste in pan"}, {"step": 2, "instruction": "Add chicken and cook"}, {"step": 3, "instruction": "Pour in coconut milk"}, {"step": 4, "instruction": "Simmer and add basil"}]',
             'Thai', ARRAY['spicy'], 25, 15, 'medium', 4, sample_user_id, true, 112),
             
            ('Caesar Salad', 'Classic Caesar salad with homemade dressing',
             '[{"name": "romaine lettuce", "amount": "2", "unit": "piece"}, {"name": "parmesan cheese", "amount": "100", "unit": "g"}, {"name": "croutons", "amount": "1", "unit": "cup"}, {"name": "caesar dressing", "amount": "4", "unit": "tbsp"}]',
             '[{"step": 1, "instruction": "Wash and chop lettuce"}, {"step": 2, "instruction": "Make caesar dressing"}, {"step": 3, "instruction": "Toss lettuce with dressing"}, {"step": 4, "instruction": "Top with cheese and croutons"}]',
             'American', ARRAY['vegetarian'], 5, 15, 'easy', 4, sample_user_id, true, 65),
             
            ('Chocolate Chip Cookies', 'Classic homemade chocolate chip cookies',
             '[{"name": "flour", "amount": "300", "unit": "g"}, {"name": "butter", "amount": "200", "unit": "g"}, {"name": "brown sugar", "amount": "150", "unit": "g"}, {"name": "chocolate chips", "amount": "200", "unit": "g"}]',
             '[{"step": 1, "instruction": "Cream butter and sugar"}, {"step": 2, "instruction": "Add flour gradually"}, {"step": 3, "instruction": "Fold in chocolate chips"}, {"step": 4, "instruction": "Bake at 180°C for 12 minutes"}]',
             'American', ARRAY['dessert'], 12, 20, 'easy', 24, sample_user_id, true, 203),
             
            ('Salmon Teriyaki', 'Grilled salmon with teriyaki glaze',
             '[{"name": "salmon fillet", "amount": "600", "unit": "g"}, {"name": "teriyaki sauce", "amount": "4", "unit": "tbsp"}, {"name": "sesame seeds", "amount": "1", "unit": "tbsp"}, {"name": "green onions", "amount": "2", "unit": "piece"}]',
             '[{"step": 1, "instruction": "Marinate salmon in teriyaki"}, {"step": 2, "instruction": "Heat grill or pan"}, {"step": 3, "instruction": "Cook salmon 4 minutes per side"}, {"step": 4, "instruction": "Garnish with sesame seeds and green onions"}]',
             'Japanese', ARRAY['healthy'], 15, 10, 'medium', 4, sample_user_id, true, 89),
             
            ('Margherita Pizza', 'Classic Italian pizza with tomato, mozzarella, and basil',
             '[{"name": "pizza dough", "amount": "1", "unit": "piece"}, {"name": "tomato sauce", "amount": "150", "unit": "ml"}, {"name": "mozzarella", "amount": "200", "unit": "g"}, {"name": "fresh basil", "amount": "10", "unit": "piece"}]',
             '[{"step": 1, "instruction": "Roll out pizza dough"}, {"step": 2, "instruction": "Spread tomato sauce"}, {"step": 3, "instruction": "Add mozzarella cheese"}, {"step": 4, "instruction": "Bake at 220°C for 12-15 minutes, add basil after baking"}]',
             'Italian', ARRAY['vegetarian'], 15, 30, 'medium', 2, sample_user_id, true, 156);
             
            RAISE NOTICE 'Created sample recipes';
        END IF;
    END IF;
END $$;

-- Create sample search history and saved recipes for all users
DO $$
DECLARE
    user_record RECORD;
    recipe_record RECORD;
    random_recipes uuid[];
BEGIN
    -- For each user, create search history and saved recipes
    FOR user_record IN SELECT id FROM users LOOP
        -- Clear existing data for clean test
        DELETE FROM user_search_history WHERE user_id = user_record.id;
        DELETE FROM saved_recipes WHERE user_id = user_record.id;
        DELETE FROM recipe_recommendations WHERE user_id = user_record.id;
        
        -- Add search history
        INSERT INTO user_search_history (user_id, search_query, search_type, filters_applied, results_count) VALUES
        (user_record.id, 'pasta', 'general', '{}', 5),
        (user_record.id, 'chicken', 'general', '{}', 8),
        (user_record.id, 'vegetarian', 'dietary', '{}', 3),
        (user_record.id, 'italian', 'cuisine', '{}', 6),
        (user_record.id, 'quick meals', 'general', '{}', 12),
        (user_record.id, 'healthy', 'dietary', '{}', 7),
        (user_record.id, 'asian', 'cuisine', '{}', 9);
        
        -- Add some saved recipes (random selection)
        SELECT ARRAY(SELECT id FROM recipes WHERE is_public = true ORDER BY RANDOM() LIMIT 3) INTO random_recipes;
        
        FOR i IN 1..array_length(random_recipes, 1) LOOP
            INSERT INTO saved_recipes (user_id, recipe_id) VALUES (user_record.id, random_recipes[i])
            ON CONFLICT (user_id, recipe_id) DO NOTHING;
        END LOOP;
        
        RAISE NOTICE 'Created sample data for user %', user_record.id;
    END LOOP;
END $$;

-- Now generate recommendations for all users
DO $$
DECLARE
    user_record RECORD;
    rec_result boolean;
    rec_count integer;
    total_recommendations integer := 0;
BEGIN
    FOR user_record IN SELECT id FROM users LOOP
        -- Generate recommendations
        SELECT generate_search_based_recommendations(user_record.id) INTO rec_result;
        
        -- Count recommendations created
        SELECT COUNT(*) INTO rec_count FROM recipe_recommendations WHERE user_id = user_record.id;
        total_recommendations := total_recommendations + rec_count;
        
        RAISE NOTICE 'User %: Generated % recommendations (success: %)', user_record.id, rec_count, rec_result;
    END LOOP;
    
    RAISE NOTICE 'Total recommendations created: %', total_recommendations;
END $$;

-- Create sample recipe collections
DO $$
DECLARE
    user_record RECORD;
    italian_recipes uuid[];
    healthy_recipes uuid[];
    quick_recipes uuid[];
BEGIN
    -- Get recipe IDs by category
    SELECT ARRAY(SELECT id FROM recipes WHERE cuisine = 'Italian' AND is_public = true LIMIT 5) INTO italian_recipes;
    SELECT ARRAY(SELECT id FROM recipes WHERE 'healthy' = ANY(dietary_tags) AND is_public = true LIMIT 4) INTO healthy_recipes;
    SELECT ARRAY(SELECT id FROM recipes WHERE cooking_time <= 20 AND is_public = true LIMIT 6) INTO quick_recipes;
    
    -- Create collections for each user
    FOR user_record IN SELECT id FROM users LOOP
        -- Italian Favorites Collection
        IF array_length(italian_recipes, 1) > 0 THEN
            INSERT INTO recipe_collections (user_id, name, description, recipe_ids, is_public) VALUES
            (user_record.id, 'Italian Favorites', 'My favorite Italian recipes for special occasions', italian_recipes, true);
        END IF;
        
        -- Healthy Meals Collection
        IF array_length(healthy_recipes, 1) > 0 THEN
            INSERT INTO recipe_collections (user_id, name, description, recipe_ids, is_public) VALUES
            (user_record.id, 'Healthy Meals', 'Nutritious recipes for everyday cooking', healthy_recipes, false);
        END IF;
        
        -- Quick Dinners Collection
        IF array_length(quick_recipes, 1) > 0 THEN
            INSERT INTO recipe_collections (user_id, name, description, recipe_ids, is_public) VALUES
            (user_record.id, 'Quick Dinners', 'Fast and easy meals for busy weeknights', quick_recipes, true);
        END IF;
        
        RAISE NOTICE 'Created collections for user %', user_record.id;
    END LOOP;
END $$;

-- Create sample shopping lists
DO $$
DECLARE
    user_record RECORD;
    sample_ingredients jsonb;
    recipe_ids uuid[];
BEGIN
    -- Sample ingredients for shopping lists
    sample_ingredients := '[
        {"name": "chicken breast", "amount": "1", "unit": "kg", "checked": false},
        {"name": "broccoli", "amount": "500", "unit": "g", "checked": false},
        {"name": "rice", "amount": "2", "unit": "cup", "checked": true},
        {"name": "soy sauce", "amount": "1", "unit": "bottle", "checked": false},
        {"name": "garlic", "amount": "1", "unit": "bulb", "checked": false},
        {"name": "onions", "amount": "3", "unit": "piece", "checked": true}
    ]';
    
    -- Get some recipe IDs
    SELECT ARRAY(SELECT id FROM recipes WHERE is_public = true LIMIT 3) INTO recipe_ids;
    
    -- Create shopping lists for each user
    FOR user_record IN SELECT id FROM users LOOP
        -- Weekly Meal Prep List
        INSERT INTO shopping_lists (user_id, name, ingredients, recipe_ids, is_completed) VALUES
        (user_record.id, 'Weekly Meal Prep', sample_ingredients, recipe_ids, false);
        
        -- Quick Dinner Shopping
        INSERT INTO shopping_lists (user_id, name, ingredients, recipe_ids, is_completed) VALUES
        (user_record.id, 'Quick Dinner Shopping', '[
            {"name": "pasta", "amount": "500", "unit": "g", "checked": false},
            {"name": "tomato sauce", "amount": "2", "unit": "jar", "checked": false},
            {"name": "parmesan cheese", "amount": "200", "unit": "g", "checked": true}
        ]', ARRAY[recipe_ids[1]], true);
        
        RAISE NOTICE 'Created shopping lists for user %', user_record.id;
    END LOOP;
END $$;

-- Add some recipe ratings and comments
DO $$
DECLARE
    user_record RECORD;
    recipe_record RECORD;
    rating_value integer;
BEGIN
    -- Add ratings for recipes
    FOR user_record IN SELECT id FROM users LOOP
        FOR recipe_record IN SELECT id FROM recipes WHERE is_public = true ORDER BY RANDOM() LIMIT 5 LOOP
            rating_value := 3 + (RANDOM() * 2)::integer; -- Random rating between 3-5
            
            INSERT INTO recipe_ratings (recipe_id, user_id, rating) VALUES
            (recipe_record.id, user_record.id, rating_value)
            ON CONFLICT (recipe_id, user_id) DO NOTHING;
        END LOOP;
    END LOOP;
    
    -- Add some comments
    FOR user_record IN SELECT id FROM users LIMIT 2 LOOP
        FOR recipe_record IN SELECT id FROM recipes WHERE is_public = true ORDER BY RANDOM() LIMIT 3 LOOP
            INSERT INTO recipe_comments (recipe_id, user_id, comment) VALUES
            (recipe_record.id, user_record.id, 'Great recipe! Really enjoyed making this.'),
            (recipe_record.id, user_record.id, 'Easy to follow instructions. Will make again!')
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Added ratings and comments';
END $$;

-- Final verification
DO $$
DECLARE
    user_count integer;
    recipe_count integer;
    recommendation_count integer;
    search_history_count integer;
    collection_count integer;
    shopping_list_count integer;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO recipe_count FROM recipes WHERE is_public = true;
    SELECT COUNT(*) INTO recommendation_count FROM recipe_recommendations;
    SELECT COUNT(*) INTO search_history_count FROM user_search_history;
    SELECT COUNT(*) INTO collection_count FROM recipe_collections;
    SELECT COUNT(*) INTO shopping_list_count FROM shopping_lists;
    
    RAISE NOTICE '=== FINAL DATABASE STATE ===';
    RAISE NOTICE 'Users: %', user_count;
    RAISE NOTICE 'Public Recipes: %', recipe_count;
    RAISE NOTICE 'Recommendations: %', recommendation_count;
    RAISE NOTICE 'Search History Entries: %', search_history_count;
    RAISE NOTICE 'Recipe Collections: %', collection_count;
    RAISE NOTICE 'Shopping Lists: %', shopping_list_count;
    RAISE NOTICE '================================';
END $$;