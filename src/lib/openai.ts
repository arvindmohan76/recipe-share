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
          - Rich sensory details based on the specific ingredients listed above
          - How the key ingredients combine to create amazing flavors
          - Texture contrasts and flavor combinations from these specific ingredients
          - Use vivid, appetizing language that makes readers crave this dish
          - Focus on what makes this specific combination of ingredients irresistible
          - Write in an engaging, enthusiastic tone
          - MUST be 50 words or less - this is critical for UX
          
          Example style (but adapt to the actual ingredients): "Golden, crispy edges give way to tender centers as aromatic garlic and herbs dance with rich, savory flavors..."
          
          Make this recipe sound absolutely irresistible using the specific ingredients provided! Remember: 50 words maximum.`
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