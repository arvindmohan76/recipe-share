import OpenAI from 'openai';

// Only initialize OpenAI if the API key is available
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

export const openai = apiKey ? new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true
}) : null;

export const isOpenAIAvailable = !!apiKey;

/**
 * Generate personalized recipe recommendations based on user preferences
 */
export async function generateAIRecommendations(
  userPreferences: any,
  availableRecipes: any[]
): Promise<any[]> {
  if (!openai) {
    return [];
  }

  try {
    // Prepare user preference data for the AI
    const searchHistory = userPreferences.searchHistory || [];
    const savedRecipes = userPreferences.savedRecipes || [];
    const viewedRecipes = userPreferences.viewedRecipes || [];
    
    // Extract search terms and viewed recipe details
    const searchTerms = searchHistory.map((item: any) => item.search_query).join(', ');
    const savedRecipeTitles = savedRecipes.map((recipe: any) => recipe.title).join(', ');
    const savedRecipeCuisines = [...new Set(savedRecipes.map((recipe: any) => recipe.cuisine))].join(', ');
    const savedRecipeDietary = [...new Set(savedRecipes.flatMap((recipe: any) => recipe.dietary_tags || []))].join(', ');
    
    // Create a list of available recipes for the AI to choose from
    const availableRecipeData = availableRecipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      cuisine: recipe.cuisine,
      dietary_tags: recipe.dietary_tags,
      difficulty: recipe.difficulty,
      cooking_time: recipe.cooking_time,
      description: recipe.description?.substring(0, 100) + '...'
    }));

    // Generate recommendations using OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a culinary recommendation expert that analyzes user preferences and suggests personalized recipes.
          Your task is to select the most relevant recipes for a user based on their search history, saved recipes, and viewing patterns.
          For each recommendation, provide a brief explanation of why it matches their preferences.
          Focus on cuisine types, ingredients, dietary preferences, and cooking difficulty that align with the user's history.`
        },
        {
          role: 'user',
          content: `Generate personalized recipe recommendations for a user with the following preferences:
          
          Search History: ${searchTerms || 'No search history available'}
          Saved Recipe Titles: ${savedRecipeTitles || 'No saved recipes'}
          Preferred Cuisines: ${savedRecipeCuisines || 'No cuisine preference detected'}
          Dietary Preferences: ${savedRecipeDietary || 'No dietary preferences detected'}
          
          Available Recipes:
          ${JSON.stringify(availableRecipeData, null, 2)}
          
          Select 6-10 recipes from the available list that best match this user's preferences.
          For each recommendation, include:
          1. The recipe ID
          2. A confidence score between 0.1 and 0.9 indicating how well it matches their preferences
          3. A brief, personalized explanation of why this recipe was recommended (1-2 sentences)
          4. The recommendation type (one of: "search_history", "saved_recipes", "similar_users", "trending", "seasonal")
          
          Return the results as a JSON array of objects with the following structure:
          [
            {
              "recipe_id": "the-recipe-id",
              "confidence_score": 0.85,
              "reasoning": "This recipe was recommended because...",
              "recommendation_type": "search_history"
            }
          ]
          
          IMPORTANT: Only include recipes from the available list. Do not make up recipe IDs.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7
    });

    const responseText = response.choices[0]?.message?.content || '';
    
    try {
      const parsedResponse = JSON.parse(responseText);
      const recommendations = parsedResponse.recommendations || [];
      
      // Validate and format recommendations
      return recommendations.map((rec: any) => ({
        recipe_id: rec.recipe_id,
        confidence_score: Math.min(0.9, Math.max(0.1, rec.confidence_score)),
        reasoning: rec.reasoning,
        recommendation_type: rec.recommendation_type
      }));
    } catch (parseError) {
      console.error('Error parsing AI recommendations:', parseError);
      return [];
    }
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    return [];
  }
}

export async function generateRecipeSummary(recipe: any): Promise<string | null> {
  if (!openai) {
    return null;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a culinary expert who writes mouth-watering, sensory-rich recipe descriptions that make people want to cook immediately. Focus on flavors, textures, aromas, and the cooking experience. Write in an engaging, appetizing style that makes the food sound irresistible.'
        },
        {
          role: 'user',
          content: `Write a compelling, appetizing summary for this recipe: "${recipe.title}". 
          
          Cuisine: ${recipe.cuisine || 'Not specified'}
          Difficulty: ${recipe.difficulty || 'Not specified'}
          Cooking Time: ${recipe.cookingTime || recipe.cooking_time || 'Not specified'} minutes
          Dietary Tags: ${recipe.dietaryTags?.join(', ') || recipe.dietary_tags?.join(', ') || 'None'}
          
          Key Ingredients: ${recipe.ingredients?.map((ing: any) => {
            const amount = ing.amount?.trim() || '';
            const unit = ing.unit?.trim() || '';
            const name = ing.name?.trim() || '';
            return `${amount} ${unit} ${name}`.trim();
          }).filter(Boolean).join(', ') || 'Not specified'}
          
          Cooking Steps: ${recipe.steps?.length > 0 ? recipe.steps.map((step: any, index: number) => `${index + 1}. ${step.instruction || step}`).join(' ') : 'Steps will be added later'}
          
          IMPORTANT: Write a compelling, mouth-watering description in EXACTLY 50 words or less that focuses on:
          - MUST mention the cuisine type prominently (e.g., "This authentic Italian...", "Traditional Korean flavors...", "Classic French technique...")
          - Rich sensory details based on the specific ingredients listed above
          - How the key ingredients combine to create amazing flavors
          - Texture contrasts and flavor combinations from these specific ingredients
          - Cultural authenticity and traditional cooking methods when relevant to the cuisine
          - Use vivid, appetizing language that makes readers crave this dish
          - Focus on what makes this specific combination of ingredients irresistible
          - Write in an engaging, enthusiastic tone
          - MUST be 50 words or less - this is critical for UX
          
          Example styles (adapt to actual cuisine and ingredients): 
          - "This authentic Italian pasta combines al dente noodles with rich, slow-simmered tomato sauce..."
          - "Traditional Korean flavors burst through tender beef, crisp vegetables, and spicy gochujang..."
          - "Classic French technique creates silky béchamel that melts perfectly with caramelized onions..."
          
          Make this recipe sound absolutely irresistible using the specific cuisine and ingredients provided! Remember: 50 words maximum with cuisine prominence.`
        }
      ],
      max_tokens: 80, // Reduced to ensure 50-word limit
      temperature: 0.8 // Slightly reduced for more focused output
    });

    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('Error generating recipe summary:', error);
    return null;
  }
}

export async function generateCookingTips(recipe: any, stepIndex: number): Promise<string | null> {
  if (!openai) {
    return null;
  }

  try {
    const steps = Array.isArray(recipe.steps) ? recipe.steps : [];
    const currentStep = steps[stepIndex];
    
    if (!currentStep) return null;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a professional chef providing helpful cooking tips and techniques. Give practical, actionable advice that improves cooking results.'
        },
        {
          role: 'user',
          content: `For this cooking step: "${currentStep.instruction || currentStep}", provide a helpful tip or technique that will improve the result. Keep it concise and practical. Focus on technique, timing, or common mistakes to avoid.`
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('Error generating cooking tips:', error);
    return null;
  }
}