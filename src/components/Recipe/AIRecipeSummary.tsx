import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { generateRecipeSummary, isOpenAIAvailable } from '../../lib/openai';

interface AIRecipeSummaryProps {
  title: string;
  ingredients: any[];
  steps: any[];
  cuisine?: string;
  difficulty?: string;
  cookingTime?: number;
  dietaryTags?: string[];
}

export const AIRecipeSummary: React.FC<AIRecipeSummaryProps> = ({ 
  title, 
  ingredients, 
  steps, 
  cuisine, 
  difficulty, 
  cookingTime, 
  dietaryTags 
}) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recipe = {
    title,
    ingredients,
    steps,
    cuisine,
    difficulty,
    cookingTime,
    dietaryTags
  };

  useEffect(() => {
    if (!isOpenAIAvailable || !showSummary) {
      return;
    }

    const generateSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const aiSummary = await generateRecipeSummary(recipe);
        if (aiSummary) {
          setSummary(aiSummary);
        } else {
          setError('Failed to generate AI summary. Please try again.');
        }
      } catch (error) {
        console.error('Failed to generate AI summary:', error);
        setError('An error occurred while generating the summary.');
      } finally {
        setLoading(false);
      }
    };

    if (showSummary && !summary) {
      generateSummary();
    }
  }, [showSummary, title, ingredients.length, steps.length]);

  if (!isOpenAIAvailable) {
    return (
      <Card className="bg-gray-50 border border-gray-200">
        <div className="text-center p-4">
          <i className="pi pi-info-circle text-gray-400 text-2xl mb-2"></i>
          <p className="text-gray-600">AI features are not available. Please configure your OpenAI API key.</p>
        </div>
      </Card>
    );
  }

  if (!showSummary) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
        <div className="text-center p-4">
          <div className="flex items-center justify-center mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
              <i className="pi pi-sparkles text-white"></i>
            </div>
            <h3 className="text-lg font-semibold text-purple-800">AI Recipe Summary</h3>
          </div>
          <p className="text-purple-700 mb-4">
            Get an appetizing, mouth-watering description of this recipe powered by AI
          </p>
          <Button
            label="Generate AI Summary"
            icon="pi pi-sparkles"
            onClick={() => setShowSummary(true)}
            className="p-button-outlined"
            style={{ 
              borderColor: '#8b5cf6', 
              color: '#8b5cf6',
              backgroundColor: 'transparent'
            }}
          />
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
          <span className="text-purple-700 font-medium">Generating mouth-watering description...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border border-red-200">
        <div className="text-center p-4">
          <i className="pi pi-exclamation-triangle text-red-500 text-2xl mb-2"></i>
          <p className="text-red-700 mb-3">{error}</p>
          <Button
            label="Try Again"
            icon="pi pi-refresh"
            onClick={() => {
              setError(null);
              setSummary(null);
              setShowSummary(true);
            }}
            className="p-button-outlined p-button-danger p-button-sm"
          />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <i className="pi pi-sparkles text-white"></i>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-purple-800">AI-Generated Description</h3>
              <Button
                icon="pi pi-refresh"
                className="p-button-text p-button-sm"
                onClick={() => {
                  setSummary(null);
                  setShowSummary(true);
                }}
                tooltip="Generate new description"
                style={{ color: '#8b5cf6' }}
              />
            </div>
            {summary && (
              <div className="bg-white bg-opacity-50 rounded-lg p-4 border border-purple-100">
                <p className="text-purple-800 leading-relaxed text-lg italic">
                  "{summary}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
