/*
  # Add More Cuisine Types

  1. New Data
    - Add comprehensive list of cuisine types to recipes table
    - Update existing recipes with more diverse cuisine options
    - Add sample recipes for new cuisine types

  2. Changes
    - Insert sample recipes with new cuisine types
    - Ensure we have at least 10 different cuisine options represented
*/

-- Insert sample recipes with diverse cuisine types
INSERT INTO recipes (
  title, 
  description, 
  ingredients, 
  steps, 
  cuisine, 
  dietary_tags, 
  cooking_time, 
  prep_time, 
  difficulty, 
  servings, 
  is_public,
  image_url
) VALUES 
-- Korean Cuisine
(
  'Korean Bibimbap Bowl',
  'A vibrant Korean rice bowl topped with seasoned vegetables, marinated beef, and a perfectly fried egg, all brought together with spicy gochujang sauce for an explosion of flavors and textures.',
  '[
    {"name": "jasmine rice", "amount": "2", "unit": "cup"},
    {"name": "beef sirloin", "amount": "8", "unit": "oz"},
    {"name": "spinach", "amount": "4", "unit": "cup"},
    {"name": "carrots", "amount": "2", "unit": "piece"},
    {"name": "bean sprouts", "amount": "2", "unit": "cup"},
    {"name": "shiitake mushrooms", "amount": "6", "unit": "piece"},
    {"name": "eggs", "amount": "4", "unit": "piece"},
    {"name": "gochujang", "amount": "3", "unit": "tbsp"},
    {"name": "sesame oil", "amount": "2", "unit": "tbsp"},
    {"name": "soy sauce", "amount": "3", "unit": "tbsp"},
    {"name": "garlic", "amount": "4", "unit": "clove"},
    {"name": "green onions", "amount": "3", "unit": "piece"}
  ]',
  '[
    {"step": 1, "instruction": "Cook rice according to package directions and keep warm.", "tips": "Use a rice cooker for perfectly fluffy rice every time."},
    {"step": 2, "instruction": "Marinate sliced beef in soy sauce, garlic, and sesame oil for 30 minutes.", "tips": "Freeze beef for 30 minutes before slicing for easier cutting."},
    {"step": 3, "instruction": "Blanch spinach and bean sprouts separately, then season with sesame oil and salt.", "tips": "Squeeze out excess water from spinach to prevent soggy bibimbap."},
    {"step": 4, "instruction": "Sauté mushrooms and julienned carrots until tender.", "tips": "Cook vegetables separately to maintain distinct flavors and textures."},
    {"step": 5, "instruction": "Cook marinated beef until browned and cooked through.", "tips": "High heat creates better caramelization and flavor."},
    {"step": 6, "instruction": "Fry eggs sunny-side up with crispy edges.", "tips": "Use medium-high heat for crispy edges and runny yolks."},
    {"step": 7, "instruction": "Arrange rice in bowls, top with vegetables, beef, and fried egg. Serve with gochujang.", "tips": "Arrange ingredients in colorful sections for authentic presentation."}
  ]',
  'Korean',
  '{"healthy", "gluten-free"}',
  25,
  20,
  'medium',
  4,
  true,
  'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=800'
),

