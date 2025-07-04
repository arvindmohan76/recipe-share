import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { generateRecipeSummary, isOpenAIAvailable } from '../../lib/openai';

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

const RecipeEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fetchLoading, setFetchLoading] = useState(true);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [hasGeneratedDescription, setHasGeneratedDescription] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();

  const cuisineOptions = [
    { label: 'Italian', value: 'Italian' },
    { label: 'Mexican', value: 'Mexican' },
    { label: 'Asian', value: 'Asian' },
    { label: 'Indian', value: 'Indian' },
    { label: 'Mediterranean', value: 'Mediterranean' },
    { label: 'American', value: 'American' },
    { label: 'French', value: 'French' },
    { label: 'Thai', value: 'Thai' },
    { label: 'Japanese', value: 'Japanese' },
    { label: 'Chinese', value: 'Chinese' }
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

  useEffect(() => {
    if (id) {
      fetchRecipe();
    }
  }, [id]);

  const fetchRecipe = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user_id !== user?.id) {
        setError('You can only edit your own recipes');
        return;
      }

      setTitle(data.title);
      setDescription(data.description || '');
      setIngredients(data.ingredients || [{ name: '', amount: '', unit: '' }]);
      setSteps(data.steps || [{ step: 1, instruction: '', tips: '' }]);
      setCuisine(data.cuisine || '');
      setDietaryTags(data.dietary_tags || []);
      setCookingTime(data.cooking_time || 0);
      setPrepTime(data.prep_time || 0);
      setDifficulty(data.difficulty || '');
      setServings(data.servings || 1);
      setCurrentImageUrl(data.image_url || '');
      setHasGeneratedDescription(!!data.description); // Mark as generated if description exists
    } catch (err) {
      setError('Failed to fetch recipe');
    } finally {
      setFetchLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const { data } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (err) {
      console.error('Image upload failed:', err);
      return null;
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: '' }]);
  };

  const removeIngredient = (index: number) => {
    const newIngredients = [...ingredients];
    newIngredients.splice(index, 1);
    setIngredients(newIngredients);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };

  const addStep = () => {
    const newStep = { step: steps.length + 1, instruction: '', tips: '' };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    newSteps.forEach((step, i) => {
      step.step = i + 1;
    });
    setSteps(newSteps);
  };

  const updateStep = (index: number, field: keyof Step, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  // Auto-generate description when user has added enough content (only if no description exists)
  useEffect(() => {
    // Check if we have meaningful ingredients (at least one with a name)
    const hasValidIngredients = ingredients.some(ing => ing.name.trim().length > 0);
    
    const shouldAutoGenerate = 
      isOpenAIAvailable && 
      title.trim() && 
      hasValidIngredients &&
      !description.trim() && 
      !hasGeneratedDescription &&
      !generatingDescription &&
      !fetchLoading; // Don't auto-generate while loading existing data

    if (shouldAutoGenerate) {
      const timer = setTimeout(() => {
        generateAIDescription();
      }, 1500); // Reduced delay for better responsiveness

      return () => clearTimeout(timer);
    }
  }, [title, ingredients, isOpenAIAvailable, description, hasGeneratedDescription, generatingDescription, fetchLoading, steps, cuisine, difficulty, cookingTime, dietaryTags]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    setError('');
    setLoading(true);

    try {
      let imageUrl = currentImageUrl;

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
        .update({
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
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        setError(error.message);
      } else {
        navigate(`/recipes/${id}`);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <i className="pi pi-spinner pi-spin text-4xl text-blue-500"></i>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Recipe</h1>

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
            {currentImageUrl && (
              <div className="mb-4">
                <img
                  src={currentImageUrl}
                  alt="Current recipe"
                  className="w-32 h-32 object-cover rounded-lg border"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('pexels.com')) {
                      target.src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400';
                    }
                  }}
                  loading="lazy"
                />
                <p className="text-sm text-gray-600 mt-1">Current image</p>
              </div>
            )}
            <FileUpload
              mode="basic"
              accept="image/*"
              maxFileSize={5000000}
              onSelect={(e) => setImageFile(e.files[0])}
              onClear={() => setImageFile(null)}
              chooseLabel="Choose New Image"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    <p className="text-purple-800 font-medium">Enhancing your recipe description...</p>
                    <p className="text-purple-600 text-sm">Creating an irresistible summary that highlights the best of your recipe</p>
                  </div>
                </div>
              )}
              
              <InputTextarea
                id="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (e.target.value.trim()) {
                    setHasGeneratedDescription(true);
                  }
                }}
                rows={3}
                className="w-full"
                placeholder={
                  isOpenAIAvailable 
                    ? "Update your recipe details above to regenerate an appetizing 50-word description..."
                    : "Describe your recipe - what makes it special, how it tastes, and why people will love it..."
                }
              />
              
              <div className="flex justify-between items-center">
                {isOpenAIAvailable && title && ingredients.some(ing => ing.name.trim()) && (
                  <Button
                    type="button"
                    label="Regenerate (50 words)"
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
                    💡 <strong>Pro tip:</strong> Configure OpenAI API key to enable AI-generated 50-word descriptions
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
                  <span className="font-medium text-gray-700">Step {step.step}</span>
                  <Button
                    type="button"
                    icon="pi pi-trash"
                    onClick={() => removeStep(index)}
                    className="p-button-text p-button-danger p-button-sm"
                    disabled={steps.length === 1}
                  />
                </div>
                <InputTextarea
                  value={step.instruction}
                  onChange={(e) => updateStep(index, 'instruction', e.target.value)}
                  placeholder="Step instruction"
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
              className="p-button-secondary"
              onClick={() => navigate(`/recipes/${id}`)}
            />
            <Button
              type="submit"
              label="Update Recipe"
              className="p-button-success p-button-outlined"
              disabled={!title || ingredients.length === 0 || steps.length === 0}
              loading={loading}
            />
          </div>
        </form>

        {/* AI Description Help */}
        {isOpenAIAvailable && (
          <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="pi pi-sparkles text-white text-sm"></i>
              </div>
              <div>
                <h4 className="font-medium text-purple-800 mb-2">🍳 AI Culinary Assistant</h4>
                <p className="text-sm text-purple-700 mb-2">
                  Our AI chef creates appetizing 50-word descriptions that make your recipes irresistible using your specific ingredients. 
                  The description automatically updates when you modify ingredients or recipe details.
                </p>
                <div className="text-xs text-purple-600 space-y-1">
                  <p>• <strong>Smart updates:</strong> Regenerates when you change ingredients or recipe elements</p>
                  <p>• <strong>Ingredient-focused:</strong> Uses your specific ingredients for sensory descriptions</p>
                  <p>• <strong>Your control:</strong> Edit and customize the generated text as needed</p>
                  <p>• <strong>Perfect length:</strong> Optimized 50-word limit for quick, engaging reads</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default RecipeEdit;