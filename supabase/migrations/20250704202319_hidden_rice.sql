-- Update all existing recipe descriptions with delicious 50-word descriptions
-- Each description highlights the cuisine and uses sensory language

-- Update existing recipes with mouth-watering descriptions
UPDATE recipes SET description = 'This authentic Italian pasta combines al dente spaghetti with rich, slow-simmered tomato sauce, aromatic basil, and creamy parmesan. Each twirl delivers perfect balance of tangy sweetness and savory depth, creating comfort food that transports you straight to a cozy Roman trattoria with every satisfying bite.' WHERE title ILIKE '%spaghetti%' OR title ILIKE '%pasta%' AND cuisine = 'Italian';

UPDATE recipes SET description = 'Traditional Mexican flavors burst through tender chicken, vibrant bell peppers, and caramelized onions sizzling with cumin and chili. Wrapped in warm tortillas with fresh cilantro and lime, each bite delivers smoky heat and zesty brightness that makes your taste buds dance with authentic south-of-the-border satisfaction.' WHERE title ILIKE '%fajita%' OR title ILIKE '%taco%' AND cuisine = 'Mexican';

UPDATE recipes SET description = 'Classic French technique creates silky béchamel that melts perfectly with caramelized onions and nutty gruyère cheese. Golden, bubbling layers of tender potatoes absorb rich cream, creating luxurious comfort food that embodies the elegance and warmth of traditional French countryside cooking in every decadent spoonful.' WHERE title ILIKE '%gratin%' OR title ILIKE '%french%' AND cuisine = 'French';

UPDATE recipes SET description = 'Authentic Thai flavors explode through coconut milk, lemongrass, and galangal in this aromatic soup. Tender shrimp swim in creamy, spicy broth with mushrooms and lime leaves, delivering perfect balance of heat, sourness, and richness that awakens every sense with traditional Southeast Asian comfort.' WHERE title ILIKE '%tom%' OR title ILIKE '%thai%' AND cuisine = 'Thai';

UPDATE recipes SET description = 'Traditional Japanese precision creates perfectly seasoned sushi rice topped with fresh, buttery salmon. Each piece melts on your tongue, delivering clean ocean flavors and subtle rice wine vinegar tang. Simple ingredients showcase masterful technique, creating an elegant dining experience that celebrates pure, authentic Japanese culinary artistry.' WHERE title ILIKE '%sushi%' OR title ILIKE '%salmon%' AND cuisine = 'Japanese';

UPDATE recipes SET description = 'Authentic Indian spices bloom in rich tomato curry, enveloping tender chicken in aromatic garam masala, turmeric, and ginger. Creamy yogurt balances warming heat while fresh cilantro adds brightness. Each bite delivers complex layers of flavor that transport you to bustling Delhi markets with soul-warming satisfaction.' WHERE title ILIKE '%curry%' OR title ILIKE '%chicken%' AND cuisine = 'Indian';

UPDATE recipes SET description = 'Classic American comfort food featuring juicy beef patty grilled to perfection, topped with melted cheddar, crisp lettuce, and ripe tomato. Nestled in a toasted brioche bun with tangy pickles, each bite delivers satisfying richness and familiar flavors that define timeless American dining pleasure.' WHERE title ILIKE '%burger%' OR title ILIKE '%beef%' AND cuisine = 'American';

UPDATE recipes SET description = 'Traditional Chinese wok technique creates perfectly crispy vegetables and tender protein in savory soy-based sauce. High heat sears ingredients while preserving vibrant colors and textures. Aromatic garlic and ginger infuse every bite with authentic flavors that capture the essence of skilled Chinese street food mastery.' WHERE title ILIKE '%stir%' OR title ILIKE '%wok%' AND cuisine = 'Chinese';

-- Update recipes without specific cuisine matches
UPDATE recipes SET description = 'Golden, crispy edges give way to tender centers as aromatic herbs and spices dance with rich, savory flavors. Each bite delivers perfect texture contrast and warming satisfaction, creating comfort food that brings families together around the table for memorable, delicious moments of pure culinary joy.' 
WHERE description IS NULL OR description = '' OR LENGTH(description) < 20;

