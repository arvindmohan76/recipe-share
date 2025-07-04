import React, { useState, useEffect } from 'react';
import { DataView } from 'primereact/dataview';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Slider } from 'primereact/slider';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Checkbox } from 'primereact/checkbox';
import { supabase, Recipe } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import RecipeCard from './RecipeCard';

const RecipeList: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState('');
  const [maxCookingTime, setMaxCookingTime] = useState(120);
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  const { user } = useAuth();

  const cuisineOptions = [
    'Italian', 'Mexican', 'Chinese', 'Indian', 'French', 'Thai', 'Japanese', 'Korean', 'Greek', 'Lebanese', 'Moroccan', 'Brazilian', 'Ethiopian', 'Peruvian', 'Vietnamese', 'Turkish', 'Russian', 'Spanish', 'German', 'British', 'Jamaican', 'Polish', 'Mediterranean', 'American', 'Asian'
  ];

  const dietaryOptions = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'low-carb', 'healthy'
  ];

  const difficultyOptions = [
    { label: 'All', value: '' },
    { label: 'Easy', value: 'easy' },
    { label: 'Medium', value: 'medium' },
    { label: 'Hard', value: 'hard' }
  ];

  useEffect(() => {
    fetchRecipes();
    if (user) {
      fetchSavedRecipes();
    }
  }, [user]);

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setRecipes(data || []);
      }
    } catch (err) {
      setError('Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedRecipes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_recipes')
        .select('recipe_id')
        .eq('user_id', user.id);

      if (!error && data) {
        setSavedRecipes(new Set(data.map(item => item.recipe_id)));
      }
    } catch (err) {
      console.error('Failed to fetch saved recipes:', err);
    }
  };

  const handleSaveRecipe = async (recipeId: string) => {
    if (!user) return;

    try {
      const isSaved = savedRecipes.has(recipeId);
      
      if (isSaved) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_recipes')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId);

        if (!error) {
          setSavedRecipes(prev => {
            const newSet = new Set(prev);
            newSet.delete(recipeId);
            return newSet;
          });
        }
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_recipes')
          .insert([{ user_id: user.id, recipe_id: recipeId }]);

        if (!error) {
          setSavedRecipes(prev => new Set([...prev, recipeId]));
        }
      }
    } catch (err) {
      console.error('Failed to save/unsave recipe:', err);
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesIngredient = ingredientSearch === '' || 
                             recipe.ingredients.some(ing => 
                               ing.name.toLowerCase().includes(ingredientSearch.toLowerCase())
                             );
    
    const matchesCuisine = selectedCuisines.length === 0 || 
                          selectedCuisines.includes(recipe.cuisine);
    
    const matchesDietary = selectedDietary.length === 0 ||
                          selectedDietary.some(tag => recipe.dietary_tags.includes(tag));
    
    const matchesDifficulty = difficulty === '' || recipe.difficulty === difficulty;
    
    const matchesTime = recipe.cooking_time <= maxCookingTime;

    const matchesBookmark = !showBookmarkedOnly || savedRecipes.has(recipe.id);

    return matchesSearch && matchesIngredient && matchesCuisine && matchesDietary && 
           matchesDifficulty && matchesTime && matchesBookmark;
  });

  const itemTemplate = (recipe: Recipe) => {
    return (
      <div className="col-12 md:col-6 lg:col-4 p-3">
        <RecipeCard
          recipe={recipe}
          onSave={handleSaveRecipe}
          isSaved={savedRecipes.has(recipe.id)}
        />
      </div>
    );
  };

  const header = (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Recipes
          </label>
          <InputText
            id="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title or description..."
            className="w-full p-3 border-2 border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="ingredient-search" className="block text-sm font-medium text-gray-700 mb-2">
            Search by Ingredient
          </label>
          <InputText
            id="ingredient-search"
            value={ingredientSearch}
            onChange={(e) => setIngredientSearch(e.target.value)}
            placeholder="Search by ingredient (e.g., chicken, tomato)..."
            className="w-full p-3 border-2 border-gray-300 rounded-md"
          />
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Checkbox
            inputId="bookmarked-only"
            checked={showBookmarkedOnly}
            onChange={(e) => setShowBookmarkedOnly(e.checked || false)}
          />
          <label htmlFor="bookmarked-only" className="text-sm font-medium text-gray-700">
            Show only my bookmarked recipes ({savedRecipes.size} saved)
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label htmlFor="cuisines" className="block text-sm font-medium text-gray-700 mb-2">
            Cuisines
          </label>
          <MultiSelect
            value={selectedCuisines}
            options={cuisineOptions.map(c => ({ label: c, value: c }))}
            onChange={(e) => setSelectedCuisines(e.value)}
            placeholder="Select cuisines"
            className="w-full border-2 border-gray-300 rounded-md"
            filter
            filterBy="label"
          />
        </div>

        <div>
          <label htmlFor="dietary" className="block text-sm font-medium text-gray-700 mb-2">
            Dietary Tags
          </label>
          <MultiSelect
            value={selectedDietary}
            options={dietaryOptions.map(d => ({ label: d.charAt(0).toUpperCase() + d.slice(1), value: d }))}
            onChange={(e) => setSelectedDietary(e.value)}
            placeholder="Select dietary tags"
            className="w-full border-2 border-gray-300 rounded-md"
            filter
            filterBy="label"
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
            className="w-full border-2 border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
          Max Cooking Time: {maxCookingTime} minutes
        </label>
        <Slider
          value={maxCookingTime}
          onChange={(e) => setMaxCookingTime(Array.isArray(e.value) ? e.value[0] : e.value)}
          max={180}
          min={10}
          className="w-full"
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <i className="pi pi-spinner pi-spin text-4xl text-blue-500"></i>
      </div>
    );
  }

  if (error) {
    return (
      <Message severity="error" text={error} className="w-full" />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Discover Recipes</h1>
        <div className="text-sm text-gray-600">
          {filteredRecipes.length} recipes found
        </div>
      </div>

      <Card>
        {header}
        <DataView
          value={filteredRecipes}
          itemTemplate={itemTemplate}
          layout="grid"
          paginator
          rows={9}
          emptyMessage="No recipes found matching your criteria."
        />
      </Card>
    </div>
  );
};

export default RecipeList;