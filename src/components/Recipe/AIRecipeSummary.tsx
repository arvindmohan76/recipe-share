import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Skeleton } from 'primereact/skeleton';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { 
  generateRecipeSummary, 
  generateCookingTips, 
  generateIngredientSubstitutions,
  isOpenAIConfigured,
  RecipeIngredient,
  RecipeStep 
} from '../../lib/openai';

interface AIRecipeSummaryProps {
  title: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  cuisine?: string;
  difficulty?: string;
  cookingTime?: number;
  dietaryTags?: string[];
}

const AIRecipeSummary: React.FC<AIRecipeSummaryProps> = ({
  title,
  ingredients,
  steps,
  cuisine,
  difficulty,
  cookingTime,
  dietaryTags
}) => {
  const [summary, setSummary] = useState<string>('');
  const [tips, setTips] = useState<string[]>([]);
  const [substitutions, setSubstitutions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  const isConfigured = isOpenAIConfigured();

  useEffect(() => {
    // Auto-generate summary if OpenAI is configured and we have the required data
    if (isConfigured && title && ingredients.length > 0 && steps.length > 0 && !hasGenerated) {
      handleGenerateAll();
    }
  }, [title, ingredients, steps, isConfigured]);

  const handleGenerateAll = async () => {
    if (!isConfigured) {
      setError('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Generate all AI content in parallel
      const [summaryResult, tipsResult, substitutionsResult] = await Promise.allSettled([
        generateRecipeSummary(title, ingredients, steps, cuisine, difficulty, cookingTime),
        generateCookingTips(title, ingredients, steps, difficulty),
        generateIngredientSubstitutions(ingredients, dietaryTags)
      ]);

      // Handle summary
      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value);
      } else {
        console.error('Summary generation failed:', summaryResult.reason);
      }

      // Handle tips
      if (tipsResult.status === 'fulfilled') {
        setTips(tipsResult.value);
      } else {
        console.error('Tips generation failed:', tipsResult.reason);
      }

      // Handle substitutions
      if (substitutionsResult.status === 'fulfilled') {
        setSubstitutions(substitutionsResult.value);
      } else {
        console.error('Substitutions generation failed:', substitutionsResult.reason);
      }

      setHasGenerated(true);
    } catch (err) {
      setError('Failed to generate AI content. Please try again.');
      console.error('AI generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSummary = async () => {
    if (!isConfigured) return;

    setLoading(true);
    try {
      const newSummary = await generateRecipeSummary(
        title, 
        ingredients, 
        steps, 
        cuisine, 
        difficulty, 
        cookingTime
      );
      setSummary(newSummary);
    } catch (err) {
      setError('Failed to regenerate summary');
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <Card className="bg-yellow-50 border border-yellow-200">
        <div className="flex items-start gap-3">
          <i className="pi pi-exclamation-triangle text-yellow-600 text-lg mt-1"></i>
          <div>
            <h4 className="font-medium text-yellow-800 mb-2">AI Features Unavailable</h4>
            <p className="text-sm text-yellow-700 mb-3">
              To enable AI-powered recipe summaries and cooking tips, add your OpenAI API key to the environment variables.
            </p>
            <div className="bg-yellow-100 p-3 rounded text-xs text-yellow-800 font-mono">
              VITE_OPENAI_API_KEY=your_openai_api_key_here
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* AI-Generated Summary */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <i className="pi pi-sparkles text-white"></i>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">AI Recipe Summary</h3>
              <p className="text-sm text-gray-600">Mouth-watering description powered by AI</p>
            </div>
          </div>
          <div className="flex gap-2">
            {summary && (
              <Button
                icon="pi pi-refresh"
                className="p-button-text p-button-sm"
                onClick={handleRegenerateSummary}
                loading={loading}
                tooltip="Regenerate summary"
              />
            )}
            {!hasGenerated && (
              <Button
                label="Generate AI Content"
                icon="pi pi-sparkles"
                onClick={handleGenerateAll}
                loading={loading}
                className="p-button-sm"
              />
            )}
          </div>
        </div>

        {error && (
          <Message severity="error" text={error} className="mb-4 w-full" />
        )}

        {loading && !summary ? (
          <div className="space-y-2">
            <Skeleton width="100%" height="1.5rem" />
            <Skeleton width="95%" height="1.5rem" />
            <Skeleton width="90%" height="1.5rem" />
            <Skeleton width="85%" height="1.5rem" />
          </div>
        ) : summary ? (
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-800 leading-relaxed italic text-lg">
              "{summary}"
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <i className="pi pi-sparkles text-4xl text-purple-300 mb-3"></i>
            <p className="text-gray-600">Click "Generate AI Content" to create a delicious description</p>
          </div>
        )}
      </Card>

      {/* Additional AI Content */}
      {(tips.length > 0 || Object.keys(substitutions).length > 0) && (
        <Accordion multiple>
          {/* Cooking Tips */}
          {tips.length > 0 && (
            <AccordionTab 
              header={
                <div className="flex items-center gap-2">
                  <i className="pi pi-lightbulb text-yellow-500"></i>
                  <span>AI Cooking Tips ({tips.length})</span>
                </div>
              }
            >
              <div className="space-y-3">
                {tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <p className="text-gray-700 flex-1">{tip}</p>
                  </div>
                ))}
              </div>
            </AccordionTab>
          )}

          {/* Ingredient Substitutions */}
          {Object.keys(substitutions).length > 0 && (
            <AccordionTab 
              header={
                <div className="flex items-center gap-2">
                  <i className="pi pi-sync text-green-500"></i>
                  <span>Ingredient Substitutions ({Object.keys(substitutions).length})</span>
                </div>
              }
            >
              <div className="space-y-4">
                {Object.entries(substitutions).map(([ingredient, alternatives]) => (
                  <div key={ingredient} className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="font-medium text-gray-800 mb-2">
                      <i className="pi pi-arrow-right text-green-600 mr-2"></i>
                      {ingredient}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {alternatives.map((alt, index) => (
                        <span 
                          key={index}
                          className="bg-white px-3 py-1 rounded-full text-sm text-gray-700 border border-green-300"
                        >
                          {alt}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionTab>
          )}
        </Accordion>
      )}

      {/* Loading state for additional content */}
      {loading && hasGenerated && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <i className="pi pi-spin pi-spinner text-purple-500"></i>
            <span className="text-gray-600">Generating additional AI content...</span>
          </div>
          <div className="space-y-2">
            <Skeleton width="100%" height="1rem" />
            <Skeleton width="80%" height="1rem" />
            <Skeleton width="60%" height="1rem" />
          </div>
        </Card>
      )}
    </div>
  );
};

export default AIRecipeSummary;