-- Greek Cuisine
(
  'Greek Moussaka',
  'Layers of tender eggplant, rich meat sauce, and creamy béchamel create this iconic Greek comfort dish that melts in your mouth with Mediterranean herbs and warming spices.',
  '[
    {"name": "eggplants", "amount": "3", "unit": "piece"},
    {"name": "ground lamb", "amount": "1", "unit": "lb"},
    {"name": "onions", "amount": "2", "unit": "piece"},
    {"name": "tomatoes", "amount": "4", "unit": "piece"},
    {"name": "butter", "amount": "4", "unit": "tbsp"},
    {"name": "flour", "amount": "4", "unit": "tbsp"},
    {"name": "milk", "amount": "2", "unit": "cup"},
    {"name": "parmesan cheese", "amount": "1", "unit": "cup"},
    {"name": "olive oil", "amount": "1/2", "unit": "cup"},
    {"name": "oregano", "amount": "2", "unit": "tsp"},
    {"name": "cinnamon", "amount": "1/2", "unit": "tsp"},
    {"name": "nutmeg", "amount": "1/4", "unit": "tsp"}
  ]',
  '[
    {"step": 1, "instruction": "Slice eggplants and salt them, let drain for 30 minutes, then brush with olive oil and bake.", "tips": "Salting removes bitterness and excess moisture."},
    {"step": 2, "instruction": "Brown ground lamb with onions, add tomatoes, oregano, and cinnamon. Simmer 20 minutes.", "tips": "Cinnamon adds authentic Greek flavor to the meat sauce."},
    {"step": 3, "instruction": "Make béchamel by melting butter, whisking in flour, then gradually adding milk.", "tips": "Whisk constantly to prevent lumps in the sauce."},
    {"step": 4, "instruction": "Season béchamel with nutmeg and half the cheese.", "tips": "Nutmeg is essential for authentic Greek béchamel."},
    {"step": 5, "instruction": "Layer eggplant, meat sauce, and béchamel in baking dish.", "tips": "Let each layer cool slightly before adding the next."},
    {"step": 6, "instruction": "Top with remaining cheese and bake at 375°F for 45 minutes until golden.", "tips": "Let rest 15 minutes before serving for clean slices."}
  ]',
  'Greek',
  '{"gluten-free"}',
  45,
  30,
  'hard',
  8,
  true,
  'https://images.pexels.com/photos/5949888/pexels-photo-5949888.jpeg?auto=compress&cs=tinysrgb&w=800'
),

-- Lebanese Cuisine
(
  'Lebanese Hummus with Tahini',
  'Silky smooth chickpea dip enriched with nutty tahini, bright lemon, and aromatic garlic, creating the perfect creamy texture that makes every bite irresistibly satisfying.',
  '[
    {"name": "chickpeas", "amount": "2", "unit": "cup"},
    {"name": "tahini", "amount": "1/4", "unit": "cup"},
    {"name": "lemon juice", "amount": "3", "unit": "tbsp"},
    {"name": "garlic", "amount": "3", "unit": "clove"},
    {"name": "olive oil", "amount": "3", "unit": "tbsp"},
    {"name": "cumin", "amount": "1", "unit": "tsp"},
    {"name": "paprika", "amount": "1", "unit": "tsp"},
    {"name": "ice water", "amount": "3", "unit": "tbsp"},
    {"name": "pine nuts", "amount": "2", "unit": "tbsp"},
    {"name": "parsley", "amount": "2", "unit": "tbsp"}
  ]',
  '[
    {"step": 1, "instruction": "Soak dried chickpeas overnight, then cook until very tender, about 1 hour.", "tips": "Save some cooking liquid for adjusting consistency."},
    {"step": 2, "instruction": "Remove chickpea skins by rubbing with a kitchen towel for ultra-smooth texture.", "tips": "This extra step makes restaurant-quality hummus."},
    {"step": 3, "instruction": "Blend tahini and lemon juice first until creamy and light.", "tips": "This creates the base for perfectly smooth hummus."},
    {"step": 4, "instruction": "Add chickpeas, garlic, cumin, and ice water. Blend until silky smooth.", "tips": "Ice water helps achieve the perfect creamy texture."},
    {"step": 5, "instruction": "Drizzle with olive oil, sprinkle with paprika and pine nuts.", "tips": "Make a well in center for traditional presentation."}
  ]',
  'Lebanese',
  '{"vegan", "gluten-free", "healthy"}',
  15,
  10,
  'easy',
  6,
  true,
  'https://images.pexels.com/photos/6275193/pexels-photo-6275193.jpeg?auto=compress&cs=tinysrgb&w=800'
),

