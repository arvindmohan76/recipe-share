import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { InputNumber } from 'primereact/inputnumber';
import { FileUpload } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { supabase } from '../../lib/supabase';
import { uploadRecipeImage } from '../../lib/imageUtils';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { generateRecipeSummary, isOpenAIAvailable } from '../../lib/openai';
import VoiceToText from '../Voice/VoiceToText';

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface Step {
  step: number;
  instruction: string;
  tips?: string;
}

const RecipeForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', amount: '', unit: '' }]);
  const [steps, setSteps] = useState<Step[]>([{ step: 1, instruction: '', tips: '' }]);
  const [cuisine, setCuisine] = useState('');
  const [dietaryTags, setDietaryTags] = useState<string[]>([]);
  const [cookingTime, setCookingTime] = useState<number>(0);
  const [prepTime, setPrepTime] = useState<number>(0);
  const [difficulty, setDifficulty] = useState('');
  const [servings, setServings] = useState<number>(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [hasGeneratedDescription, setHasGeneratedDescription] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState<number | null>(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const cuisineOptions = [
    { label: 'Italian', value: 'Italian' },
    { label: 'Mexican', value: 'Mexican' },
    { label: 'Chinese', value: 'Chinese' },
    { label: 'Indian', value: 'Indian' },
    { label: 'French', value: 'French' },
    { label: 'Thai', value: 'Thai' },
    { label: 'Japanese', value: 'Japanese' },
    { label: 'Korean', value: 'Korean' },
    { label: 'Greek', value: 'Greek' },
    { label: 'Lebanese', value: 'Lebanese' },
    { label: 'Moroccan', value: 'Moroccan' },
    { label: 'Brazilian', value: 'Brazilian' },
    { label: 'Ethiopian', value: 'Ethiopian' },
    { label: 'Peruvian', value: 'Peruvian' },
    { label: 'Vietnamese', value: 'Vietnamese' },
    { label: 'Turkish', value: 'Turkish' },
    { label: 'Russian', value: 'Russian' },
    { label: 'Spanish', value: 'Spanish' },
    { label: 'German', value: 'German' },
    { label: 'British', value: 'British' },
    { label: 'Jamaican', value: 'Jamaican' },
    { label: 'Polish', value: 'Polish' },
    { label: 'Mediterranean', value: 'Mediterranean' },
    { label: 'American', value: 'American' },
    { label: 'Asian', value: 'Asian' }
  ];

  const dietaryOptions = [
    { label: 'Vegetarian', value: 'vegetarian' },
    { label: 'Vegan', value: 'vegan' },
    { label: 'Gluten-Free', value: 'gluten-free' },
    { label: 'Dairy-Free', value: 'dairy-free' },
    { label: 'Keto', value: 'keto' },
    { label: 'Paleo', value: 'paleo' },
    { label: 'Low-Carb', value: 'low-carb' },
    { label: 'Healthy', value: 'healthy' }
  ];

  const difficultyOptions = [
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' }
  ];

  const unitOptions = [
    { label: 'Cup', value: 'cup' },
    { label: 'Tablespoon', value: 'tbsp' },
    { label: 'Teaspoon', value: 'tsp' },
    { label: 'Ounce', value: 'oz' },
    { label: 'Pound', value: 'lb' },
    { label: 'Gram', value: 'g' },
    { label: 'Kilogram', value: 'kg' },
    { label: 'Milliliter', value: 'ml' },
    { label: 'Liter', value: 'l' },
    { label: 'Piece', value: 'piece' },
    { label: 'Clove', value: 'clove' },
    { label: 'Bunch', value: 'bunch' }
  ];

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const addStep = () => {
    setSteps([...steps, { step: steps.length + 1, instruction: '', tips: '' }]);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    // Renumber steps
    const renumberedSteps = newSteps.map((step, i) => ({ ...step, step: i + 1 }));
    setSteps(renumberedSteps);
  };

  // Auto-generate description when user has added enough content
  useEffect(() => {
    // Check if we have meaningful ingredients (at least one with a name)
    const hasValidIngredients = ingredients.some(ing => ing.name.trim().length > 0);
    
    const shouldAutoGenerate = 
      isOpenAIAvailable && 
      title.trim() && 
      hasValidIngredients &&
      !description.trim() && 
      !hasGeneratedDescription &&
      !generatingDescription;

    if (shouldAutoGenerate) {
      // Add a small delay to avoid generating on every keystroke
      const timer = setTimeout(() => {
        generateAIDescription();
      }, 1500); // Reduced delay for better responsiveness

      return () => clearTimeout(timer);
    }
  }, [title, ingredients, isOpenAIAvailable, description, hasGeneratedDescription, generatingDescription, steps, cuisine, difficulty, cookingTime, dietaryTags]);

  const generateAIDescription = async () => {
    // Validate we have enough content for AI generation
    const hasValidIngredients = ingredients.some(ing => ing.name.trim().length > 0);
    
    if (!isOpenAIAvailable || !title.trim() || !hasValidIngredients) {
      console.log('AI generation skipped - missing required data:', {
        hasOpenAI: isOpenAIAvailable,
        hasTitle: !!title.trim(),
        hasValidIngredients
      });
      return;
    }

    console.log('Generating AI description with ingredients:', ingredients.filter(ing => ing.name.trim()));
    
    setGeneratingDescription(true);
    try {
      const recipe = {
        title,
        ingredients: ingredients.filter(ing => ing.name.trim()), // Only include ingredients with names
        steps,
        cuisine,
        difficulty,
        cookingTime,
        dietaryTags
      };

      console.log('Recipe data for AI:', recipe);
      
      const aiDescription = await generateRecipeSummary(recipe);
      if (aiDescription) {
        setDescription(aiDescription);
        setHasGeneratedDescription(true);
        console.log('AI description generated successfully:', aiDescription);
      } else {
        setError('Failed to generate AI description. Please try again.');
      }
    } catch (err) {
      console.error('Failed to generate AI description:', err);
      setError('An error occurred while generating the description.');
    } finally {
      setGeneratingDescription(false);
    }
  };
  const updateStep = (index: number, field: keyof Step, value: string | number) => {
    const newSteps = [...steps];
    newSteps[index][field] = value as any;
    setSteps(newSteps);
  };

  const handleVoiceText = (stepIndex: number, voiceText: string) => {
    const newSteps = [...steps];
    // Append voice text to existing instruction or replace if empty
    const currentInstruction = newSteps[stepIndex].instruction;
    newSteps[stepIndex].instruction = currentInstruction 
      ? `${currentInstruction} ${voiceText}` 
      : voiceText;
    setSteps(newSteps);
    setShowVoiceInput(null); // Hide voice input after receiving text
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      let imageUrl = '';

      if (imageFile) {
        const uploadedUrl = await uploadRecipeImage(imageFile, user.id);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          setError('Failed to upload image. Please try again.');
          return;
        }
      }

      const { error } = await supabase
        .from('recipes')
        .insert([
          {
            title,
            description,
            ingredients,
            steps,
            cuisine,
            dietary_tags: dietaryTags,
            cooking_time: cookingTime,
            prep_time: prepTime,
            difficulty,
            servings,
            user_id: user.id,
            image_url: imageUrl,
            is_public: true,
          },
        ]);

      if (error) {
        setError(error.message);
      } else {
        navigate('/recipes');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Recipe</h1>

        {error && (
          <Message severity="error" text={error} className="mb-4 w-full" />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Title *
              </label>
              <InputText
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full"
                placeholder="Enter recipe title"
              />
            </div>

            <div>
              <label htmlFor="cuisine" className="block text-sm font-medium text-gray-700 mb-2">
                Cuisine
              </label>
              <Dropdown
                value={cuisine}
                options={cuisineOptions}
                onChange={(e) => setCuisine(e.value)}
                placeholder="Select cuisine"
                className="w-full"
                filter
                filterBy="label"
                showClear
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Recipe Image
            </label>
            <FileUpload
              mode="basic"
              accept="image/*"
              maxFileSize={5000000}
              onSelect={(e) => setImageFile(e.files[0])}
              onClear={() => setImageFile(null)}
              chooseLabel="Choose Image"
              className="w-full"
            />
            {imageFile && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {imageFile.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700 mb-2">
                Prep Time (min)
              </label>
              <InputNumber
                id="prepTime"
                value={prepTime}
                onValueChange={(e) => setPrepTime(e.value || 0)}
                className="w-full"
                min={0}
              />
            </div>

            <div>
              <label htmlFor="cookingTime" className="block text-sm font-medium text-gray-700 mb-2">
                Cooking Time (min)
              </label>
              <InputNumber
                id="cookingTime"
                value={cookingTime}
                onValueChange={(e) => setCookingTime(e.value || 0)}
                className="w-full"
                min={0}
              />
            </div>

            <div>
              <label htmlFor="servings" className="block text-sm font-medium text-gray-700 mb-2">
                Servings
              </label>
              <InputNumber
                id="servings"
                value={servings}
                onValueChange={(e) => setServings(e.value || 1)}
                className="w-full"
                min={1}
              />
            </div>

            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <Dropdown
                value={difficulty}
                options={difficultyOptions}
                onChange={(e) => setDifficulty(e.value)}
                placeholder="Select difficulty"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label htmlFor="dietary-tags" className="block text-sm font-medium text-gray-700 mb-2">
              Dietary Tags
            </label>
            <MultiSelect
              value={dietaryTags}
              options={dietaryOptions}
              onChange={(e) => setDietaryTags(e.value)}
              placeholder="Select dietary tags"
              className="w-full"
              filter
              filterBy="label"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-0">
                Ingredients *
              </label>
              <Button
                type="button"
                icon="pi pi-plus"
                label="Add Ingredient"
                onClick={addIngredient}
                className="p-button-sm p-button-outlined"
              />
            </div>
            {ingredients.map((ingredient, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                <InputText
                  value={ingredient.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                  placeholder="Ingredient name"
                  className="md:col-span-2"
                />
                <InputText
                  value={ingredient.amount}
                  onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                  placeholder="Amount"
                  className=""
                />
                <div className="flex gap-3">
                  <Dropdown
                    value={ingredient.unit}
                    options={unitOptions}
                    onChange={(e) => updateIngredient(index, 'unit', e.value)}
                    placeholder="Unit"
                    className="flex-1"
                    filter
                    filterBy="label"
                  />
                  <Button
                    type="button"
                    icon="pi pi-trash"
                    onClick={() => removeIngredient(index)}
                    className="p-button-danger p-button-sm"
                    disabled={ingredients.length === 1}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* AI Description Section - Positioned after ingredients for better UX */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-3">
              Recipe Description {isOpenAIAvailable && <span className="text-purple-600">(AI-Enhanced)</span>}
            </label>
            <div className="space-y-3">
              {generatingDescription && (
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                  <i className="pi pi-spinner pi-spin text-purple-600"></i>
                  <div>
                    <p className="text-purple-800 font-medium">Creating appetizing description...</p>
                    <p className="text-purple-600 text-sm">Our AI chef is crafting a mouth-watering summary of your recipe</p>
                  </div>
                </div>
              )}
              
              <InputTextarea
                id="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (e.target.value.trim()) {
                    setHasGeneratedDescription(true); // Prevent auto-generation if user types
                  }
                }}
                rows={3}
                className="w-full"
                placeholder={
                  isOpenAIAvailable 
                    ? "Add your recipe title and ingredients above, and we'll create a mouth-watering 50-word description automatically..."
                    : "Describe your recipe - what makes it special, how it tastes, and why people will love it..."
                }
              />
              
              <div className="flex justify-between items-center">
                {isOpenAIAvailable && title && ingredients.some(ing => ing.name.trim()) && (
                  <Button
                    type="button"
                    label={hasGeneratedDescription ? "Regenerate (50 words)" : "Generate AI Description"}
                    icon="pi pi-sparkles"
                    onClick={() => {
                      setHasGeneratedDescription(false);
                      generateAIDescription();
                    }}
                    loading={generatingDescription}
                    className="p-button-outlined p-button-sm"
                    style={{ 
                      borderColor: '#8b5cf6', 
                      color: '#8b5cf6',
                      backgroundColor: 'transparent'
                    }}
                  />
                )}
                
                {description && (
                  <span className={`text-xs ${description.split(' ').length > 50 ? 'text-orange-600' : 'text-gray-500'}`}>
                    {description.split(' ').length} words {description.split(' ').length > 50 ? '(over 50-word limit)' : ''}
                  </span>
                )}
              </div>
              
              {!isOpenAIAvailable && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-xs text-gray-600">
                    💡 <strong>Pro tip:</strong> Configure OpenAI API key to enable AI-generated 50-word descriptions that make your recipes irresistible
                  </p>
                </div>
              )}
              
              {isOpenAIAvailable && (!title || !ingredients.some(ing => ing.name.trim())) && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    ✨ <strong>AI Ready:</strong> Add your recipe title and ingredients to automatically generate a mouth-watering 50-word description
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-0">
                Instructions *
              </label>
              <Button
                type="button"
                icon="pi pi-plus"
                label="Add Step"
                onClick={addStep}
                className="p-button-sm p-button-outlined"
              />
            </div>
            {steps.map((step, index) => (
              <div key={index} className="mb-6 p-5 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">Step {step.step}</span>
                    <Button
                      type="button"
                      icon="pi pi-microphone"
                      onClick={() => setShowVoiceInput(showVoiceInput === index ? null : index)}
                      className={`p-button-text p-button-sm ${showVoiceInput === index ? 'p-button-success' : ''}`}
                      tooltip="Add instruction using voice"
                      tooltipOptions={{ position: 'top' }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      icon="pi pi-trash"
                      onClick={() => removeStep(index)}
                      className="p-button-text p-button-danger p-button-sm"
                      disabled={steps.length === 1}
                    />
                  </div>
                </div>
                
                {/* Voice Input Component */}
                {showVoiceInput === index && (
                  <div className="mb-4">
                    <VoiceToText
                      onTextReceived={(text) => handleVoiceText(index, text)}
                      placeholder="Speak your cooking instruction clearly..."
                      buttonLabel="Record Step"
                      className="mb-3"
                    />
                  </div>
                )}
                
                <InputTextarea
                  value={step.instruction}
                  onChange={(e) => updateStep(index, 'instruction', e.target.value)}
                  placeholder="Step instruction (type or use voice input above)"
                  rows={2}
                  className="w-full mb-3"
                />
                <InputTextarea
                  value={step.tips || ''}
                  onChange={(e) => updateStep(index, 'tips', e.target.value)}
                  placeholder="Optional cooking tips"
                  rows={1}
                  className="w-full"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              label="Cancel"
              className="p-button-outlined flex-shrink-0"
              onClick={() => navigate('/recipes')}
            />
            <Button
              type="submit"
              label="Create Recipe"
              className="p-button-success flex-shrink-0"
              disabled={!title || ingredients.length === 0 || steps.length === 0}
              loading={loading}
            />
          </div>
        </form>

        {/* AI Description Help */}
        {isOpenAIAvailable && (
          <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="pi pi-sparkles text-white text-sm"></i>
              </div>
              <div>
                <h4 className="font-medium text-purple-800 mb-2">🍳 AI Culinary Assistant</h4>
                <p className="text-sm text-purple-700 mb-2">
                  Our AI chef automatically creates appetizing 50-word descriptions that highlight the flavors, textures, and cooking experience from your specific ingredients. 
                  Just add your recipe title and ingredients, and watch the magic happen!
                </p>
                <div className="text-xs text-purple-600 space-y-1">
                  <p>• <strong>Auto-generation:</strong> 50-word descriptions appear automatically as you add ingredients</p>
                  <p>• <strong>Ingredient-focused:</strong> Uses your specific ingredients to create sensory descriptions</p>
                  <p>• <strong>Fully editable:</strong> Customize the generated text to match your style</p>
                  <p>• <strong>Perfect length:</strong> Optimized 50-word limit for quick, engaging reads</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Voice Input Help */}
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="pi pi-microphone text-white text-sm"></i>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">🎤 Voice-to-Text Instructions</h4>
              <p className="text-sm text-blue-700 mb-2">
                Speed up recipe creation by speaking your cooking instructions! Click the microphone icon next to any step to start voice input.
              </p>
              <div className="text-xs text-blue-600 space-y-1">
                <p>• <strong>Natural speech:</strong> Speak as if explaining to a friend</p>
                <p>• <strong>Clear pronunciation:</strong> Speak clearly for better accuracy</p>
                <p>• <strong>Quiet environment:</strong> Reduce background noise for best results</p>
                <p>• <strong>Edit after:</strong> Voice text can be edited and refined manually</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RecipeForm;