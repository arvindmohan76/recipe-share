import React, { useState, useEffect, useRef } from 'react';
import { DataView } from 'primereact/dataview';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { Slider } from 'primereact/slider';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Checkbox } from 'primereact/checkbox';
import { AutoComplete } from 'primereact/autocomplete';
import { supabase, Recipe } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import {
  recordSearchQuery,
  recordRecipeClick,
  getSearchSuggestions,
  getUserPrivacySettings
} from '../../lib/searchHistory';
import RecipeCard from './RecipeCard';

const RecipeListWithHistory: React.FC = () => {
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
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [allowsTracking, setAllowsTracking] = useState(true);

  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const { user } = useAuth();

  const cuisineOptions = [
    'Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean', 'American', 'French', 'Thai', 'Japanese', 'Chinese'
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
      checkPrivacySettings();
    }
  }, [user]);

  useEffect(() => {
    // Immediate search tracking for better data collection
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      // Track any meaningful search activity
      if (user && allowsTracking) {
        trackSearch();
      }
    }, 500); // Reduced delay for better tracking

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, ingredientSearch, selectedCuisines, selectedDietary, difficulty, maxCookingTime, user, allowsTracking]);

  const checkPrivacySettings = async () => {
    if (!user) return;

    try {
      const settings = await getUserPrivacySettings(user.id);
      setAllowsTracking(settings?.allow_search_history ?? true);
    } catch (err) {
      console.error('Failed to check privacy settings:', err);
    }
  };

  const trackSearch = async () => {
    if (!user || !allowsTracking) return;

    // Create a meaningful query from all search inputs
    const queryParts = [];
    if (searchTerm.trim()) queryParts.push(searchTerm.trim());
    if (ingredientSearch.trim()) queryParts.push(`ingredient:${ingredientSearch.trim()}`);
    if (selectedCuisines.length) queryParts.push(`cuisine:${selectedCuisines.join(',')}`);
    if (selectedDietary.length) queryParts.push(`dietary:${selectedDietary.join(',')}`);
    if (difficulty) queryParts.push(`difficulty:${difficulty}`);
    
    const query = queryParts.join(' ');
    
    // Only track if there's actual search content
    if (!query.trim() || query.length < 2) return;

    const filters = {
      cuisines: selectedCuisines,
      dietary: selectedDietary,
      difficulty,
      maxCookingTime,
      showBookmarkedOnly
    };

    // Determine search type based on primary search method
    let searchType: 'general' | 'ingredient' | 'cuisine' | 'dietary' | 'difficulty' = 'general';
    if (ingredientSearch.trim()) searchType = 'ingredient';
    else if (selectedCuisines.length > 0) searchType = 'cuisine';
    else if (selectedDietary.length > 0) searchType = 'dietary';
    else if (difficulty) searchType = 'difficulty';
    
    const resultsCount = filteredRecipes.length;

    console.log('Tracking search:', { query, searchType, resultsCount, filters });

    try {
      const searchId = await recordSearchQuery(user.id, query, searchType, filters, resultsCount);
      setCurrentSearchId(searchId);
      console.log('Search tracked with ID:', searchId);
    } catch (err) {
      console.error('Failed to track search:', err);
    }
  };

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

  const handleRecipeClick = async (recipeId: string) => {
    console.log('Recipe clicked:', recipeId, 'Search ID:', currentSearchId);
    
    // Track recipe click if we have a current search
    if (currentSearchId && user && allowsTracking) {
      try {
        await recordRecipeClick(currentSearchId, recipeId);
        console.log('Recipe click tracked successfully');
      } catch (err) {
        console.error('Failed to track recipe click:', err);
      }
    }
  };

  const handleSearchSuggestions = async (query: string) => {
    if (!user || !allowsTracking || query.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    try {
      const suggestions = await getSearchSuggestions(user.id, query, 5);
      setSearchSuggestions(suggestions);
    } catch (err) {
      console.error('Failed to fetch search suggestions:', err);
      setSearchSuggestions([]);
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
        <div onClick={() => handleRecipeClick(recipe.id)}>
          <RecipeCard
            recipe={recipe}
            onSave={handleSaveRecipe}
            isSaved={savedRecipes.has(recipe.id)}
          />
        </div>
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
          {user && allowsTracking ? (
            <AutoComplete
              value={searchTerm}
              suggestions={searchSuggestions}
              completeMethod={(e) => handleSearchSuggestions(e.query)}
              onChange={(e) => setSearchTerm(e.value)}
              onSelect={(e) => {
                setSearchTerm(e.value);
                // Immediately track when user selects a suggestion
                if (user && allowsTracking && e.value && e.value.length >= 2) {
                  setTimeout(() => trackSearch(), 100);
                }
              }}
              placeholder="Search by title or description..."
              className="w-full"
              inputClassName="w-full p-3 border-2 border-gray-300 rounded-md"
            />
          ) : (
            <InputText
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or description..."
              className="w-full p-3 border-2 border-gray-300 rounded-md"
            />
          )}
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
            onBlur={() => {
              // Track when user finishes typing in ingredient search
              if (user && allowsTracking && ingredientSearch.trim().length >= 2) {
                setTimeout(() => trackSearch(), 100);
              }
            }}
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
          {!allowsTracking && (
            <div className="ml-auto">
              <span className="text-xs text-gray-500">
                Search tracking disabled in privacy settings
              )}
              {allowsTracking && (
                <div className="ml-auto">
                  <span className="text-xs text-green-600">
                    ✓ Search history enabled
                  </span>
                </div>
              </span>
            </div>
          )}
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
    <div>
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

export default RecipeListWithHistory;