-- Update any remaining recipes with generic delicious descriptions based on cooking method
UPDATE recipes SET description = 
CASE 
    WHEN title ILIKE '%grilled%' OR title ILIKE '%bbq%' OR title ILIKE '%barbecue%' THEN 
        'Smoky char marks seal in natural juices while aromatic spices create a caramelized crust. Tender meat falls apart at first bite, delivering rich, flame-kissed flavors that capture the essence of outdoor cooking. Perfect balance of smoke and seasoning creates unforgettable barbecue satisfaction.'
    
    WHEN title ILIKE '%soup%' OR title ILIKE '%stew%' OR title ILIKE '%broth%' THEN 
        'Aromatic steam rises from this soul-warming bowl, carrying herbs and spices that awaken your senses. Tender ingredients meld in rich, flavorful broth that comforts from the first spoonful. Each sip delivers layers of taste that create perfect harmony and lasting satisfaction.'
    
    WHEN title ILIKE '%salad%' OR title ILIKE '%fresh%' THEN 
        'Crisp, vibrant vegetables burst with garden-fresh flavors and satisfying crunch. Bright dressing enhances natural sweetness while herbs add aromatic complexity. Each forkful delivers refreshing lightness and nutritious satisfaction that energizes your body and delights your palate with pure, clean taste.'
    
    WHEN title ILIKE '%bread%' OR title ILIKE '%baked%' THEN 
        'Golden crust crackles to reveal soft, warm interior with perfect texture and aroma. Each slice delivers comforting satisfaction with hints of yeast and grain. Fresh from the oven warmth melts butter perfectly, creating simple pleasure that connects us to timeless baking traditions.'
    
    WHEN title ILIKE '%dessert%' OR title ILIKE '%sweet%' OR title ILIKE '%cake%' OR title ILIKE '%cookie%' THEN 
        'Rich sweetness melts on your tongue while aromatic vanilla and spices create pure indulgence. Perfect texture balances tender crumb with satisfying richness. Each bite delivers comfort and joy, creating sweet memories that linger long after the last delicious morsel disappears.'
    
    ELSE 
        'Expertly crafted flavors combine in perfect harmony, creating a dish that satisfies all your senses. Tender textures and aromatic spices deliver comfort and excitement in every bite. This recipe transforms simple ingredients into extraordinary culinary experience that brings pure joy to your table.'
END
WHERE LENGTH(COALESCE(description, '')) < 50;

-- Ensure all descriptions are exactly 50 words or less by trimming if necessary
UPDATE recipes SET description = 
    CASE 
        WHEN array_length(string_to_array(description, ' '), 1) > 50 THEN
            array_to_string((string_to_array(description, ' '))[1:50], ' ')
        ELSE description
    END
WHERE array_length(string_to_array(description, ' '), 1) > 50;

-- Add cuisine-specific descriptions for recipes missing cuisine information
UPDATE recipes SET 
    cuisine = CASE 
        WHEN title ILIKE '%pizza%' OR title ILIKE '%pasta%' OR title ILIKE '%risotto%' OR title ILIKE '%lasagna%' THEN 'Italian'
        WHEN title ILIKE '%taco%' OR title ILIKE '%burrito%' OR title ILIKE '%quesadilla%' OR title ILIKE '%salsa%' THEN 'Mexican'
        WHEN title ILIKE '%curry%' OR title ILIKE '%naan%' OR title ILIKE '%biryani%' OR title ILIKE '%tandoori%' THEN 'Indian'
        WHEN title ILIKE '%sushi%' OR title ILIKE '%ramen%' OR title ILIKE '%teriyaki%' OR title ILIKE '%miso%' THEN 'Japanese'
        WHEN title ILIKE '%pad thai%' OR title ILIKE '%tom yum%' OR title ILIKE '%green curry%' THEN 'Thai'
        WHEN title ILIKE '%croissant%' OR title ILIKE '%baguette%' OR title ILIKE '%coq au vin%' THEN 'French'
        WHEN title ILIKE '%burger%' OR title ILIKE '%hot dog%' OR title ILIKE '%mac and cheese%' THEN 'American'
        WHEN title ILIKE '%stir fry%' OR title ILIKE '%fried rice%' OR title ILIKE '%dim sum%' THEN 'Chinese'
        WHEN title ILIKE '%paella%' OR title ILIKE '%gazpacho%' OR title ILIKE '%tapas%' THEN 'Spanish'
        WHEN title ILIKE '%fish and chips%' OR title ILIKE '%shepherd%' OR title ILIKE '%bangers%' THEN 'British'
        ELSE COALESCE(cuisine, 'International')
    END
