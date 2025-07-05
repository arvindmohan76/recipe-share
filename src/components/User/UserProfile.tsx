import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { FileUpload } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { Avatar } from 'primereact/avatar';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataView } from 'primereact/dataview';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import RecipeCard from '../Recipe/RecipeCard';

const UserProfile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userRecipes, setUserRecipes] = useState<any[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [recipeEngagement, setRecipeEngagement] = useState<Map<string, any>>(new Map());
  const [savedRecipeIds, setSavedRecipeIds] = useState<Set<string>>(new Set());
  
  // Form state
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchUserRecipes();
      fetchSavedRecipes();
    }
  }, [user]);
  
  useEffect(() => {
    if (userRecipes.length > 0 || savedRecipes.length > 0) {
      fetchRecipeEngagement();
    }
  }, [userRecipes, savedRecipes]);
  
  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      setProfile(data);
      setUsername(data.username || '');
      setFullName(data.full_name || '');
      setBio(data.bio || '');
      setProfilePhoto(data.profile_photo || null);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserRecipes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setUserRecipes(data || []);
    } catch (err) {
      console.error('Error fetching user recipes:', err);
    }
  };
  
  const fetchSavedRecipes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('saved_recipes')
        .select(`
          recipe_id,
          recipes (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      const recipes = data?.map(item => item.recipes).filter(Boolean) || [];
      setSavedRecipes(recipes);
      setSavedRecipeIds(new Set(recipes.map((r: any) => r.id)));
    } catch (err) {
      console.error('Error fetching saved recipes:', err);
    }
  };
  
  const fetchRecipeEngagement = async () => {
    try {
      const allRecipes = [...userRecipes, ...savedRecipes];
      const recipeIds = allRecipes.map(r => r.id);
      
      if (recipeIds.length === 0) return;
      
      // Fetch bookmark counts
      const { data: bookmarkData, error: bookmarkError } = await supabase
        .from('saved_recipes')
        .select('recipe_id')
        .in('recipe_id', recipeIds);
      
      // Fetch comment counts
      const { data: commentData, error: commentError } = await supabase
        .from('recipe_comments')
        .select('recipe_id')
        .in('recipe_id', recipeIds);
      
      if (!bookmarkError && !commentError) {
        const engagementMap = new Map();
        
        // Count bookmarks per recipe
        const bookmarkCounts = bookmarkData?.reduce((acc, item) => {
          acc[item.recipe_id] = (acc[item.recipe_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
        
        // Count comments per recipe
        const commentCounts = commentData?.reduce((acc, item) => {
          acc[item.recipe_id] = (acc[item.recipe_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
        
        // Combine engagement data
        allRecipes.forEach(recipe => {
          engagementMap.set(recipe.id, {
            bookmarkCount: bookmarkCounts[recipe.id] || 0,
            commentCount: commentCounts[recipe.id] || 0
          });
        });
        
        setRecipeEngagement(engagementMap);
      }
    } catch (err) {
      console.error('Failed to fetch recipe engagement:', err);
    }
  };
  
  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      let updatedProfilePhoto = profilePhoto;
      
      // Upload new profile photo if selected
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}/profile.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, photoFile, { upsert: true });
        
        if (uploadError) {
          throw uploadError;
        }
        
        const { data } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);
        
        updatedProfilePhoto = data.publicUrl;
      }
      
      // Update user profile
      const { error } = await supabase
        .from('users')
        .update({
          username,
          full_name: fullName,
          bio,
          profile_photo: updatedProfilePhoto,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      setSuccess('Profile updated successfully');
      setProfile({
        ...profile,
        username,
        full_name: fullName,
        bio,
        profile_photo: updatedProfilePhoto
      });
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };
  
  const handleUnsaveRecipe = async (recipeId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId);
      
      if (!error) {
        setSavedRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
        setSavedRecipeIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(recipeId);
          return newSet;
        });
      }
    } catch (err) {
      console.error('Failed to unsave recipe:', err);
    }
  };
  
  const recipeTemplate = (recipe: any) => {
    const engagement = recipeEngagement.get(recipe.id) || { bookmarkCount: 0, commentCount: 0 };
    
    return (
      <div className="h-full">
        <RecipeCard
          recipe={recipe}
          onSave={activeTab === 1 ? handleUnsaveRecipe : undefined}
          isSaved={savedRecipeIds.has(recipe.id)}
          bookmarkCount={engagement.bookmarkCount}
          commentCount={engagement.commentCount}
        />
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <i className="pi pi-spinner pi-spin text-4xl text-blue-500"></i>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <Card>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {profilePhoto ? (
                <Avatar 
                  image={profilePhoto} 
                  size="xlarge" 
                  shape="circle" 
                  className="w-32 h-32 shadow-md"
                />
              ) : (
                <Avatar 
                  icon="pi pi-user" 
                  size="xlarge" 
                  shape="circle"
                  className="w-32 h-32 bg-blue-500 text-white shadow-md"
                />
              )}
            </div>
            <FileUpload
              mode="basic"
              name="profile-photo"
              accept="image/*"
              maxFileSize={1000000}
              chooseLabel="Change Photo"
              className="p-button-outlined p-button-sm"
              onSelect={(e) => setPhotoFile(e.files[0])}
            />
          </div>
          
          {/* Profile Info Section */}
          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                {profile?.full_name || profile?.username || 'My Profile'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {profile?.email}
              </p>
            </div>
            
            {error && (
              <Message severity="error" text={error} className="w-full" />
            )}
            
            {success && (
              <Message severity="success" text={success} className="w-full" />
            )}
            
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Username
                </label>
                <InputText
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <InputText
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bio
                </label>
                <InputTextarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full"
                />
              </div>
              
              <div className="pt-4">
                <Button
                  label="Save Profile"
                  icon="pi pi-save"
                  className="p-button-success"
                  onClick={handleSaveProfile}
                  loading={saving}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      {/* Recipes Tabs */}
      <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
        <TabPanel header="My Recipes" leftIcon="pi pi-book mr-2">
          <div className="pt-4">
            {userRecipes.length === 0 ? (
              <div className="text-center py-8">
                <i className="pi pi-book text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No Recipes Yet</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  You haven't created any recipes yet. Start sharing your culinary creations!
                </p>
                <Button
                  label="Create Recipe"
                  icon="pi pi-plus"
                  className="p-button-success"
                  onClick={() => window.location.href = '/recipes/new'}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {userRecipes.map((recipe) => (
                  <div key={recipe.id} className="h-full">
                    {recipeTemplate(recipe)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabPanel>
        
        <TabPanel header="Saved Recipes" leftIcon="pi pi-heart mr-2">
          <div className="pt-4">
            {savedRecipes.length === 0 ? (
              <div className="text-center py-8">
                <i className="pi pi-heart text-6xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No Saved Recipes</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  You haven't saved any recipes yet. Explore and bookmark recipes you love!
                </p>
                <Button
                  label="Explore Recipes"
                  icon="pi pi-search"
                  className="p-button-outlined"
                  onClick={() => window.location.href = '/recipes'}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {savedRecipes.map((recipe) => (
                  <div key={recipe.id} className="h-full">
                    {recipeTemplate(recipe)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabPanel>
        
        <TabPanel header="Activity" leftIcon="pi pi-chart-line mr-2">
          <div className="pt-4">
            <div className="text-center py-8">
              <i className="pi pi-chart-line text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">Activity Dashboard</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Track your cooking journey and recipe engagement.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Card className="text-center">
                  <div className="text-4xl font-bold text-blue-500 mb-2">{userRecipes.length}</div>
                  <div className="text-gray-600 dark:text-gray-400">Recipes Created</div>
                </Card>
                <Card className="text-center">
                  <div className="text-4xl font-bold text-green-500 mb-2">{savedRecipes.length}</div>
                  <div className="text-gray-600 dark:text-gray-400">Recipes Saved</div>
                </Card>
                <Card className="text-center">
                  <div className="text-4xl font-bold text-purple-500 mb-2">
                    {userRecipes.reduce((sum, recipe) => sum + (recipe.view_count || 0), 0)}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Total Recipe Views</div>
                </Card>
              </div>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </div>
  );
};

export default UserProfile;