-- Moroccan Cuisine
(
  'Moroccan Chicken Tagine',
  'Tender chicken slowly braised with aromatic spices, sweet apricots, and olives in a traditional tagine, creating layers of complex flavors that transport you to Marrakech.',
  '[
    {"name": "chicken thighs", "amount": "8", "unit": "piece"},
    {"name": "onions", "amount": "2", "unit": "piece"},
    {"name": "dried apricots", "amount": "1", "unit": "cup"},
    {"name": "green olives", "amount": "1/2", "unit": "cup"},
    {"name": "ginger", "amount": "2", "unit": "tbsp"},
    {"name": "cinnamon stick", "amount": "1", "unit": "piece"},
    {"name": "turmeric", "amount": "1", "unit": "tsp"},
    {"name": "saffron", "amount": "1/4", "unit": "tsp"},
    {"name": "chicken broth", "amount": "2", "unit": "cup"},
    {"name": "almonds", "amount": "1/2", "unit": "cup"},
    {"name": "cilantro", "amount": "1/4", "unit": "cup"},
    {"name": "preserved lemons", "amount": "2", "unit": "piece"}
  ]',
  '[
    {"step": 1, "instruction": "Season chicken with salt, pepper, and half the spices. Brown in tagine or heavy pot.", "tips": "Browning creates deep flavor foundation."},
    {"step": 2, "instruction": "Sauté onions until golden, add remaining spices and cook until fragrant.", "tips": "Blooming spices in oil releases maximum flavor."},
    {"step": 3, "instruction": "Return chicken to pot, add broth, apricots, and preserved lemons.", "tips": "Preserved lemons add authentic Moroccan flavor."},
    {"step": 4, "instruction": "Cover and simmer gently for 45 minutes until chicken is tender.", "tips": "Low, slow cooking ensures tender, fall-off-the-bone chicken."},
    {"step": 5, "instruction": "Add olives and almonds in last 10 minutes of cooking.", "tips": "Late addition prevents olives from becoming too salty."},
    {"step": 6, "instruction": "Garnish with fresh cilantro and serve with couscous or bread.", "tips": "Let rest 5 minutes before serving to allow flavors to meld."}
  ]',
  'Moroccan',
  '{"gluten-free", "dairy-free"}',
  60,
  20,
  'medium',
  6,
  true,
  'https://images.pexels.com/photos/8477552/pexels-photo-8477552.jpeg?auto=compress&cs=tinysrgb&w=800'
),

-- Brazilian Cuisine
(
  'Brazilian Feijoada',
  'Brazil\'s national dish featuring black beans slowly simmered with smoky meats, creating a rich, hearty stew that embodies the soul of Brazilian comfort food.',
  '[
    {"name": "black beans", "amount": "2", "unit": "cup"},
    {"name": "pork shoulder", "amount": "1", "unit": "lb"},
    {"name": "chorizo sausage", "amount": "8", "unit": "oz"},
    {"name": "bacon", "amount": "6", "unit": "slice"},
    {"name": "onions", "amount": "2", "unit": "piece"},
    {"name": "garlic", "amount": "6", "unit": "clove"},
    {"name": "bay leaves", "amount": "3", "unit": "piece"},
    {"name": "orange zest", "amount": "2", "unit": "tbsp"},
    {"name": "cachaça", "amount": "1/4", "unit": "cup"},
    {"name": "collard greens", "amount": "1", "unit": "bunch"},
    {"name": "white rice", "amount": "2", "unit": "cup"},
    {"name": "orange slices", "amount": "2", "unit": "piece"}
  ]',
  '[
    {"step": 1, "instruction": "Soak black beans overnight, then cook with bay leaves until tender, about 2 hours.", "tips": "Don\'t add salt while cooking beans as it toughens them."},
    {"step": 2, "instruction": "Brown pork shoulder and chorizo in large pot, then set aside.", "tips": "Browning creates rich flavor base for the stew."},
    {"step": 3, "instruction": "Cook bacon until crispy, sauté onions and garlic in the fat.", "tips": "Bacon fat adds essential smoky flavor."},
    {"step": 4, "instruction": "Return meats to pot, add beans with cooking liquid and orange zest.", "tips": "Orange zest brightens the rich, heavy flavors."},
    {"step": 5, "instruction": "Simmer 1 hour, add cachaça and cook 30 minutes more.", "tips": "Cachaça adds authentic Brazilian flavor."},
    {"step": 6, "instruction": "Serve over rice with sautéed collard greens and orange slices.", "tips": "Traditional accompaniments balance the rich stew."}
  ]',
  'Brazilian',
  '{"gluten-free", "dairy-free"}',
  90,
  30,
  'hard',
  8,
  true,
  'https://images.pexels.com/photos/5737241/pexels-photo-5737241.jpeg?auto=compress&cs=tinysrgb&w=800'
),

