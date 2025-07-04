/*
  # Create Comprehensive Sample Data

  This migration creates sample data for all tables to demonstrate the full functionality:
  - 5 sample users with profiles and preferences
  - 50 diverse recipes across different cuisines and dietary preferences
  - Search history for users
  - Recipe ratings and comments
  - Saved recipes and collections
  - User follows and privacy settings
  - Recipe recommendations

  This will provide a rich dataset to test all features of the application.
*/

-- First, let's create some sample users (in addition to any existing ones)
DO $$
DECLARE
    user1_id uuid := gen_random_uuid();
    user2_id uuid := gen_random_uuid();
    user3_id uuid := gen_random_uuid();
    user4_id uuid := gen_random_uuid();
    user5_id uuid := gen_random_uuid();
    recipe_ids uuid[] := ARRAY[]::uuid[];
    current_recipe_id uuid;
    i integer;
BEGIN
    -- Insert sample users
    INSERT INTO users (id, email, username, full_name, bio) VALUES
    (user1_id, 'chef.mario@example.com', 'chef_mario', 'Mario Rossi', 'Professional Italian chef with 15 years of experience. Love sharing traditional recipes!'),
    (user2_id, 'healthy.sarah@example.com', 'healthy_sarah', 'Sarah Johnson', 'Nutritionist and wellness coach. Passionate about healthy, delicious meals.'),
    (user3_id, 'spice.master@example.com', 'spice_master', 'Raj Patel', 'Indian cuisine expert. Bringing authentic flavors from my grandmother''s kitchen.'),
    (user4_id, 'quick.cook@example.com', 'quick_cook', 'Emily Chen', 'Busy mom of two. Specializing in quick, family-friendly meals.'),
    (user5_id, 'vegan.vibes@example.com', 'vegan_vibes', 'Alex Green', 'Plant-based chef and sustainability advocate. Proving vegan food is delicious!');

    -- Insert user preferences
    INSERT INTO user_preferences (user_id, dietary_restrictions, favorite_cuisines, cooking_habits, skill_level) VALUES
    (user1_id, ARRAY[]::text[], ARRAY['Italian', 'Mediterranean'], ARRAY['traditional_cooking', 'fresh_ingredients'], 'expert'),
    (user2_id, ARRAY['gluten-free'], ARRAY['Mediterranean', 'Asian'], ARRAY['meal_prep', 'healthy_cooking'], 'advanced'),
    (user3_id, ARRAY[]::text[], ARRAY['Indian', 'Asian'], ARRAY['spice_blending', 'traditional_cooking'], 'expert'),
    (user4_id, ARRAY[]::text[], ARRAY['American', 'Mexican', 'Asian'], ARRAY['quick_meals', 'family_cooking'], 'intermediate'),
    (user5_id, ARRAY['vegan'], ARRAY['Mediterranean', 'Asian', 'Mexican'], ARRAY['plant_based', 'sustainable_cooking'], 'advanced');

    -- Insert privacy settings
    INSERT INTO user_privacy_settings (user_id, allow_search_history, allow_personalized_recommendations, allow_analytics, data_retention_days) VALUES
    (user1_id, true, true, true, 365),
    (user2_id, true, true, false, 180),
    (user3_id, true, true, true, 365),
    (user4_id, true, true, false, 90),
    (user5_id, true, true, true, 730);

    -- Create 50 diverse recipes
    -- Italian Recipes (10)
    INSERT INTO recipes (title, description, ingredients, steps, cuisine, dietary_tags, cooking_time, prep_time, difficulty, servings, user_id, is_public, view_count) VALUES
    ('Classic Spaghetti Carbonara', 'Traditional Roman pasta dish with eggs, cheese, and guanciale', 
     '[{"name": "spaghetti", "amount": "400", "unit": "g"}, {"name": "eggs", "amount": "4", "unit": "piece"}, {"name": "guanciale", "amount": "150", "unit": "g"}, {"name": "pecorino romano", "amount": "100", "unit": "g"}, {"name": "black pepper", "amount": "1", "unit": "tsp"}]',
     '[{"step": 1, "instruction": "Cook spaghetti in salted boiling water until al dente", "tips": "Save some pasta water for the sauce"}, {"step": 2, "instruction": "Render guanciale in a large pan until crispy"}, {"step": 3, "instruction": "Whisk eggs with grated pecorino and black pepper"}, {"step": 4, "instruction": "Toss hot pasta with guanciale, then with egg mixture off heat"}]',
     'Italian', ARRAY[]::text[], 15, 10, 'medium', 4, user1_id, true, 156),

    ('Margherita Pizza', 'Classic Neapolitan pizza with tomato, mozzarella, and basil',
     '[{"name": "pizza dough", "amount": "500", "unit": "g"}, {"name": "san marzano tomatoes", "amount": "400", "unit": "g"}, {"name": "mozzarella di bufala", "amount": "250", "unit": "g"}, {"name": "fresh basil", "amount": "20", "unit": "g"}, {"name": "olive oil", "amount": "3", "unit": "tbsp"}]',
     '[{"step": 1, "instruction": "Preheat oven to maximum temperature with pizza stone"}, {"step": 2, "instruction": "Roll out pizza dough thinly"}, {"step": 3, "instruction": "Spread crushed tomatoes, add torn mozzarella"}, {"step": 4, "instruction": "Bake for 8-10 minutes until crust is golden"}, {"step": 5, "instruction": "Top with fresh basil and olive oil"}]',
     'Italian', ARRAY['vegetarian'], 25, 20, 'medium', 2, user1_id, true, 203),

    ('Osso Buco alla Milanese', 'Braised veal shanks in white wine with gremolata',
     '[{"name": "veal shanks", "amount": "4", "unit": "piece"}, {"name": "white wine", "amount": "500", "unit": "ml"}, {"name": "beef stock", "amount": "500", "unit": "ml"}, {"name": "carrots", "amount": "2", "unit": "piece"}, {"name": "celery", "amount": "2", "unit": "piece"}, {"name": "onion", "amount": "1", "unit": "piece"}]',
     '[{"step": 1, "instruction": "Season and flour veal shanks, brown in heavy pot"}, {"step": 2, "instruction": "Sauté mirepoix vegetables until soft"}, {"step": 3, "instruction": "Add wine and stock, bring to simmer"}, {"step": 4, "instruction": "Braise covered for 2 hours until tender"}, {"step": 5, "instruction": "Serve with gremolata and risotto"}]',
     'Italian', ARRAY[]::text[], 150, 30, 'hard', 4, user1_id, true, 89),

    ('Risotto ai Funghi Porcini', 'Creamy risotto with porcini mushrooms',
     '[{"name": "arborio rice", "amount": "320", "unit": "g"}, {"name": "dried porcini", "amount": "30", "unit": "g"}, {"name": "fresh mushrooms", "amount": "300", "unit": "g"}, {"name": "vegetable stock", "amount": "1.2", "unit": "l"}, {"name": "white wine", "amount": "150", "unit": "ml"}, {"name": "parmesan", "amount": "80", "unit": "g"}]',
     '[{"step": 1, "instruction": "Soak porcini in warm water for 20 minutes"}, {"step": 2, "instruction": "Sauté fresh mushrooms until golden"}, {"step": 3, "instruction": "Toast rice with onions, add wine"}, {"step": 4, "instruction": "Add warm stock gradually, stirring constantly"}, {"step": 5, "instruction": "Finish with butter, parmesan, and mushrooms"}]',
     'Italian', ARRAY['vegetarian'], 35, 15, 'hard', 4, user1_id, true, 134),

    ('Tiramisu', 'Classic Italian coffee-flavored dessert',
     '[{"name": "ladyfingers", "amount": "300", "unit": "g"}, {"name": "mascarpone", "amount": "500", "unit": "g"}, {"name": "eggs", "amount": "6", "unit": "piece"}, {"name": "sugar", "amount": "150", "unit": "g"}, {"name": "strong coffee", "amount": "300", "unit": "ml"}, {"name": "cocoa powder", "amount": "2", "unit": "tbsp"}]',
     '[{"step": 1, "instruction": "Separate eggs, whisk yolks with sugar until pale"}, {"step": 2, "instruction": "Fold in mascarpone until smooth"}, {"step": 3, "instruction": "Whip egg whites to soft peaks, fold into mixture"}, {"step": 4, "instruction": "Dip ladyfingers in coffee, layer with cream"}, {"step": 5, "instruction": "Refrigerate overnight, dust with cocoa before serving"}]',
     'Italian', ARRAY['vegetarian'], 30, 30, 'medium', 8, user1_id, true, 267),

    ('Pasta Puttanesca', 'Bold pasta with olives, capers, and anchovies',
     '[{"name": "spaghetti", "amount": "400", "unit": "g"}, {"name": "canned tomatoes", "amount": "400", "unit": "g"}, {"name": "black olives", "amount": "100", "unit": "g"}, {"name": "capers", "amount": "2", "unit": "tbsp"}, {"name": "anchovies", "amount": "6", "unit": "piece"}, {"name": "garlic", "amount": "3", "unit": "clove"}]',
     '[{"step": 1, "instruction": "Cook pasta in salted water until al dente"}, {"step": 2, "instruction": "Sauté garlic and anchovies in olive oil"}, {"step": 3, "instruction": "Add tomatoes, olives, and capers"}, {"step": 4, "instruction": "Simmer sauce for 15 minutes"}, {"step": 5, "instruction": "Toss with pasta and fresh parsley"}]',
     'Italian', ARRAY[]::text[], 25, 10, 'easy', 4, user1_id, true, 178),

    ('Minestrone Soup', 'Hearty Italian vegetable soup',
     '[{"name": "cannellini beans", "amount": "400", "unit": "g"}, {"name": "diced tomatoes", "amount": "400", "unit": "g"}, {"name": "carrots", "amount": "2", "unit": "piece"}, {"name": "celery", "amount": "2", "unit": "piece"}, {"name": "zucchini", "amount": "1", "unit": "piece"}, {"name": "pasta", "amount": "100", "unit": "g"}]',
     '[{"step": 1, "instruction": "Sauté onions, carrots, and celery"}, {"step": 2, "instruction": "Add tomatoes and vegetable stock"}, {"step": 3, "instruction": "Add beans and diced vegetables"}, {"step": 4, "instruction": "Simmer for 20 minutes"}, {"step": 5, "instruction": "Add pasta and cook until tender"}]',
     'Italian', ARRAY['vegetarian', 'healthy'], 45, 15, 'easy', 6, user1_id, true, 145),

    ('Chicken Parmigiana', 'Breaded chicken with tomato sauce and cheese',
     '[{"name": "chicken breasts", "amount": "4", "unit": "piece"}, {"name": "breadcrumbs", "amount": "200", "unit": "g"}, {"name": "parmesan", "amount": "100", "unit": "g"}, {"name": "mozzarella", "amount": "200", "unit": "g"}, {"name": "marinara sauce", "amount": "500", "unit": "ml"}]',
     '[{"step": 1, "instruction": "Pound chicken breasts to even thickness"}, {"step": 2, "instruction": "Bread chicken with flour, egg, and breadcrumbs"}, {"step": 3, "instruction": "Pan fry until golden brown"}, {"step": 4, "instruction": "Top with sauce and cheese, bake until melted"}]',
     'Italian', ARRAY[]::text[], 35, 20, 'medium', 4, user1_id, true, 192),

    ('Gnocchi with Sage Butter', 'Potato dumplings in brown butter sauce',
     '[{"name": "potato gnocchi", "amount": "500", "unit": "g"}, {"name": "butter", "amount": "100", "unit": "g"}, {"name": "fresh sage", "amount": "15", "unit": "g"}, {"name": "parmesan", "amount": "80", "unit": "g"}, {"name": "pine nuts", "amount": "50", "unit": "g"}]',
     '[{"step": 1, "instruction": "Cook gnocchi in salted water until they float"}, {"step": 2, "instruction": "Brown butter in large pan with sage"}, {"step": 3, "instruction": "Add drained gnocchi to butter"}, {"step": 4, "instruction": "Toss with parmesan and pine nuts"}]',
     'Italian', ARRAY['vegetarian'], 15, 5, 'easy', 4, user1_id, true, 156),

    ('Bruschetta al Pomodoro', 'Grilled bread with fresh tomatoes and basil',
     '[{"name": "rustic bread", "amount": "8", "unit": "slice"}, {"name": "ripe tomatoes", "amount": "4", "unit": "piece"}, {"name": "fresh basil", "amount": "20", "unit": "g"}, {"name": "garlic", "amount": "2", "unit": "clove"}, {"name": "olive oil", "amount": "4", "unit": "tbsp"}]',
     '[{"step": 1, "instruction": "Grill bread slices until golden"}, {"step": 2, "instruction": "Rub with garlic clove while warm"}, {"step": 3, "instruction": "Dice tomatoes and mix with basil"}, {"step": 4, "instruction": "Top bread with tomato mixture and olive oil"}]',
     'Italian', ARRAY['vegetarian', 'vegan'], 15, 10, 'easy', 4, user1_id, true, 234);

    -- Asian Recipes (10)
    INSERT INTO recipes (title, description, ingredients, steps, cuisine, dietary_tags, cooking_time, prep_time, difficulty, servings, user_id, is_public, view_count) VALUES
    ('Chicken Pad Thai', 'Classic Thai stir-fried noodles with tamarind sauce',
     '[{"name": "rice noodles", "amount": "300", "unit": "g"}, {"name": "chicken breast", "amount": "300", "unit": "g"}, {"name": "bean sprouts", "amount": "200", "unit": "g"}, {"name": "eggs", "amount": "2", "unit": "piece"}, {"name": "tamarind paste", "amount": "3", "unit": "tbsp"}, {"name": "fish sauce", "amount": "2", "unit": "tbsp"}]',
     '[{"step": 1, "instruction": "Soak rice noodles in warm water until soft"}, {"step": 2, "instruction": "Stir-fry chicken until cooked through"}, {"step": 3, "instruction": "Push to one side, scramble eggs"}, {"step": 4, "instruction": "Add noodles and sauce, toss everything together"}, {"step": 5, "instruction": "Add bean sprouts and peanuts, serve with lime"}]',
     'Thai', ARRAY[]::text[], 20, 15, 'medium', 3, user4_id, true, 189),

    ('Beef and Broccoli Stir Fry', 'Quick Chinese-style beef with vegetables',
     '[{"name": "beef sirloin", "amount": "400", "unit": "g"}, {"name": "broccoli", "amount": "300", "unit": "g"}, {"name": "soy sauce", "amount": "3", "unit": "tbsp"}, {"name": "oyster sauce", "amount": "2", "unit": "tbsp"}, {"name": "garlic", "amount": "3", "unit": "clove"}, {"name": "ginger", "amount": "2", "unit": "cm"}]',
     '[{"step": 1, "instruction": "Slice beef thinly against the grain"}, {"step": 2, "instruction": "Blanch broccoli in boiling water for 2 minutes"}, {"step": 3, "instruction": "Stir-fry beef in hot oil until browned"}, {"step": 4, "instruction": "Add garlic, ginger, then broccoli"}, {"step": 5, "instruction": "Toss with sauce and serve over rice"}]',
     'Chinese', ARRAY[]::text[], 15, 10, 'easy', 4, user4_id, true, 167),

    ('Chicken Tikka Masala', 'Creamy Indian curry with marinated chicken',
     '[{"name": "chicken breast", "amount": "600", "unit": "g"}, {"name": "yogurt", "amount": "200", "unit": "ml"}, {"name": "heavy cream", "amount": "200", "unit": "ml"}, {"name": "canned tomatoes", "amount": "400", "unit": "g"}, {"name": "garam masala", "amount": "2", "unit": "tsp"}, {"name": "turmeric", "amount": "1", "unit": "tsp"}]',
     '[{"step": 1, "instruction": "Marinate chicken in yogurt and spices for 2 hours"}, {"step": 2, "instruction": "Grill or pan-fry chicken until charred"}, {"step": 3, "instruction": "Make sauce with tomatoes, cream, and spices"}, {"step": 4, "instruction": "Simmer chicken in sauce for 15 minutes"}, {"step": 5, "instruction": "Serve with basmati rice and naan"}]',
     'Indian', ARRAY[]::text[], 30, 20, 'medium', 4, user3_id, true, 245),

    ('Vegetable Fried Rice', 'Simple Chinese fried rice with mixed vegetables',
     '[{"name": "cooked rice", "amount": "400", "unit": "g"}, {"name": "mixed vegetables", "amount": "200", "unit": "g"}, {"name": "eggs", "amount": "2", "unit": "piece"}, {"name": "soy sauce", "amount": "3", "unit": "tbsp"}, {"name": "sesame oil", "amount": "1", "unit": "tbsp"}, {"name": "green onions", "amount": "3", "unit": "piece"}]',
     '[{"step": 1, "instruction": "Use day-old rice for best texture"}, {"step": 2, "instruction": "Scramble eggs and set aside"}, {"step": 3, "instruction": "Stir-fry vegetables until tender-crisp"}, {"step": 4, "instruction": "Add rice, breaking up clumps"}, {"step": 5, "instruction": "Season with soy sauce and sesame oil"}]',
     'Chinese', ARRAY['vegetarian'], 15, 10, 'easy', 3, user4_id, true, 134),

    ('Tom Yum Soup', 'Spicy and sour Thai soup with shrimp',
     '[{"name": "shrimp", "amount": "300", "unit": "g"}, {"name": "mushrooms", "amount": "200", "unit": "g"}, {"name": "lemongrass", "amount": "2", "unit": "stalk"}, {"name": "lime leaves", "amount": "4", "unit": "piece"}, {"name": "fish sauce", "amount": "2", "unit": "tbsp"}, {"name": "lime juice", "amount": "3", "unit": "tbsp"}]',
     '[{"step": 1, "instruction": "Boil water with lemongrass and lime leaves"}, {"step": 2, "instruction": "Add mushrooms and cook for 3 minutes"}, {"step": 3, "instruction": "Add shrimp and cook until pink"}, {"step": 4, "instruction": "Season with fish sauce and chili paste"}, {"step": 5, "instruction": "Finish with lime juice and cilantro"}]',
     'Thai', ARRAY[]::text[], 20, 10, 'medium', 4, user3_id, true, 156),

    ('Miso Ramen', 'Japanese noodle soup with miso broth',
     '[{"name": "ramen noodles", "amount": "400", "unit": "g"}, {"name": "miso paste", "amount": "4", "unit": "tbsp"}, {"name": "chicken stock", "amount": "1", "unit": "l"}, {"name": "eggs", "amount": "4", "unit": "piece"}, {"name": "green onions", "amount": "4", "unit": "piece"}, {"name": "nori", "amount": "4", "unit": "sheet"}]',
     '[{"step": 1, "instruction": "Soft-boil eggs for 6 minutes"}, {"step": 2, "instruction": "Heat chicken stock and whisk in miso"}, {"step": 3, "instruction": "Cook ramen noodles according to package"}, {"step": 4, "instruction": "Assemble bowls with noodles and broth"}, {"step": 5, "instruction": "Top with halved eggs, green onions, and nori"}]',
     'Japanese', ARRAY[]::text[], 25, 15, 'medium', 4, user3_id, true, 198),

    ('Korean Bibimbap', 'Mixed rice bowl with vegetables and gochujang',
     '[{"name": "short grain rice", "amount": "300", "unit": "g"}, {"name": "beef bulgogi", "amount": "200", "unit": "g"}, {"name": "spinach", "amount": "200", "unit": "g"}, {"name": "carrots", "amount": "1", "unit": "piece"}, {"name": "bean sprouts", "amount": "150", "unit": "g"}, {"name": "gochujang", "amount": "2", "unit": "tbsp"}]',
     '[{"step": 1, "instruction": "Cook rice and keep warm"}, {"step": 2, "instruction": "Prepare each vegetable separately with seasoning"}, {"step": 3, "instruction": "Cook marinated beef until caramelized"}, {"step": 4, "instruction": "Arrange vegetables over rice in bowl"}, {"step": 5, "instruction": "Top with beef, fried egg, and gochujang"}]',
     'Korean', ARRAY[]::text[], 40, 30, 'medium', 4, user3_id, true, 167),

    ('Green Curry Chicken', 'Thai green curry with coconut milk',
     '[{"name": "chicken thighs", "amount": "500", "unit": "g"}, {"name": "green curry paste", "amount": "3", "unit": "tbsp"}, {"name": "coconut milk", "amount": "400", "unit": "ml"}, {"name": "thai eggplant", "amount": "200", "unit": "g"}, {"name": "thai basil", "amount": "20", "unit": "g"}, {"name": "fish sauce", "amount": "2", "unit": "tbsp"}]',
     '[{"step": 1, "instruction": "Fry curry paste in thick coconut cream"}, {"step": 2, "instruction": "Add chicken and cook until sealed"}, {"step": 3, "instruction": "Add remaining coconut milk and eggplant"}, {"step": 4, "instruction": "Simmer until chicken is tender"}, {"step": 5, "instruction": "Finish with thai basil and serve with rice"}]',
     'Thai', ARRAY[]::text[], 25, 15, 'medium', 4, user3_id, true, 178),

    ('Sushi Rolls', 'California rolls with crab and avocado',
     '[{"name": "sushi rice", "amount": "300", "unit": "g"}, {"name": "nori sheets", "amount": "4", "unit": "piece"}, {"name": "crab meat", "amount": "200", "unit": "g"}, {"name": "avocado", "amount": "1", "unit": "piece"}, {"name": "cucumber", "amount": "1", "unit": "piece"}, {"name": "sesame seeds", "amount": "2", "unit": "tbsp"}]',
     '[{"step": 1, "instruction": "Prepare sushi rice with vinegar seasoning"}, {"step": 2, "instruction": "Place nori on bamboo mat"}, {"step": 3, "instruction": "Spread rice evenly, leaving border"}, {"step": 4, "instruction": "Add filling and roll tightly"}, {"step": 5, "instruction": "Slice with sharp wet knife"}]',
     'Japanese', ARRAY[]::text[], 30, 45, 'hard', 4, user3_id, true, 234),

    ('Mongolian Beef', 'Sweet and savory Chinese-American beef dish',
     '[{"name": "beef flank steak", "amount": "500", "unit": "g"}, {"name": "soy sauce", "amount": "4", "unit": "tbsp"}, {"name": "brown sugar", "amount": "3", "unit": "tbsp"}, {"name": "green onions", "amount": "6", "unit": "piece"}, {"name": "ginger", "amount": "2", "unit": "cm"}, {"name": "garlic", "amount": "3", "unit": "clove"}]',
     '[{"step": 1, "instruction": "Slice beef thinly and coat with cornstarch"}, {"step": 2, "instruction": "Deep fry beef until crispy"}, {"step": 3, "instruction": "Make sauce with soy sauce and brown sugar"}, {"step": 4, "instruction": "Stir-fry ginger and garlic"}, {"step": 5, "instruction": "Toss beef with sauce and green onions"}]',
     'Chinese', ARRAY[]::text[], 20, 15, 'medium', 4, user3_id, true, 145);

    -- Healthy/Mediterranean Recipes (10)
    INSERT INTO recipes (title, description, ingredients, steps, cuisine, dietary_tags, cooking_time, prep_time, difficulty, servings, user_id, is_public, view_count) VALUES
    ('Mediterranean Quinoa Bowl', 'Nutritious bowl with quinoa, vegetables, and tahini',
     '[{"name": "quinoa", "amount": "200", "unit": "g"}, {"name": "chickpeas", "amount": "400", "unit": "g"}, {"name": "cucumber", "amount": "1", "unit": "piece"}, {"name": "cherry tomatoes", "amount": "200", "unit": "g"}, {"name": "feta cheese", "amount": "100", "unit": "g"}, {"name": "tahini", "amount": "3", "unit": "tbsp"}]',
     '[{"step": 1, "instruction": "Cook quinoa according to package instructions"}, {"step": 2, "instruction": "Roast chickpeas with olive oil and spices"}, {"step": 3, "instruction": "Dice cucumber and halve tomatoes"}, {"step": 4, "instruction": "Make tahini dressing with lemon juice"}, {"step": 5, "instruction": "Assemble bowl and top with feta"}]',
     'Mediterranean', ARRAY['vegetarian', 'healthy'], 25, 15, 'easy', 2, user2_id, true, 189),

    ('Grilled Salmon with Asparagus', 'Omega-3 rich salmon with seasonal vegetables',
     '[{"name": "salmon fillets", "amount": "4", "unit": "piece"}, {"name": "asparagus", "amount": "500", "unit": "g"}, {"name": "lemon", "amount": "2", "unit": "piece"}, {"name": "olive oil", "amount": "3", "unit": "tbsp"}, {"name": "garlic", "amount": "2", "unit": "clove"}, {"name": "dill", "amount": "2", "unit": "tbsp"}]',
     '[{"step": 1, "instruction": "Preheat grill to medium-high heat"}, {"step": 2, "instruction": "Season salmon with salt, pepper, and dill"}, {"step": 3, "instruction": "Toss asparagus with olive oil and garlic"}, {"step": 4, "instruction": "Grill salmon 4-5 minutes per side"}, {"step": 5, "instruction": "Grill asparagus until tender, serve with lemon"}]',
     'Mediterranean', ARRAY['healthy', 'keto'], 15, 10, 'easy', 4, user2_id, true, 167),

    ('Greek Salad', 'Traditional village salad with feta and olives',
     '[{"name": "tomatoes", "amount": "4", "unit": "piece"}, {"name": "cucumber", "amount": "1", "unit": "piece"}, {"name": "red onion", "amount": "1", "unit": "piece"}, {"name": "feta cheese", "amount": "200", "unit": "g"}, {"name": "kalamata olives", "amount": "100", "unit": "g"}, {"name": "olive oil", "amount": "4", "unit": "tbsp"}]',
     '[{"step": 1, "instruction": "Cut tomatoes into wedges"}, {"step": 2, "instruction": "Slice cucumber and red onion"}, {"step": 3, "instruction": "Arrange vegetables in bowl"}, {"step": 4, "instruction": "Top with feta block and olives"}, {"step": 5, "instruction": "Drizzle with olive oil and oregano"}]',
     'Greek', ARRAY['vegetarian', 'healthy', 'keto'], 0, 15, 'easy', 4, user2_id, true, 234),

    ('Lentil and Vegetable Soup', 'Protein-rich soup with red lentils',
     '[{"name": "red lentils", "amount": "300", "unit": "g"}, {"name": "carrots", "amount": "2", "unit": "piece"}, {"name": "celery", "amount": "2", "unit": "piece"}, {"name": "onion", "amount": "1", "unit": "piece"}, {"name": "vegetable stock", "amount": "1", "unit": "l"}, {"name": "turmeric", "amount": "1", "unit": "tsp"}]',
     '[{"step": 1, "instruction": "Sauté onion, carrots, and celery"}, {"step": 2, "instruction": "Add lentils and stock"}, {"step": 3, "instruction": "Season with turmeric and cumin"}, {"step": 4, "instruction": "Simmer for 20 minutes until lentils are soft"}, {"step": 5, "instruction": "Blend partially for texture"}]',
     'Mediterranean', ARRAY['vegetarian', 'vegan', 'healthy'], 30, 10, 'easy', 6, user2_id, true, 145),

    ('Stuffed Bell Peppers', 'Colorful peppers filled with quinoa and vegetables',
     '[{"name": "bell peppers", "amount": "4", "unit": "piece"}, {"name": "quinoa", "amount": "150", "unit": "g"}, {"name": "black beans", "amount": "400", "unit": "g"}, {"name": "corn", "amount": "200", "unit": "g"}, {"name": "cheese", "amount": "100", "unit": "g"}, {"name": "cilantro", "amount": "20", "unit": "g"}]',
     '[{"step": 1, "instruction": "Cut tops off peppers and remove seeds"}, {"step": 2, "instruction": "Cook quinoa with vegetable broth"}, {"step": 3, "instruction": "Mix quinoa with beans, corn, and spices"}, {"step": 4, "instruction": "Stuff peppers with mixture"}, {"step": 5, "instruction": "Bake covered for 30 minutes, top with cheese"}]',
     'Mediterranean', ARRAY['vegetarian', 'healthy'], 45, 20, 'medium', 4, user2_id, true, 178),

    ('Zucchini Noodles with Pesto', 'Low-carb pasta alternative with basil pesto',
     '[{"name": "zucchini", "amount": "4", "unit": "piece"}, {"name": "fresh basil", "amount": "50", "unit": "g"}, {"name": "pine nuts", "amount": "50", "unit": "g"}, {"name": "parmesan", "amount": "80", "unit": "g"}, {"name": "garlic", "amount": "2", "unit": "clove"}, {"name": "olive oil", "amount": "100", "unit": "ml"}]',
     '[{"step": 1, "instruction": "Spiralize zucchini into noodles"}, {"step": 2, "instruction": "Make pesto with basil, nuts, garlic, and oil"}, {"step": 3, "instruction": "Lightly sauté zucchini noodles for 2 minutes"}, {"step": 4, "instruction": "Toss with pesto and parmesan"}, {"step": 5, "instruction": "Serve immediately with cherry tomatoes"}]',
     'Mediterranean', ARRAY['vegetarian', 'healthy', 'keto', 'low-carb'], 10, 15, 'easy', 4, user2_id, true, 198),

    ('Chickpea and Spinach Curry', 'Protein-packed vegetarian curry',
     '[{"name": "chickpeas", "amount": "800", "unit": "g"}, {"name": "spinach", "amount": "300", "unit": "g"}, {"name": "coconut milk", "amount": "400", "unit": "ml"}, {"name": "onion", "amount": "1", "unit": "piece"}, {"name": "garam masala", "amount": "2", "unit": "tsp"}, {"name": "turmeric", "amount": "1", "unit": "tsp"}]',
     '[{"step": 1, "instruction": "Sauté onion until golden"}, {"step": 2, "instruction": "Add spices and cook until fragrant"}, {"step": 3, "instruction": "Add chickpeas and coconut milk"}, {"step": 4, "instruction": "Simmer for 15 minutes"}, {"step": 5, "instruction": "Stir in spinach until wilted"}]',
     'Indian', ARRAY['vegetarian', 'vegan', 'healthy'], 25, 10, 'easy', 4, user2_id, true, 156),

    ('Baked Sweet Potato with Black Beans', 'Nutritious stuffed sweet potato',
     '[{"name": "sweet potatoes", "amount": "4", "unit": "piece"}, {"name": "black beans", "amount": "400", "unit": "g"}, {"name": "avocado", "amount": "1", "unit": "piece"}, {"name": "lime", "amount": "1", "unit": "piece"}, {"name": "cilantro", "amount": "20", "unit": "g"}, {"name": "cumin", "amount": "1", "unit": "tsp"}]',
     '[{"step": 1, "instruction": "Bake sweet potatoes at 400°F for 45 minutes"}, {"step": 2, "instruction": "Heat black beans with cumin and lime"}, {"step": 3, "instruction": "Cut open potatoes and fluff flesh"}, {"step": 4, "instruction": "Top with black beans and avocado"}, {"step": 5, "instruction": "Garnish with cilantro and lime juice"}]',
     'American', ARRAY['vegetarian', 'vegan', 'healthy'], 50, 10, 'easy', 4, user2_id, true, 167),

    ('Cauliflower Rice Stir Fry', 'Low-carb alternative to fried rice',
     '[{"name": "cauliflower", "amount": "1", "unit": "piece"}, {"name": "mixed vegetables", "amount": "300", "unit": "g"}, {"name": "eggs", "amount": "2", "unit": "piece"}, {"name": "soy sauce", "amount": "2", "unit": "tbsp"}, {"name": "sesame oil", "amount": "1", "unit": "tbsp"}, {"name": "ginger", "amount": "2", "unit": "cm"}]',
     '[{"step": 1, "instruction": "Pulse cauliflower in food processor to rice size"}, {"step": 2, "instruction": "Scramble eggs and set aside"}, {"step": 3, "instruction": "Stir-fry vegetables until tender"}, {"step": 4, "instruction": "Add cauliflower rice and cook for 5 minutes"}, {"step": 5, "instruction": "Season and add eggs back"}]',
     'Asian', ARRAY['vegetarian', 'healthy', 'keto', 'low-carb'], 15, 10, 'easy', 4, user2_id, true, 134),

    ('Mediterranean Baked Fish', 'White fish with tomatoes, olives, and herbs',
     '[{"name": "white fish fillets", "amount": "4", "unit": "piece"}, {"name": "cherry tomatoes", "amount": "300", "unit": "g"}, {"name": "olives", "amount": "100", "unit": "g"}, {"name": "capers", "amount": "2", "unit": "tbsp"}, {"name": "oregano", "amount": "1", "unit": "tsp"}, {"name": "lemon", "amount": "1", "unit": "piece"}]',
     '[{"step": 1, "instruction": "Preheat oven to 400°F"}, {"step": 2, "instruction": "Place fish in baking dish"}, {"step": 3, "instruction": "Top with tomatoes, olives, and capers"}, {"step": 4, "instruction": "Season with oregano and olive oil"}, {"step": 5, "instruction": "Bake for 20 minutes, serve with lemon"}]',
     'Mediterranean', ARRAY['healthy', 'keto'], 25, 10, 'easy', 4, user2_id, true, 145);

    -- Mexican Recipes (5)
    INSERT INTO recipes (title, description, ingredients, steps, cuisine, dietary_tags, cooking_time, prep_time, difficulty, servings, user_id, is_public, view_count) VALUES
    ('Chicken Enchiladas', 'Rolled tortillas with chicken in red sauce',
     '[{"name": "corn tortillas", "amount": "12", "unit": "piece"}, {"name": "chicken breast", "amount": "500", "unit": "g"}, {"name": "enchilada sauce", "amount": "500", "unit": "ml"}, {"name": "cheese", "amount": "200", "unit": "g"}, {"name": "onion", "amount": "1", "unit": "piece"}, {"name": "cilantro", "amount": "20", "unit": "g"}]',
     '[{"step": 1, "instruction": "Cook and shred chicken with onions"}, {"step": 2, "instruction": "Warm tortillas to make them pliable"}, {"step": 3, "instruction": "Fill tortillas with chicken and roll"}, {"step": 4, "instruction": "Place in baking dish, cover with sauce"}, {"step": 5, "instruction": "Top with cheese and bake until bubbly"}]',
     'Mexican', ARRAY[]::text[], 35, 20, 'medium', 6, user4_id, true, 198),

    ('Fish Tacos', 'Crispy fish with cabbage slaw and lime crema',
     '[{"name": "white fish", "amount": "500", "unit": "g"}, {"name": "corn tortillas", "amount": "8", "unit": "piece"}, {"name": "cabbage", "amount": "200", "unit": "g"}, {"name": "sour cream", "amount": "150", "unit": "ml"}, {"name": "lime", "amount": "2", "unit": "piece"}, {"name": "cilantro", "amount": "20", "unit": "g"}]',
     '[{"step": 1, "instruction": "Season and pan-fry fish until crispy"}, {"step": 2, "instruction": "Make slaw with cabbage and lime"}, {"step": 3, "instruction": "Mix sour cream with lime juice"}, {"step": 4, "instruction": "Warm tortillas on griddle"}, {"step": 5, "instruction": "Assemble tacos with fish, slaw, and crema"}]',
     'Mexican', ARRAY[]::text[], 20, 15, 'easy', 4, user4_id, true, 167),

    ('Beef Barbacoa', 'Slow-cooked spiced beef for tacos',
     '[{"name": "beef chuck roast", "amount": "1.5", "unit": "kg"}, {"name": "chipotle peppers", "amount": "3", "unit": "piece"}, {"name": "beef broth", "amount": "500", "unit": "ml"}, {"name": "onion", "amount": "1", "unit": "piece"}, {"name": "garlic", "amount": "4", "unit": "clove"}, {"name": "cumin", "amount": "2", "unit": "tsp"}]',
     '[{"step": 1, "instruction": "Season beef with salt and pepper"}, {"step": 2, "instruction": "Sear beef on all sides in Dutch oven"}, {"step": 3, "instruction": "Add vegetables, peppers, and broth"}, {"step": 4, "instruction": "Cover and braise for 3 hours until tender"}, {"step": 5, "instruction": "Shred meat and serve in tortillas"}]',
     'Mexican', ARRAY[]::text[], 180, 20, 'medium', 8, user4_id, true, 234),

    ('Vegetarian Quesadillas', 'Cheese-filled tortillas with peppers and onions',
     '[{"name": "flour tortillas", "amount": "4", "unit": "piece"}, {"name": "cheese", "amount": "300", "unit": "g"}, {"name": "bell peppers", "amount": "2", "unit": "piece"}, {"name": "onion", "amount": "1", "unit": "piece"}, {"name": "mushrooms", "amount": "200", "unit": "g"}, {"name": "cilantro", "amount": "20", "unit": "g"}]',
     '[{"step": 1, "instruction": "Sauté peppers, onions, and mushrooms"}, {"step": 2, "instruction": "Fill tortillas with cheese and vegetables"}, {"step": 3, "instruction": "Cook in dry pan until golden and crispy"}, {"step": 4, "instruction": "Flip carefully and cook other side"}, {"step": 5, "instruction": "Cut into wedges and serve with salsa"}]',
     'Mexican', ARRAY['vegetarian'], 15, 10, 'easy', 4, user4_id, true, 156),

    ('Pozole Rojo', 'Traditional Mexican soup with hominy and pork',
     '[{"name": "pork shoulder", "amount": "1", "unit": "kg"}, {"name": "hominy", "amount": "800", "unit": "g"}, {"name": "dried chiles", "amount": "6", "unit": "piece"}, {"name": "onion", "amount": "1", "unit": "piece"}, {"name": "garlic", "amount": "4", "unit": "clove"}, {"name": "oregano", "amount": "1", "unit": "tsp"}]',
     '[{"step": 1, "instruction": "Simmer pork in water for 2 hours"}, {"step": 2, "instruction": "Toast and soak dried chiles"}, {"step": 3, "instruction": "Blend chiles with garlic and onion"}, {"step": 4, "instruction": "Add chile sauce and hominy to pot"}, {"step": 5, "instruction": "Simmer 30 minutes, serve with garnishes"}]',
     'Mexican', ARRAY[]::text[], 180, 30, 'hard', 8, user4_id, true, 145);

    -- Vegan Recipes (5)
    INSERT INTO recipes (title, description, ingredients, steps, cuisine, dietary_tags, cooking_time, prep_time, difficulty, servings, user_id, is_public, view_count) VALUES
    ('Vegan Buddha Bowl', 'Colorful bowl with quinoa, roasted vegetables, and tahini',
     '[{"name": "quinoa", "amount": "200", "unit": "g"}, {"name": "sweet potato", "amount": "2", "unit": "piece"}, {"name": "chickpeas", "amount": "400", "unit": "g"}, {"name": "kale", "amount": "200", "unit": "g"}, {"name": "tahini", "amount": "3", "unit": "tbsp"}, {"name": "lemon", "amount": "1", "unit": "piece"}]',
     '[{"step": 1, "instruction": "Roast sweet potato cubes and chickpeas"}, {"step": 2, "instruction": "Cook quinoa with vegetable broth"}, {"step": 3, "instruction": "Massage kale with lemon juice"}, {"step": 4, "instruction": "Make tahini dressing with lemon and garlic"}, {"step": 5, "instruction": "Assemble bowl with all components"}]',
     'Mediterranean', ARRAY['vegan', 'healthy'], 35, 15, 'easy', 2, user5_id, true, 189),

    ('Lentil Bolognese', 'Plant-based pasta sauce with red lentils',
     '[{"name": "red lentils", "amount": "300", "unit": "g"}, {"name": "canned tomatoes", "amount": "800", "unit": "g"}, {"name": "carrots", "amount": "2", "unit": "piece"}, {"name": "celery", "amount": "2", "unit": "piece"}, {"name": "onion", "amount": "1", "unit": "piece"}, {"name": "red wine", "amount": "150", "unit": "ml"}]',
     '[{"step": 1, "instruction": "Sauté diced vegetables until soft"}, {"step": 2, "instruction": "Add lentils and cook for 2 minutes"}, {"step": 3, "instruction": "Add wine and let it reduce"}, {"step": 4, "instruction": "Add tomatoes and simmer for 30 minutes"}, {"step": 5, "instruction": "Season and serve over pasta"}]',
     'Italian', ARRAY['vegan', 'healthy'], 45, 15, 'easy', 6, user5_id, true, 167),

    ('Coconut Curry Vegetables', 'Creamy curry with seasonal vegetables',
     '[{"name": "coconut milk", "amount": "400", "unit": "ml"}, {"name": "curry powder", "amount": "2", "unit": "tbsp"}, {"name": "sweet potato", "amount": "2", "unit": "piece"}, {"name": "bell peppers", "amount": "2", "unit": "piece"}, {"name": "spinach", "amount": "200", "unit": "g"}, {"name": "ginger", "amount": "3", "unit": "cm"}]',
     '[{"step": 1, "instruction": "Sauté onion, garlic, and ginger"}, {"step": 2, "instruction": "Add curry powder and cook until fragrant"}, {"step": 3, "instruction": "Add coconut milk and vegetables"}, {"step": 4, "instruction": "Simmer until vegetables are tender"}, {"step": 5, "instruction": "Stir in spinach and serve over rice"}]',
     'Indian', ARRAY['vegan', 'healthy'], 25, 15, 'easy', 4, user5_id, true, 178),

    ('Black Bean Burgers', 'Hearty plant-based burgers',
     '[{"name": "black beans", "amount": "800", "unit": "g"}, {"name": "oats", "amount": "100", "unit": "g"}, {"name": "onion", "amount": "1", "unit": "piece"}, {"name": "garlic", "amount": "2", "unit": "clove"}, {"name": "cumin", "amount": "1", "unit": "tsp"}, {"name": "burger buns", "amount": "4", "unit": "piece"}]',
     '[{"step": 1, "instruction": "Mash black beans, leaving some texture"}, {"step": 2, "instruction": "Mix with oats, onion, and spices"}, {"step": 3, "instruction": "Form into patties and chill"}, {"step": 4, "instruction": "Pan-fry until crispy on both sides"}, {"step": 5, "instruction": "Serve on buns with avocado and lettuce"}]',
     'American', ARRAY['vegan', 'healthy'], 20, 20, 'medium', 4, user5_id, true, 145),

    ('Vegan Chocolate Avocado Mousse', 'Rich dessert made with avocados',
     '[{"name": "ripe avocados", "amount": "3", "unit": "piece"}, {"name": "cocoa powder", "amount": "60", "unit": "g"}, {"name": "maple syrup", "amount": "80", "unit": "ml"}, {"name": "vanilla extract", "amount": "1", "unit": "tsp"}, {"name": "coconut milk", "amount": "100", "unit": "ml"}, {"name": "berries", "amount": "200", "unit": "g"}]',
     '[{"step": 1, "instruction": "Blend avocados until completely smooth"}, {"step": 2, "instruction": "Add cocoa powder and maple syrup"}, {"step": 3, "instruction": "Blend in vanilla and coconut milk"}, {"step": 4, "instruction": "Chill for at least 2 hours"}, {"step": 5, "instruction": "Serve topped with fresh berries"}]',
     'American', ARRAY['vegan', 'healthy'], 0, 15, 'easy', 4, user5_id, true, 234);

    -- American/Comfort Food (10)
    INSERT INTO recipes (title, description, ingredients, steps, cuisine, dietary_tags, cooking_time, prep_time, difficulty, servings, user_id, is_public, view_count) VALUES
    ('Classic Mac and Cheese', 'Creamy baked macaroni with three cheeses',
     '[{"name": "elbow macaroni", "amount": "500", "unit": "g"}, {"name": "cheddar cheese", "amount": "300", "unit": "g"}, {"name": "gruyere cheese", "amount": "150", "unit": "g"}, {"name": "butter", "amount": "60", "unit": "g"}, {"name": "flour", "amount": "60", "unit": "g"}, {"name": "milk", "amount": "500", "unit": "ml"}]',
     '[{"step": 1, "instruction": "Cook macaroni until just al dente"}, {"step": 2, "instruction": "Make roux with butter and flour"}, {"step": 3, "instruction": "Gradually whisk in milk to make béchamel"}, {"step": 4, "instruction": "Melt cheeses into sauce"}, {"step": 5, "instruction": "Combine with pasta, top with breadcrumbs, and bake"}]',
     'American', ARRAY['vegetarian'], 35, 15, 'medium', 6, user4_id, true, 267),

    ('BBQ Pulled Pork', 'Slow-cooked pork shoulder with tangy BBQ sauce',
     '[{"name": "pork shoulder", "amount": "2", "unit": "kg"}, {"name": "brown sugar", "amount": "100", "unit": "g"}, {"name": "paprika", "amount": "2", "unit": "tbsp"}, {"name": "apple cider vinegar", "amount": "150", "unit": "ml"}, {"name": "ketchup", "amount": "200", "unit": "ml"}, {"name": "burger buns", "amount": "8", "unit": "piece"}]',
     '[{"step": 1, "instruction": "Rub pork with spice mixture overnight"}, {"step": 2, "instruction": "Smoke or slow cook for 8-10 hours"}, {"step": 3, "instruction": "Make BBQ sauce with vinegar and ketchup"}, {"step": 4, "instruction": "Shred pork when tender"}, {"step": 5, "instruction": "Mix with sauce and serve on buns"}]',
     'American', ARRAY[]::text[], 600, 20, 'hard', 8, user4_id, true, 298),

    ('Chicken and Waffles', 'Southern comfort food classic',
     '[{"name": "chicken pieces", "amount": "8", "unit": "piece"}, {"name": "flour", "amount": "300", "unit": "g"}, {"name": "buttermilk", "amount": "500", "unit": "ml"}, {"name": "waffle mix", "amount": "400", "unit": "g"}, {"name": "maple syrup", "amount": "200", "unit": "ml"}, {"name": "hot sauce", "amount": "2", "unit": "tbsp"}]',
     '[{"step": 1, "instruction": "Marinate chicken in buttermilk overnight"}, {"step": 2, "instruction": "Dredge in seasoned flour and fry until golden"}, {"step": 3, "instruction": "Make waffles according to package directions"}, {"step": 4, "instruction": "Serve chicken on top of waffles"}, {"step": 5, "instruction": "Drizzle with maple syrup and hot sauce"}]',
     'American', ARRAY[]::text[], 45, 30, 'medium', 4, user4_id, true, 234),

    ('Beef Chili', 'Hearty chili with beans and spices',
     '[{"name": "ground beef", "amount": "500", "unit": "g"}, {"name": "kidney beans", "amount": "800", "unit": "g"}, {"name": "diced tomatoes", "amount": "800", "unit": "g"}, {"name": "onion", "amount": "1", "unit": "piece"}, {"name": "chili powder", "amount": "2", "unit": "tbsp"}, {"name": "cumin", "amount": "1", "unit": "tbsp"}]',
     '[{"step": 1, "instruction": "Brown ground beef with onions"}, {"step": 2, "instruction": "Add spices and cook until fragrant"}, {"step": 3, "instruction": "Add tomatoes and beans"}, {"step": 4, "instruction": "Simmer for 1 hour, stirring occasionally"}, {"step": 5, "instruction": "Serve with cornbread and cheese"}]',
     'American', ARRAY[]::text[], 75, 15, 'easy', 6, user4_id, true, 189),

    ('Fried Chicken', 'Crispy Southern-style fried chicken',
     '[{"name": "chicken pieces", "amount": "8", "unit": "piece"}, {"name": "buttermilk", "amount": "500", "unit": "ml"}, {"name": "flour", "amount": "400", "unit": "g"}, {"name": "paprika", "amount": "2", "unit": "tbsp"}, {"name": "garlic powder", "amount": "1", "unit": "tbsp"}, {"name": "cayenne", "amount": "1", "unit": "tsp"}]',
     '[{"step": 1, "instruction": "Marinate chicken in seasoned buttermilk"}, {"step": 2, "instruction": "Mix flour with spices for coating"}, {"step": 3, "instruction": "Dredge chicken in seasoned flour"}, {"step": 4, "instruction": "Fry in oil heated to 350°F until golden"}, {"step": 5, "instruction": "Drain on paper towels and serve hot"}]',
     'American', ARRAY[]::text[], 30, 240, 'medium', 6, user4_id, true, 278),

    ('Meatloaf', 'Classic comfort food with glaze',
     '[{"name": "ground beef", "amount": "750", "unit": "g"}, {"name": "breadcrumbs", "amount": "150", "unit": "g"}, {"name": "eggs", "amount": "2", "unit": "piece"}, {"name": "onion", "amount": "1", "unit": "piece"}, {"name": "ketchup", "amount": "100", "unit": "ml"}, {"name": "worcestershire", "amount": "2", "unit": "tbsp"}]',
     '[{"step": 1, "instruction": "Mix ground beef with breadcrumbs and eggs"}, {"step": 2, "instruction": "Add sautéed onions and seasonings"}, {"step": 3, "instruction": "Form into loaf shape in baking dish"}, {"step": 4, "instruction": "Top with ketchup glaze"}, {"step": 5, "instruction": "Bake for 1 hour until cooked through"}]',
     'American', ARRAY[]::text[], 60, 15, 'easy', 6, user4_id, true, 167),

    ('Pancakes', 'Fluffy American breakfast pancakes',
     '[{"name": "flour", "amount": "300", "unit": "g"}, {"name": "milk", "amount": "400", "unit": "ml"}, {"name": "eggs", "amount": "2", "unit": "piece"}, {"name": "sugar", "amount": "50", "unit": "g"}, {"name": "baking powder", "amount": "2", "unit": "tsp"}, {"name": "butter", "amount": "50", "unit": "g"}]',
     '[{"step": 1, "instruction": "Mix dry ingredients in large bowl"}, {"step": 2, "instruction": "Whisk together wet ingredients"}, {"step": 3, "instruction": "Combine wet and dry, don''t overmix"}, {"step": 4, "instruction": "Cook on griddle until bubbles form"}, {"step": 5, "instruction": "Flip and cook until golden brown"}]',
     'American', ARRAY['vegetarian'], 20, 10, 'easy', 4, user4_id, true, 245),

    ('Grilled Cheese and Tomato Soup', 'Classic comfort food combination',
     '[{"name": "bread", "amount": "8", "unit": "slice"}, {"name": "cheddar cheese", "amount": "200", "unit": "g"}, {"name": "butter", "amount": "60", "unit": "g"}, {"name": "canned tomatoes", "amount": "800", "unit": "g"}, {"name": "heavy cream", "amount": "200", "unit": "ml"}, {"name": "basil", "amount": "10", "unit": "g"}]',
     '[{"step": 1, "instruction": "Make tomato soup by simmering tomatoes with cream"}, {"step": 2, "instruction": "Butter bread and add cheese between slices"}, {"step": 3, "instruction": "Grill sandwiches until golden and cheese melts"}, {"step": 4, "instruction": "Blend soup until smooth, season with basil"}, {"step": 5, "instruction": "Serve sandwiches with hot soup"}]',
     'American', ARRAY['vegetarian'], 25, 10, 'easy', 4, user4_id, true, 198),

    ('Apple Pie', 'Traditional American dessert with flaky crust',
     '[{"name": "apples", "amount": "8", "unit": "piece"}, {"name": "flour", "amount": "400", "unit": "g"}, {"name": "butter", "amount": "200", "unit": "g"}, {"name": "sugar", "amount": "150", "unit": "g"}, {"name": "cinnamon", "amount": "2", "unit": "tsp"}, {"name": "lemon juice", "amount": "2", "unit": "tbsp"}]',
     '[{"step": 1, "instruction": "Make pie crust with flour, butter, and water"}, {"step": 2, "instruction": "Peel and slice apples, toss with sugar and cinnamon"}, {"step": 3, "instruction": "Roll out bottom crust and fill with apples"}, {"step": 4, "instruction": "Cover with top crust, seal edges"}, {"step": 5, "instruction": "Bake until crust is golden and filling bubbles"}]',
     'American', ARRAY['vegetarian'], 60, 45, 'hard', 8, user4_id, true, 312),

    ('Buffalo Wings', 'Spicy chicken wings with blue cheese dip',
     '[{"name": "chicken wings", "amount": "1", "unit": "kg"}, {"name": "hot sauce", "amount": "150", "unit": "ml"}, {"name": "butter", "amount": "100", "unit": "g"}, {"name": "blue cheese", "amount": "150", "unit": "g"}, {"name": "sour cream", "amount": "200", "unit": "ml"}, {"name": "celery", "amount": "4", "unit": "piece"}]',
     '[{"step": 1, "instruction": "Bake wings at high heat until crispy"}, {"step": 2, "instruction": "Make buffalo sauce with hot sauce and butter"}, {"step": 3, "instruction": "Toss hot wings in buffalo sauce"}, {"step": 4, "instruction": "Make blue cheese dip with sour cream"}, {"step": 5, "instruction": "Serve with celery sticks and dip"}]',
     'American', ARRAY[]::text[], 45, 15, 'easy', 6, user4_id, true, 223);

    -- Store recipe IDs for later use
    SELECT array_agg(id) INTO recipe_ids FROM recipes;

    RAISE NOTICE 'Created 50 recipes successfully';

    -- Now create sample search history for users
    INSERT INTO user_search_history (user_id, search_query, search_type, filters_applied, results_count, clicked_recipe_id) VALUES
    (user1_id, 'pasta carbonara', 'general', '{"cuisine": ["Italian"]}', 5, recipe_ids[1]),
    (user1_id, 'italian cuisine', 'cuisine', '{}', 12, recipe_ids[2]),
    (user1_id, 'risotto', 'general', '{}', 3, recipe_ids[4]),
    (user2_id, 'healthy quinoa', 'general', '{"dietary": ["healthy"]}', 8, recipe_ids[21]),
    (user2_id, 'mediterranean diet', 'cuisine', '{}', 15, recipe_ids[23]),
    (user2_id, 'salmon recipes', 'ingredient', '{}', 6, recipe_ids[22]),
    (user3_id, 'indian curry', 'cuisine', '{}', 10, recipe_ids[13]),
    (user3_id, 'chicken tikka', 'general', '{}', 4, recipe_ids[13]),
    (user3_id, 'spicy food', 'general', '{}', 20, recipe_ids[15]),
    (user4_id, 'quick meals', 'general', '{}', 25, recipe_ids[12]),
    (user4_id, 'family dinner', 'general', '{}', 18, recipe_ids[31]),
    (user4_id, 'chicken recipes', 'ingredient', '{}', 30, recipe_ids[11]),
    (user5_id, 'vegan recipes', 'dietary', '{"dietary": ["vegan"]}', 12, recipe_ids[36]),
    (user5_id, 'plant based', 'dietary', '{}', 15, recipe_ids[37]),
    (user5_id, 'lentil dishes', 'ingredient', '{}', 8, recipe_ids[37]);

    -- Create recipe ratings
    INSERT INTO recipe_ratings (recipe_id, user_id, rating) VALUES
    (recipe_ids[1], user2_id, 5), (recipe_ids[1], user3_id, 4), (recipe_ids[1], user4_id, 5),
    (recipe_ids[2], user1_id, 5), (recipe_ids[2], user3_id, 4), (recipe_ids[2], user5_id, 3),
    (recipe_ids[11], user1_id, 4), (recipe_ids[11], user2_id, 5), (recipe_ids[11], user3_id, 4),
    (recipe_ids[13], user1_id, 5), (recipe_ids[13], user2_id, 4), (recipe_ids[13], user4_id, 5),
    (recipe_ids[21], user1_id, 4), (recipe_ids[21], user3_id, 5), (recipe_ids[21], user4_id, 4),
    (recipe_ids[31], user1_id, 5), (recipe_ids[31], user2_id, 4), (recipe_ids[31], user5_id, 3),
    (recipe_ids[36], user1_id, 4), (recipe_ids[36], user2_id, 5), (recipe_ids[36], user3_id, 4),
    (recipe_ids[41], user2_id, 5), (recipe_ids[41], user3_id, 4), (recipe_ids[41], user5_id, 5);

    -- Create recipe comments
    INSERT INTO recipe_comments (recipe_id, user_id, comment) VALUES
    (recipe_ids[1], user2_id, 'Absolutely perfect! Just like my nonna used to make. The key is using good quality guanciale.'),
    (recipe_ids[1], user3_id, 'Great recipe, though I added a bit more black pepper. Turned out amazing!'),
    (recipe_ids[2], user3_id, 'Best pizza dough recipe I''ve tried. The crust was perfectly crispy.'),
    (recipe_ids[11], user1_id, 'This is my go-to weeknight dinner. So quick and flavorful!'),
    (recipe_ids[13], user2_id, 'Love this curry! I used coconut milk instead of heavy cream for a lighter version.'),
    (recipe_ids[21], user4_id, 'Perfect for meal prep. I made a big batch and ate it all week.'),
    (recipe_ids[31], user2_id, 'Kids loved this! Finally found a way to get them to eat more vegetables.'),
    (recipe_ids[36], user3_id, 'Amazing vegan dish. Even my meat-loving friends were impressed.'),
    (recipe_ids[41], user5_id, 'Comfort food at its finest. Reminds me of childhood dinners.');

    -- Create saved recipes
    INSERT INTO saved_recipes (user_id, recipe_id) VALUES
    (user1_id, recipe_ids[13]), (user1_id, recipe_ids[21]), (user1_id, recipe_ids[36]),
    (user2_id, recipe_ids[1]), (user2_id, recipe_ids[11]), (user2_id, recipe_ids[22]), (user2_id, recipe_ids[23]),
    (user3_id, recipe_ids[2]), (user3_id, recipe_ids[31]), (user3_id, recipe_ids[41]),
    (user4_id, recipe_ids[12]), (user4_id, recipe_ids[21]), (user4_id, recipe_ids[32]), (user4_id, recipe_ids[42]),
    (user5_id, recipe_ids[24]), (user5_id, recipe_ids[37]), (user5_id, recipe_ids[38]);

    -- Create recipe collections
    INSERT INTO recipe_collections (user_id, name, description, recipe_ids, is_public) VALUES
    (user1_id, 'Italian Classics', 'My favorite traditional Italian recipes', ARRAY[recipe_ids[1], recipe_ids[2], recipe_ids[3], recipe_ids[4]], true),
    (user2_id, 'Healthy Weeknight Dinners', 'Quick and nutritious meals for busy evenings', ARRAY[recipe_ids[21], recipe_ids[22], recipe_ids[24], recipe_ids[27]], true),
    (user3_id, 'Spice Route', 'Flavorful dishes from around Asia', ARRAY[recipe_ids[13], recipe_ids[15], recipe_ids[16], recipe_ids[17]], true),
    (user4_id, 'Family Favorites', 'Crowd-pleasing recipes the whole family loves', ARRAY[recipe_ids[31], recipe_ids[41], recipe_ids[42], recipe_ids[47]], false),
    (user5_id, 'Plant-Based Power', 'Delicious and satisfying vegan meals', ARRAY[recipe_ids[36], recipe_ids[37], recipe_ids[38], recipe_ids[39]], true);

    -- Create user follows
    INSERT INTO user_follows (follower_id, followed_id) VALUES
    (user1_id, user3_id), (user1_id, user5_id),
    (user2_id, user1_id), (user2_id, user5_id),
    (user3_id, user1_id), (user3_id, user2_id),
    (user4_id, user1_id), (user4_id, user2_id), (user4_id, user3_id),
    (user5_id, user2_id), (user5_id, user3_id);

    -- Generate initial recommendations for all users
    PERFORM generate_search_based_recommendations(user1_id);
    PERFORM generate_search_based_recommendations(user2_id);
    PERFORM generate_search_based_recommendations(user3_id);
    PERFORM generate_search_based_recommendations(user4_id);
    PERFORM generate_search_based_recommendations(user5_id);

    RAISE NOTICE 'Sample data creation completed successfully!';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '- 5 users with profiles and preferences';
    RAISE NOTICE '- 50 diverse recipes across multiple cuisines';
    RAISE NOTICE '- Search history for all users';
    RAISE NOTICE '- Recipe ratings and comments';
    RAISE NOTICE '- Saved recipes and collections';
    RAISE NOTICE '- User follows and social connections';
    RAISE NOTICE '- Generated recommendations for all users';

END $$;