WHERE cuisine IS NULL OR cuisine = '';

-- Update descriptions to include cuisine prominence for newly categorized recipes
UPDATE recipes SET description = 
    CASE cuisine
        WHEN 'Italian' THEN 'Authentic Italian flavors shine through perfectly cooked ingredients and traditional techniques. Rich tomatoes, aromatic herbs, and quality olive oil create layers of taste that transport you to sunny Mediterranean kitchens. Each bite delivers the warmth and passion of true Italian culinary heritage.'
        
        WHEN 'Mexican' THEN 'Traditional Mexican spices and fresh ingredients create vibrant, bold flavors that dance on your palate. Smoky chilies, zesty lime, and aromatic cilantro combine in perfect harmony. Each bite delivers authentic south-of-the-border satisfaction that celebrates Mexico rich culinary traditions.'
        
        WHEN 'Indian' THEN 'Aromatic Indian spices bloom in rich, complex curry that warms your soul. Turmeric, cumin, and garam masala create layers of flavor while creamy yogurt balances the heat. Each spoonful delivers authentic subcontinental taste that showcases India incredible spice mastery.'
        
        WHEN 'Japanese' THEN 'Traditional Japanese precision creates clean, elegant flavors that celebrate ingredient purity. Delicate balance of umami, sweetness, and subtle seasoning reflects centuries of culinary refinement. Each bite delivers authentic taste that honors Japan sophisticated food culture and artistic presentation.'
        
        WHEN 'Thai' THEN 'Authentic Thai flavors burst with perfect balance of sweet, sour, salty, and spicy elements. Fresh herbs, coconut milk, and aromatic spices create complex taste profiles. Each bite delivers the vibrant essence of Southeast Asian cuisine that awakens all your senses.'
        
        WHEN 'French' THEN 'Classic French technique transforms simple ingredients into culinary masterpieces. Rich butter, wine, and herbs create sophisticated flavors that define elegant dining. Each bite delivers the refinement and artistry that makes French cuisine the gold standard of cooking excellence.'
        
        WHEN 'American' THEN 'Classic American comfort food delivers familiar flavors that bring back cherished memories. Quality ingredients and time-tested recipes create satisfying meals that unite families. Each bite provides the hearty satisfaction that defines traditional American home cooking at its finest.'
        
        WHEN 'Chinese' THEN 'Traditional Chinese cooking techniques create perfect balance of flavors, textures, and colors. Aromatic ginger, garlic, and soy sauce enhance fresh ingredients through skilled wok mastery. Each bite delivers authentic taste that celebrates China rich culinary heritage and regional diversity.'
        
        WHEN 'Spanish' THEN 'Vibrant Spanish flavors showcase Mediterranean ingredients and passionate cooking traditions. Saffron, paprika, and olive oil create rich, warming dishes that celebrate life. Each bite delivers the sunny essence of Iberian cuisine that brings joy and festivity to every meal.'
        
        WHEN 'British' THEN 'Traditional British comfort food provides hearty satisfaction with familiar, warming flavors. Quality ingredients and time-honored recipes create meals that nourish body and soul. Each bite delivers the comforting essence of British home cooking that spans generations of family traditions.'
        
        ELSE 'Expertly crafted international flavors combine traditional techniques with quality ingredients. Each element contributes to a harmonious dish that satisfies and delights. Every bite delivers culinary excellence that transcends borders and brings global taste experiences to your table.'
    END
WHERE LENGTH(COALESCE(description, '')) < 30;

-- Final check: ensure all recipes have descriptions and they're under 50 words
UPDATE recipes SET description = 'Delicious combination of fresh ingredients and expert seasoning creates satisfying flavors that please every palate. Perfectly balanced taste and texture deliver comfort and excitement in each bite. This recipe transforms simple cooking into extraordinary dining experience that brings joy to your table.'
WHERE description IS NULL OR description = '' OR LENGTH(TRIM(description)) < 10;