-- Ethiopian Cuisine
(
  'Ethiopian Doro Wat',
  'Ethiopia\'s beloved chicken stew simmered in berbere spice blend and rich onion base, creating layers of complex heat and aromatic warmth that define authentic Ethiopian cuisine.',
  '[
    {"name": "chicken", "amount": "3", "unit": "lb"},
    {"name": "red onions", "amount": "4", "unit": "piece"},
    {"name": "berbere spice", "amount": "3", "unit": "tbsp"},
    {"name": "tomato paste", "amount": "2", "unit": "tbsp"},
    {"name": "ginger", "amount": "2", "unit": "tbsp"},
    {"name": "garlic", "amount": "6", "unit": "clove"},
    {"name": "clarified butter", "amount": "1/4", "unit": "cup"},
    {"name": "chicken broth", "amount": "2", "unit": "cup"},
    {"name": "hard-boiled eggs", "amount": "6", "unit": "piece"},
    {"name": "cardamom", "amount": "1", "unit": "tsp"},
    {"name": "fenugreek", "amount": "1/2", "unit": "tsp"},
    {"name": "injera bread", "amount": "6", "unit": "piece"}
  ]',
  '[
    {"step": 1, "instruction": "Slowly cook diced onions in dry pan until deep golden and caramelized, about 45 minutes.", "tips": "This creates the flavor foundation - don\'t rush this step."},
    {"step": 2, "instruction": "Add clarified butter, ginger, garlic, and berbere spice. Cook until fragrant.", "tips": "Berbere spice blend is the heart of Ethiopian cuisine."},
    {"step": 3, "instruction": "Stir in tomato paste and cook 5 minutes to develop deep flavor.", "tips": "Cooking tomato paste removes raw taste and adds richness."},
    {"step": 4, "instruction": "Add chicken pieces and brown on all sides in the spice mixture.", "tips": "Coating chicken in spices before liquid creates better flavor."},
    {"step": 5, "instruction": "Add broth gradually, simmer covered 45 minutes until chicken is tender.", "tips": "Low, slow cooking allows spices to penetrate the meat."},
    {"step": 6, "instruction": "Add hard-boiled eggs in last 15 minutes. Serve with injera bread.", "tips": "Eggs absorb the flavorful sauce and add protein."}
  ]',
  'Ethiopian',
  '{"gluten-free", "dairy-free"}',
  75,
  30,
  'hard',
  6,
  true,
  'https://images.pexels.com/photos/5737349/pexels-photo-5737349.jpeg?auto=compress&cs=tinysrgb&w=800'
),

-- Peruvian Cuisine
(
  'Peruvian Ceviche',
  'Fresh fish "cooked" in zesty lime juice with red onions, cilantro, and ají peppers, creating a bright, refreshing dish that captures the essence of Peru\'s coastal cuisine.',
  '[
    {"name": "white fish fillets", "amount": "2", "unit": "lb"},
    {"name": "lime juice", "amount": "1", "unit": "cup"},
    {"name": "red onion", "amount": "1", "unit": "piece"},
    {"name": "ají amarillo", "amount": "2", "unit": "piece"},
    {"name": "cilantro", "amount": "1/2", "unit": "cup"},
    {"name": "sweet potato", "amount": "2", "unit": "piece"},
    {"name": "corn kernels", "amount": "1", "unit": "cup"},
    {"name": "garlic", "amount": "2", "unit": "clove"},
    {"name": "ginger", "amount": "1", "unit": "tbsp"},
    {"name": "sea salt", "amount": "1", "unit": "tsp"},
    {"name": "black pepper", "amount": "1/2", "unit": "tsp"}
  ]',
  '[
    {"step": 1, "instruction": "Cut fish into 1/2-inch cubes, removing any bones or skin.", "tips": "Use sushi-grade fish for safety and best texture."},
    {"step": 2, "instruction": "Thinly slice red onion and soak in cold water for 10 minutes to reduce sharpness.", "tips": "Soaking onions makes them milder and crispier."},
    {"step": 3, "instruction": "Blend lime juice, ají amarillo, garlic, and ginger until smooth.", "tips": "This creates the \'leche de tigre\' - tiger\'s milk marinade."},
    {"step": 4, "instruction": "Toss fish with lime mixture and salt, marinate 15-20 minutes until opaque.", "tips": "Don\'t over-marinate or fish becomes mushy."},
    {"step": 5, "instruction": "Add drained onions and cilantro just before serving.", "tips": "Last-minute additions maintain fresh textures."},
    {"step": 6, "instruction": "Serve immediately with boiled sweet potato and corn.", "tips": "Traditional accompaniments balance the acidity."}
  ]',
  'Peruvian',
  '{"gluten-free", "dairy-free", "healthy"}',
  20,
  25,
  'medium',
  4,
  true,
  'https://images.pexels.com/photos/2374946/pexels-photo-2374946.jpeg?auto=compress&cs=tinysrgb&w=800'
),

