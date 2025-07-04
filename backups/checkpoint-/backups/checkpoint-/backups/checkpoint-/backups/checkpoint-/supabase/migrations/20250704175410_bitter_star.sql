/*
  # Create Test Data for Recommendation System

  1. Test Data
    - Add sample recipes if none exist
    - Add sample search history
    - Test recommendation generation

  2. Debugging
    - Add logging to track recommendation generation
    - Verify all tables have proper data
*/

-- First, let's check if we have any recipes
DO $$
DECLARE
    recipe_count integer;
    user_count integer;
    test_user_id uuid;
BEGIN
    -- Check recipe count
    SELECT COUNT(*) INTO recipe_count FROM recipes WHERE is_public = true;
    SELECT COUNT(*) INTO user_count FROM users;
    
    RAISE NOTICE 'Found % public recipes and % users', recipe_count, user_count;
    
    -- If we have users but no recipes, create some sample recipes
    IF user_count > 0 AND recipe_count = 0 THEN
        -- Get the first user to create recipes
        SELECT id INTO test_user_id FROM users LIMIT 1;
        
        RAISE NOTICE 'Creating sample recipes for user %', test_user_id;
        
        -- Insert sample recipes
        INSERT INTO recipes (title, description, ingredients, steps, cuisine, dietary_tags, cooking_time, prep_time, difficulty, servings, user_id, is_public, view_count) VALUES
        ('Classic Spaghetti Carbonara', 'A traditional Italian pasta dish with eggs, cheese, and pancetta', 
         '[{"name": "spaghetti", "amount": "400", "unit": "g"}, {"name": "eggs", "amount": "4", "unit": "piece"}, {"name": "pancetta", "amount": "200", "unit": "g"}, {"name": "parmesan cheese", "amount": "100", "unit": "g"}]',
         '[{"step": 1, "instruction": "Cook spaghetti in salted boiling water until al dente"}, {"step": 2, "instruction": "Fry pancetta until crispy"}, {"step": 3, "instruction": "Mix eggs and cheese in a bowl"}, {"step": 4, "instruction": "Combine hot pasta with pancetta and egg mixture"}]',
         'Italian', ARRAY[''], 15, 10, 'medium', 4, test_user_id, true, 45),
         
        ('Chicken Stir Fry', 'Quick and healthy chicken stir fry with vegetables',
         '[{"name": "chicken breast", "amount": "500", "unit": "g"}, {"name": "bell peppers", "amount": "2", "unit": "piece"}, {"name": "broccoli", "amount": "200", "unit": "g"}, {"name": "soy sauce", "amount": "3", "unit": "tbsp"}]',
         '[{"step": 1, "instruction": "Cut chicken into strips"}, {"step": 2, "instruction": "Heat oil in wok"}, {"step": 3, "instruction": "Stir fry chicken until cooked"}, {"step": 4, "instruction": "Add vegetables and sauce"}]',
         'Asian', ARRAY['healthy'], 12, 15, 'easy', 3, test_user_id, true, 32),
         
        ('Vegetarian Buddha Bowl', 'Nutritious bowl with quinoa, vegetables, and tahini dressing',
         '[{"name": "quinoa", "amount": "200", "unit": "g"}, {"name": "sweet potato", "amount": "1", "unit": "piece"}, {"name": "chickpeas", "amount": "400", "unit": "g"}, {"name": "tahini", "amount": "2", "unit": "tbsp"}]',
         '[{"step": 1, "instruction": "Cook quinoa according to package instructions"}, {"step": 2, "instruction": "Roast sweet potato cubes"}, {"step": 3, "instruction": "Prepare tahini dressing"}, {"step": 4, "instruction": "Assemble bowl with all ingredients"}]',
         'Mediterranean', ARRAY['vegetarian', 'healthy', 'vegan'], 25, 20, 'easy', 2, test_user_id, true, 28),
         
        ('Beef Tacos', 'Delicious Mexican-style beef tacos with fresh toppings',
         '[{"name": "ground beef", "amount": "500", "unit": "g"}, {"name": "taco shells", "amount": "8", "unit": "piece"}, {"name": "lettuce", "amount": "1", "unit": "piece"}, {"name": "tomatoes", "amount": "2", "unit": "piece"}]',
         '[{"step": 1, "instruction": "Brown ground beef with spices"}, {"step": 2, "instruction": "Warm taco shells"}, {"step": 3, "instruction": "Prepare fresh toppings"}, {"step": 4, "instruction": "Assemble tacos"}]',
         'Mexican', ARRAY[''], 20, 15, 'easy', 4, test_user_id, true, 38),
         
        ('Mushroom Risotto', 'Creamy Italian risotto with mixed mushrooms',
         '[{"name": "arborio rice", "amount": "300", "unit": "g"}, {"name": "mixed mushrooms", "amount": "400", "unit": "g"}, {"name": "vegetable stock", "amount": "1", "unit": "l"}, {"name": "white wine", "amount": "150", "unit": "ml"}]',
         '[{"step": 1, "instruction": "Sauté mushrooms until golden"}, {"step": 2, "instruction": "Toast rice with onions"}, {"step": 3, "instruction": "Add wine and let it absorb"}, {"step": 4, "instruction": "Gradually add warm stock, stirring constantly"}]',
         'Italian', ARRAY['vegetarian'], 35, 15, 'hard', 4, test_user_id, true, 22);
         
        RAISE NOTICE 'Created 5 sample recipes';
    END IF;
END $$;

-- Test the recommendation function
DO $$
DECLARE
    test_user_id uuid;
    rec_result boolean;
    rec_count integer;
BEGIN
    -- Get a user to test with
    SELECT id INTO test_user_id FROM users LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Testing recommendations for user %', test_user_id;
        
        -- Clear any existing recommendations
        DELETE FROM recipe_recommendations WHERE user_id = test_user_id;
        
        -- Add some test search history if none exists
        IF NOT EXISTS (SELECT 1 FROM user_search_history WHERE user_id = test_user_id) THEN
            INSERT INTO user_search_history (user_id, search_query, search_type, filters_applied, results_count) VALUES
            (test_user_id, 'pasta', 'general', '{}', 5),
            (test_user_id, 'chicken', 'general', '{}', 8),
            (test_user_id, 'vegetarian', 'dietary', '{}', 3),
            (test_user_id, 'italian', 'cuisine', '{}', 6);
            
            RAISE NOTICE 'Added test search history';
        END IF;
        
        -- Generate recommendations
        SELECT generate_search_based_recommendations(test_user_id) INTO rec_result;
        
        -- Check results
        SELECT COUNT(*) INTO rec_count FROM recipe_recommendations WHERE user_id = test_user_id;
        
        RAISE NOTICE 'Recommendation generation result: %, created % recommendations', rec_result, rec_count;
        
        -- Show the recommendations
        IF rec_count > 0 THEN
            RAISE NOTICE 'Sample recommendations:';
            FOR rec_result IN 
                SELECT 'Type: ' || recommendation_type || ', Score: ' || confidence_score || ', Recipe: ' || r.title
                FROM recipe_recommendations rr
                JOIN recipes r ON rr.recipe_id = r.id
                WHERE rr.user_id = test_user_id
                LIMIT 3
            LOOP
                RAISE NOTICE '%', rec_result;
            END LOOP;
        END IF;
    ELSE
        RAISE NOTICE 'No users found to test with';
    END IF;
END $$;