import React, { useState, useEffect } from 'react';
import { generateRecipeSummary, isOpenAIAvailable } from '../../lib/openai';

interface AIRecipeSummaryProps {
  recipe: any;
}

export const AIRecipeSummary: React.FC<AIRecipeSummaryProps> = ({ recipe }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpenAIAvailable) {
      return;
    }

    const generateSummary = async () => {
      setLoading(true);
      try {
        const aiSummary = await generateRecipeSummary(recipe);
        setSummary(aiSummary);
      } catch (error) {
        console.error('Failed to generate AI summary:', error);
      } finally {
        setLoading(false);
      }
    };

    generateSummary();
  }, [recipe]);

  if (!isOpenAIAvailable) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          <span className="text-purple-700 font-medium">Generating AI summary...</span>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-purple-800 mb-2">AI Recipe Summary</h3>
          <p className="text-purple-700 leading-relaxed">{summary}</p>
        </div>
      </div>
    </div>
  );
};

export default AIRecipeSummary