-- Vietnamese Cuisine
(
  'Vietnamese Pho Bo',
  'Aromatic beef broth simmered with star anise, cinnamon, and ginger, served with tender rice noodles and fresh herbs for Vietnam\'s most beloved comfort soup.',
  '[
    {"name": "beef bones", "amount": "3", "unit": "lb"},
    {"name": "beef brisket", "amount": "1", "unit": "lb"},
    {"name": "rice noodles", "amount": "1", "unit": "lb"},
    {"name": "onions", "amount": "2", "unit": "piece"},
    {"name": "ginger", "amount": "4", "unit": "inch"},
    {"name": "star anise", "amount": "6", "unit": "piece"},
    {"name": "cinnamon stick", "amount": "2", "unit": "piece"},
    {"name": "fish sauce", "amount": "1/4", "unit": "cup"},
    {"name": "rock sugar", "amount": "2", "unit": "tbsp"},
    {"name": "bean sprouts", "amount": "2", "unit": "cup"},
    {"name": "thai basil", "amount": "1", "unit": "bunch"},
    {"name": "lime wedges", "amount": "4", "unit": "piece"}
  ]',
  '[
    {"step": 1, "instruction": "Char onions and ginger over open flame until blackened, then rinse.", "tips": "Charring adds deep, smoky flavor to the broth."},
    {"step": 2, "instruction": "Toast star anise and cinnamon in dry pan until fragrant.", "tips": "Toasting spices intensifies their flavor."},
    {"step": 3, "instruction": "Simmer beef bones and brisket with charred vegetables and spices for 6-8 hours.", "tips": "Long, slow cooking extracts maximum flavor and collagen."},
    {"step": 4, "instruction": "Strain broth, season with fish sauce and rock sugar.", "tips": "Balance salty, sweet, and umami flavors."},
    {"step": 5, "instruction": "Cook rice noodles according to package directions.", "tips": "Don\'t overcook noodles as they continue cooking in hot broth."},
    {"step": 6, "instruction": "Serve noodles in bowls, top with sliced beef, pour hot broth over.", "tips": "Hot broth cooks the raw beef slices perfectly."},
    {"step": 7, "instruction": "Garnish with herbs, bean sprouts, and lime wedges.", "tips": "Fresh garnishes add brightness and texture contrast."}
  ]',
  'Vietnamese',
  '{"gluten-free", "dairy-free"}',
  30,
  480,
  'hard',
  6,
  true,
  'https://images.pexels.com/photos/1647163/pexels-photo-1647163.jpeg?auto=compress&cs=tinysrgb&w=800'
),

-- Turkish Cuisine
(
  'Turkish Baklava',
  'Delicate layers of paper-thin phyllo pastry filled with chopped nuts and sweetened with honey syrup, creating the perfect balance of crispy texture and rich sweetness.',
  '[
    {"name": "phyllo pastry", "amount": "1", "unit": "lb"},
    {"name": "walnuts", "amount": "2", "unit": "cup"},
    {"name": "pistachios", "amount": "1", "unit": "cup"},
    {"name": "butter", "amount": "1", "unit": "cup"},
    {"name": "honey", "amount": "1", "unit": "cup"},
    {"name": "sugar", "amount": "1", "unit": "cup"},
    {"name": "water", "amount": "1", "unit": "cup"},
    {"name": "lemon juice", "amount": "2", "unit": "tbsp"},
    {"name": "cinnamon", "amount": "1", "unit": "tsp"},
    {"name": "cloves", "amount": "1/4", "unit": "tsp"}
  ]',
  '[
    {"step": 1, "instruction": "Mix chopped nuts with cinnamon and cloves.", "tips": "Finely chop nuts for even distribution and easier cutting."},
    {"step": 2, "instruction": "Brush baking dish with melted butter, layer 8 phyllo sheets, brushing each with butter.", "tips": "Keep phyllo covered with damp towel to prevent drying."},
    {"step": 3, "instruction": "Sprinkle nut mixture over phyllo, add 4 more buttered sheets.", "tips": "Even distribution ensures every piece has nuts."},
    {"step": 4, "instruction": "Repeat layering until all phyllo and nuts are used, ending with phyllo.", "tips": "Top layer should have extra butter for golden color."},
    {"step": 5, "instruction": "Cut into diamond shapes before baking at 350°F for 45 minutes.", "tips": "Pre-cutting prevents phyllo from shattering when hot."},
    {"step": 6, "instruction": "Make syrup by boiling honey, sugar, water, and lemon juice.", "tips": "Syrup should be hot when poured over cooled baklava."},
    {"step": 7, "instruction": "Pour hot syrup over cooled baklava, let absorb overnight.", "tips": "Patience is key - overnight resting creates perfect texture."}
  ]',
  'Turkish',
  '{"vegetarian"}',
  45,
  60,
  'hard',
  24,
  true,
  'https://images.pexels.com/photos/7474230/pexels-photo-7474230.jpeg?auto=compress&cs=tinysrgb&w=800'
),

