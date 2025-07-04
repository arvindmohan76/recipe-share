import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, this should be done server-side
});

export interface RecipeIngredient {
  name: string;
  amount: string;
  unit: string;
}

export interface RecipeStep {
  step: number;
  instruction: string;
  tips?: string;
}

/**
 * Generate a mouth-watering, sensory-rich summary of a recipe using OpenAI
 */
export const generateRecipeSummary = async (
  title: string,
  ingredients: RecipeIngredient[],
  steps: RecipeStep[],
  cuisine?: string,
  difficulty?: string,
  cookingTime?: number
): Promise<string> => {
  try {
    // Prepare ingredients list for the prompt
    const ingredientsList = ingredients
      .map(ing => `${ing.amount} ${ing.unit} ${ing.name}`)
      .join(', ');

    // Prepare cooking steps for the prompt
    const stepsList = steps
      .map(step => `${step.step}. ${step.instruction}`)
      .join(' ');

    // Create a detailed prompt for generating sensory-rich descriptions
    const prompt = `You are a master food writer and culinary poet. Create a mouth-watering, sensory-rich description of this recipe that makes readers crave the dish just by reading about it. Focus on textures, aromas, flavors, sounds, and visual appeal.

Recipe: ${title}
Cuisine: ${cuisine || 'International'}
Difficulty: ${difficulty || 'Medium'}
Cooking Time: ${cookingTime || 'Unknown'} minutes

Ingredients: ${ingredientsList}

Cooking Steps: ${stepsList}

Write a passionate, evocative description (150-200 words) that:
- Uses vivid sensory language (sizzling, aromatic, golden, tender, etc.)
- Describes textures, colors, aromas, and flavors in detail
- Creates anticipation and desire for the dish
- Mentions key cooking techniques and their sensory effects
- Captures the essence of the cuisine and cooking experience
- Makes the reader feel like they can taste, smell, and see the dish

Style: Write like a food magazine feature or cookbook introduction - passionate, descriptive, and appetizing. Avoid generic descriptions and focus on what makes this specific dish irresistible.

Example style (for reference): "Charred to smoky perfection, each cube of paneer is marinated in a symphony of yogurt, ginger, garlic, and hand-ground spices that dance on your tongue with every bite. The edges are crisp, kissed by the flames, while the center remains creamy and tender—melting like silk."

Description:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a master food writer specializing in creating sensory-rich, mouth-watering descriptions of recipes. Your writing should make readers crave the dish through vivid imagery and sensory language."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.8, // Higher creativity for more vivid descriptions
      presence_penalty: 0.3,
      frequency_penalty: 0.3
    });

    const summary = completion.choices[0]?.message?.content?.trim();
    
    if (!summary) {
      throw new Error('No summary generated');
    }

    return summary;
  } catch (error) {
    console.error('Error generating recipe summary:', error);
    
    // Fallback to a basic description if OpenAI fails
    return generateFallbackSummary(title, ingredients, cuisine);
  }
};

/**
 * Generate cooking tips and suggestions using OpenAI
 */
export const generateCookingTips = async (
  title: string,
  ingredients: RecipeIngredient[],
  steps: RecipeStep[],
  difficulty?: string
): Promise<string[]> => {
  try {
    const ingredientsList = ingredients
      .map(ing => `${ing.amount} ${ing.unit} ${ing.name}`)
      .join(', ');

    const prompt = `As a professional chef, provide 3-5 expert cooking tips for this recipe:

Recipe: ${title}
Difficulty: ${difficulty || 'Medium'}
Ingredients: ${ingredientsList}

Provide practical, specific tips that will help home cooks achieve the best results. Focus on:
- Ingredient preparation techniques
- Cooking temperature and timing advice
- Common mistakes to avoid
- Flavor enhancement suggestions
- Texture and presentation tips

Format as a simple list of tips, each starting with a cooking emoji and being concise but helpful.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional chef providing practical cooking advice to home cooks."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    const tipsText = completion.choices[0]?.message?.content?.trim();
    
    if (!tipsText) {
      return [];
    }

    // Split into individual tips and clean them up
    return tipsText
      .split('\n')
      .filter(tip => tip.trim().length > 0)
      .map(tip => tip.trim())
      .slice(0, 5); // Limit to 5 tips
  } catch (error) {
    console.error('Error generating cooking tips:', error);
    return [];
  }
};

/**
 * Generate ingredient substitutions using OpenAI
 */
export const generateIngredientSubstitutions = async (
  ingredients: RecipeIngredient[],
  dietaryRestrictions?: string[]
): Promise<Record<string, string[]>> => {
  try {
    const ingredientsList = ingredients
      .map(ing => `${ing.amount} ${ing.unit} ${ing.name}`)
      .join(', ');

    const restrictions = dietaryRestrictions?.join(', ') || 'none';

    const prompt = `Provide ingredient substitutions for this recipe, considering dietary restrictions: ${restrictions}

Ingredients: ${ingredientsList}

For each ingredient that could have substitutions, provide 2-3 alternative options. Focus on:
- Common pantry substitutions
- Dietary restriction alternatives (vegan, gluten-free, etc.)
- Seasonal or availability substitutions
- Flavor profile maintenance

Format as: "Original Ingredient: Alternative 1, Alternative 2, Alternative 3"
Only include ingredients that actually have good substitutions.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a culinary expert specializing in ingredient substitutions and dietary accommodations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 250,
      temperature: 0.6
    });

    const substitutionsText = completion.choices[0]?.message?.content?.trim();
    
    if (!substitutionsText) {
      return {};
    }

    // Parse the substitutions into a structured format
    const substitutions: Record<string, string[]> = {};
    
    substitutionsText.split('\n').forEach(line => {
      const [ingredient, alternatives] = line.split(':');
      if (ingredient && alternatives) {
        const cleanIngredient = ingredient.trim();
        const alternativesList = alternatives
          .split(',')
          .map(alt => alt.trim())
          .filter(alt => alt.length > 0);
        
        if (alternativesList.length > 0) {
          substitutions[cleanIngredient] = alternativesList;
        }
      }
    });

    return substitutions;
  } catch (error) {
    console.error('Error generating ingredient substitutions:', error);
    return {};
  }
};

/**
 * Fallback summary generator when OpenAI is not available
 */
const generateFallbackSummary = (
  title: string,
  ingredients: RecipeIngredient[],
  cuisine?: string
): string => {
  const keyIngredients = ingredients
    .slice(0, 3)
    .map(ing => ing.name)
    .join(', ');

  const cuisineText = cuisine ? ` ${cuisine}` : '';

  return `This delicious${cuisineText} recipe for ${title} combines ${keyIngredients} and other carefully selected ingredients to create a flavorful and satisfying dish. Each ingredient is thoughtfully prepared and combined using traditional cooking techniques to bring out the best flavors and textures. The result is a memorable meal that showcases the harmony of ingredients and the art of cooking.`;
};

/**
 * Check if OpenAI is properly configured
 */
export const isOpenAIConfigured = (): boolean => {
  return !!import.meta.env.VITE_OPENAI_API_KEY;
};