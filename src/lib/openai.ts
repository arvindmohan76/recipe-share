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
    console.warn('OpenAI API key not configured. AI features are disabled.');
    return null;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a culinary expert who writes mouth-watering, sensory-rich recipe descriptions that make people want to cook immediately. Focus on flavors, textures, aromas, and the cooking experience.'
        },
        {
          role: 'user',
          content: `Write a compelling, appetizing summary for this recipe: ${recipe.title}. Description: ${recipe.description}. Make it irresistible and focus on the sensory experience.`
        }
      ],
      max_tokens: 150,
      temperature: 0.8
    });

    return response.choices[0]?.message?.content || null;
  } catch (error) {
    console.error('Error generating recipe summary:', error);
    return null;
  }
}

export async function generateCookingTips(recipe: any, stepIndex: number): Promise<string | null> {
  if (!openai) {
    console.warn('OpenAI API key not configured. AI features are disabled.');
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
          content: `For this cooking step: "${currentStep}", provide a helpful tip or technique that will improve the result. Keep it concise and practical.`
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