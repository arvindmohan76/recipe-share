import OpenAI from 'openai';

// Only initialize OpenAI if the API key is available
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

export const openai = apiKey ? new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true
}) : null;

export const isOpenAIAvailable = !!apiKey;

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
          
          Description: ${recipe.description || 'No description provided'}
          Cuisine: ${recipe.cuisine || 'Not specified'}
          Difficulty: ${recipe.difficulty || 'Not specified'}
          Cooking Time: ${recipe.cookingTime || recipe.cooking_time || 'Not specified'} minutes
          Dietary Tags: ${recipe.dietaryTags?.join(', ') || recipe.dietary_tags?.join(', ') || 'None'}
          
          Ingredients: ${recipe.ingredients?.map((ing: any) => `${ing.amount} ${ing.unit} ${ing.name}`).join(', ') || 'Not specified'}
          
          Cooking Steps: ${recipe.steps?.length > 0 ? recipe.steps.map((step: any, index: number) => `${index + 1}. ${step.instruction || step}`).join(' ') : 'Steps will be added later'}
          
          Write a compelling, mouth-watering description that focuses on:
          - Rich sensory details: how it looks, smells, tastes, and feels
          - The cooking aromas and sounds that fill the kitchen
          - Texture contrasts and flavor combinations
          - The satisfaction and comfort the dish provides
          - Use vivid, appetizing language that makes readers crave this dish
          - Focus on what makes this recipe special and irresistible
          - Keep it between 80-120 words for easy reading
          - Write in an engaging, enthusiastic tone that celebrates the food
          
          Example style: "Golden, crispy edges give way to a tender, melting center as aromatic herbs dance with rich, savory flavors. Each bite delivers a symphony of textures..."
          
          Make this recipe sound absolutely irresistible!`
        }
      ],
      max_tokens: 200,
      temperature: 0.9
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