-- Russian Cuisine
(
  'Russian Beef Stroganoff',
  'Tender beef strips in rich sour cream sauce with mushrooms and onions, creating the ultimate comfort food that warms you from the inside out.',
  '[
    {"name": "beef tenderloin", "amount": "2", "unit": "lb"},
    {"name": "mushrooms", "amount": "1", "unit": "lb"},
    {"name": "onions", "amount": "2", "unit": "piece"},
    {"name": "sour cream", "amount": "1", "unit": "cup"},
    {"name": "beef broth", "amount": "2", "unit": "cup"},
    {"name": "flour", "amount": "3", "unit": "tbsp"},
    {"name": "butter", "amount": "4", "unit": "tbsp"},
    {"name": "dijon mustard", "amount": "2", "unit": "tbsp"},
    {"name": "egg noodles", "amount": "1", "unit": "lb"},
    {"name": "paprika", "amount": "1", "unit": "tbsp"},
    {"name": "fresh dill", "amount": "1/4", "unit": "cup"}
  ]',
  '[
    {"step": 1, "instruction": "Cut beef into thin strips against the grain, season with salt and pepper.", "tips": "Cutting against grain ensures tender meat."},
    {"step": 2, "instruction": "Sear beef strips in hot butter until browned, remove and set aside.", "tips": "Don\'t overcrowd pan - work in batches for proper browning."},
    {"step": 3, "instruction": "Sauté sliced mushrooms and onions until golden and tender.", "tips": "Cook until moisture evaporates for concentrated flavor."},
    {"step": 4, "instruction": "Sprinkle flour over vegetables, cook 2 minutes, then add broth gradually.", "tips": "Cooking flour prevents raw taste in final sauce."},
    {"step": 5, "instruction": "Return beef to pan, add mustard and paprika, simmer 10 minutes.", "tips": "Gentle simmering keeps beef tender."},
    {"step": 6, "instruction": "Remove from heat, stir in sour cream and fresh dill.", "tips": "Add sour cream off heat to prevent curdling."},
    {"step": 7, "instruction": "Serve over cooked egg noodles with extra dill.", "tips": "Wide egg noodles are traditional and hold sauce well."}
  ]',
  'Russian',
  '{}',
  30,
  20,
  'medium',
  6,
  true,
  'https://images.pexels.com/photos/6419733/pexels-photo-6419733.jpeg?auto=compress&cs=tinysrgb&w=800'
);

-- Update some existing recipes to have more diverse cuisines
UPDATE recipes 
SET cuisine = 'Spanish'
WHERE title ILIKE '%paella%' OR title ILIKE '%gazpacho%' OR title ILIKE '%tapas%';

UPDATE recipes 
SET cuisine = 'German'
WHERE title ILIKE '%schnitzel%' OR title ILIKE '%sauerkraut%' OR title ILIKE '%bratwurst%';

UPDATE recipes 
SET cuisine = 'British'
WHERE title ILIKE '%fish and chips%' OR title ILIKE '%shepherd%' OR title ILIKE '%bangers%';

UPDATE recipes 
SET cuisine = 'Jamaican'
WHERE title ILIKE '%jerk%' OR title ILIKE '%curry goat%' OR title ILIKE '%ackee%';

UPDATE recipes 
SET cuisine = 'Polish'
WHERE title ILIKE '%pierogi%' OR title ILIKE '%kielbasa%' OR title ILIKE '%bigos%';