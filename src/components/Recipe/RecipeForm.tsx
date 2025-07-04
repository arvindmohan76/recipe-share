import React, { useState } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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

  const updateStep = (index: number, field: keyof Step, value: string | number) => {
    const newSteps = [...steps];
    newSteps[index][field] = value as any;
    setSteps(newSteps);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      let imageUrl = '';

      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
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
    <div className="max-w-4xl mx-auto">
      <Card>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create New Recipe</h1>

        {error && (
          <Message severity="error" text={error} className="mb-4 w-full" />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Title *
              </label>
              <InputText
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded-md"
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
                className="w-full border border-gray-300 rounded-md"
                filter
                filterBy="label"
                showClear
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <InputTextarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md"
              placeholder="Describe your recipe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipe Image
            </label>
            <FileUpload
              mode="basic"
              accept="image/*"
              maxFileSize={5000000}
              onSelect={(e) => setImageFile(e.files[0])}
              onClear={() => setImageFile(null)}
              chooseLabel="Choose Image"
              className="border border-gray-300 rounded-md"
            />
            {imageFile && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {imageFile.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="prepTime" className="block text-sm font-medium text-gray-700 mb-2">
                Prep Time (min)
              </label>
              <InputNumber
                id="prepTime"
                value={prepTime}
                onValueChange={(e) => setPrepTime(e.value || 0)}
                className="w-full border border-gray-300 rounded-md"
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
                className="w-full border border-gray-300 rounded-md"
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
                className="w-full border border-gray-300 rounded-md"
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
                className="w-full border border-gray-300 rounded-md"
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
              className="w-full border border-gray-300 rounded-md"
              filter
              filterBy="label"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
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
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
                <InputText
                  value={ingredient.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                  placeholder="Ingredient name"
                  className="md:col-span-2 p-3 border border-gray-300 rounded-md"
                />
                <InputText
                  value={ingredient.amount}
                  onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                  placeholder="Amount"
                  className="p-3 border border-gray-300 rounded-md"
                />
                <div className="flex gap-2">
                  <Dropdown
                    value={ingredient.unit}
                    options={unitOptions}
                    onChange={(e) => updateIngredient(index, 'unit', e.value)}
                    placeholder="Unit"
                    className="flex-1 border border-gray-300 rounded-md"
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

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
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
              <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium text-gray-700">Step {step.step}</span>
                  <Button
                    type="button"
                    icon="pi pi-trash"
                    onClick={() => removeStep(index)}
                    className="p-button-danger p-button-sm"
                    disabled={steps.length === 1}
                  />
                </div>
                <InputTextarea
                  value={step.instruction}
                  onChange={(e) => updateStep(index, 'instruction', e.target.value)}
                  placeholder="Step instruction"
                  rows={2}
                  className="w-full mb-3 p-3 border border-gray-300 rounded-md"
                />
                <InputTextarea
                  value={step.tips || ''}
                  onChange={(e) => updateStep(index, 'tips', e.target.value)}
                  placeholder="Optional cooking tips"
                  rows={1}
                  className="w-full p-3 border border-gray-300 rounded-md"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              label="Cancel"
              className="p-button-secondary px-4 py-2 mr-3"
              onClick={() => navigate('/recipes')}
            />
            <Button
              type="submit"
              label="Create Recipe"
              className="p-button-success px-6 py-2"
              disabled={!title || ingredients.length === 0 || steps.length === 0}
              loading={loading}
            />
          </div>
        </form>
      </Card>
    </div>
  );
};

export default RecipeForm;