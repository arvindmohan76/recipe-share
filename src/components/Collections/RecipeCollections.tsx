import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dialog } from 'primereact/dialog';
import { Message } from 'primereact/message';
import { DataView } from 'primereact/dataview';
import { Checkbox } from 'primereact/checkbox';
import { MultiSelect } from 'primereact/multiselect';
import { useAuth } from '../../context/AuthContext';
import { supabase, Recipe } from '../../lib/supabase';
import RecipeCard from '../Recipe/RecipeCard';

interface RecipeCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  recipe_ids: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
  recipes?: Recipe[];
}

const RecipeCollections: React.FC = () => {
  const [collections, setCollections] = useState<RecipeCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState<RecipeCollection | null>(null);
  const [availableRecipes, setAvailableRecipes] = useState<Recipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());

  // Form state
  const [collectionName, setCollectionName] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);

  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      fetchCollections();
      fetchAvailableRecipes();
      fetchSavedRecipes();
    }
  }, [user]);

  useEffect(() => {
    // Check if we're adding a recipe from recipe detail page
    if (location.state?.addRecipe) {
      const recipeId = location.state.addRecipe;
      setSelectedRecipes([recipeId]);
      setShowCreateDialog(true);
      setCollectionName('New Collection');
    }
  }, [location.state]);

  const fetchCollections = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('recipe_collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        // Fetch recipes for each collection
        const collectionsWithRecipes = await Promise.all(
          (data || []).map(async (collection) => {
            if (collection.recipe_ids.length > 0) {
              const { data: recipes } = await supabase
                .from('recipes')
                .select('*')
                .in('id', collection.recipe_ids);
              
              return { ...collection, recipes: recipes || [] };
            }
            return { ...collection, recipes: [] };
          })
        );
        
        setCollections(collectionsWithRecipes);
      }
    } catch (err) {
      setError('Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('is_public', true)
        .order('title');

      if (!error) {
        setAvailableRecipes(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch available recipes:', err);
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

  const resetForm = () => {
    setCollectionName('');
    setCollectionDescription('');
    setSelectedRecipes([]);
    setIsPublic(false);
    setEditingCollection(null);
  };

  const openCreateDialog = () => {
    resetForm();
    // If we have a recipe from navigation state, pre-select it
    if (location.state?.addRecipe) {
      setSelectedRecipes([location.state.addRecipe]);
      setCollectionName('New Collection');
    }
    setShowCreateDialog(true);
  };

  const openEditDialog = (collection: RecipeCollection) => {
    setCollectionName(collection.name);
    setCollectionDescription(collection.description || '');
    setSelectedRecipes(collection.recipe_ids);
    setIsPublic(collection.is_public);
    setEditingCollection(collection);
    setShowCreateDialog(true);
  };

  const handleSubmit = async () => {
    if (!user || !collectionName.trim()) return;

    try {
      const collectionData = {
        name: collectionName.trim(),
        description: collectionDescription.trim() || null,
        recipe_ids: selectedRecipes,
        is_public: isPublic,
        updated_at: new Date().toISOString()
      };

      if (editingCollection) {
        // Update existing collection
        const { error } = await supabase
          .from('recipe_collections')
          .update(collectionData)
          .eq('id', editingCollection.id)
          .eq('user_id', user.id);

        if (error) {
          setError(error.message);
          return;
        }
      } else {
        // Create new collection
        const { error } = await supabase
          .from('recipe_collections')
          .insert([{
            ...collectionData,
            user_id: user.id
          }]);

        if (error) {
          setError(error.message);
          return;
        }
      }

      setShowCreateDialog(false);
      resetForm();
      fetchCollections();
    } catch (err) {
      setError('Failed to save collection');
    }
  };

  const deleteCollection = async (collectionId: string) => {
    try {
      const { error } = await supabase
        .from('recipe_collections')
        .delete()
        .eq('id', collectionId)
        .eq('user_id', user?.id);

      if (!error) {
        fetchCollections();
      } else {
        setError(error.message);
      }
    } catch (err) {
      setError('Failed to delete collection');
    }
  };

  const collectionTemplate = (collection: RecipeCollection) => {
    return (
      <Card className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{collection.name}</h3>
              {collection.is_public && (
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                  Public
                </span>
              )}
            </div>
            {collection.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-2">{collection.description}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {collection.recipes?.length || 0} recipes
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              icon="pi pi-pencil"
              className="p-button-text p-button-sm"
              onClick={() => openEditDialog(collection)}
            />
            <Button
              icon="pi pi-trash"
              className="p-button-text p-button-sm p-button-danger"
              onClick={() => deleteCollection(collection.id)}
            />
          </div>
        </div>

        {collection.recipes && collection.recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {collection.recipes.map((recipe) => (
              <div key={recipe.id} className="h-full">
                <RecipeCard
                  recipe={recipe}
                  onSave={handleSaveRecipe}
                  isSaved={savedRecipes.has(recipe.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <i className="pi pi-book text-4xl text-gray-300 mb-3"></i>
            <p className="text-gray-500 dark:text-gray-400">No recipes in this collection yet</p>
            <Button
              label="Add"
              icon="pi pi-plus"
              className="p-button-success p-button p-component"
              onClick={() => openEditDialog(collection)}
            />
          </div>
        )}
      </Card>
    );
  };

  if (!user) {
    return (
      <Message severity="info" text="Please sign in to manage your recipe collections." className="w-full" />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <i className="pi pi-spinner pi-spin text-4xl text-blue-500"></i>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Recipe Collections</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Organize your favorite recipes into curated collections
          </p>
        </div>
        <Button
          label="Create"
          icon="pi pi-plus"
          onClick={openCreateDialog}
          className="p-button-success"
        />
      </div>

      {error && (
        <Message severity="error" text={error} className="w-full" />
      )}

      {collections.length === 0 ? (
        <Card className="text-center p-8">
          <div className="space-y-4">
            <i className="pi pi-book text-6xl text-gray-300"></i>
           <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">No Collections Yet</h3>
           <p className="text-gray-500 dark:text-gray-400">
              Create your first recipe collection to organize your favorite recipes by theme, cuisine, or occasion.
            </p>
            <Button
              label="Create"
              icon="pi pi-plus"
              className="p-button-success p-button-outlined"
              onClick={openCreateDialog}
            />
          </div>
        </Card>
      ) : (
        <DataView
          value={collections}
          itemTemplate={collectionTemplate}
          layout="list"
        />
      )}

      {/* Create/Edit Collection Dialog */}
      <Dialog
        header={editingCollection ? 'Edit Collection' : 'Create New Collection'}
        visible={showCreateDialog}
        onHide={() => setShowCreateDialog(false)}
        style={{ width: '90vw', maxWidth: '800px' }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              label="Cancel"
              onClick={() => setShowCreateDialog(false)}
              className="p-button-secondary"
            />
            <Button
              label="Save"
              onClick={handleSubmit}
              disabled={!collectionName.trim()}
              className="p-button-success p-button-outlined"
            />
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="collection-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Collection Name *
            </label>
            <InputText
              id="collection-name"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="e.g., Italian Favorites, Quick Dinners"
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="collection-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <InputTextarea
              id="collection-description"
              value={collectionDescription}
              onChange={(e) => setCollectionDescription(e.target.value)}
              placeholder="Describe your collection..."
              rows={3}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              inputId="is-public"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.checked || false)}
              className="p-checkbox-custom"
            />
            <label htmlFor="is-public" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Make this collection public (others can view it)
            </label>
          </div>

          <div>
            <label htmlFor="recipes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Recipes
            </label>
            <MultiSelect
              value={selectedRecipes}
              options={availableRecipes.map(recipe => ({
                label: recipe.title,
                value: recipe.id
              }))}
              onChange={(e) => setSelectedRecipes(e.value)}
              placeholder="Choose recipes for this collection"
              className="w-full"
              filter
              filterBy="label"
              maxSelectedLabels={3}
              selectedItemsLabel="{0} recipes selected"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {selectedRecipes.length} recipe{selectedRecipes.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default RecipeCollections;