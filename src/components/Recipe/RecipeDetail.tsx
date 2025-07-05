import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Rating } from 'primereact/rating';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Menu } from 'primereact/menu';
import { MenuItem } from 'primereact/menuitem';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { supabase, Recipe, RecipeComment } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { getRecipeImageUrl } from '../../lib/imageUtils';
import VoiceController from '../Voice/VoiceController';

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [comments, setComments] = useState<RecipeComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = React.useRef<Toast>(null);
  const moreOptionsMenu = React.useRef<Menu>(null);

  const { user } = useAuth();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    // Only set fallback if it's not already a fallback image
    if (!target.src.includes('pexels.com')) {
      target.src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800';
    }
  };
  useEffect(() => {
    if (id) {
      fetchRecipe();
      fetchComments();
      checkIfSaved();
      // Set the share URL when component mounts
      setShareUrl(window.location.href);
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
      } else {
        setRecipe(data);
        // Increment view count
        await supabase
          .from('recipes')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', id);
      }
    } catch (err) {
      setError('Failed to fetch recipe');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('recipe_comments')
        .select(`
          *,
          user:users(username, full_name)
        `)
        .eq('recipe_id', id)
        .order('created_at', { ascending: false });

      if (!error) {
        setComments(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const checkIfSaved = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from('saved_recipes')
        .select('id')
        .eq('user_id', user.id)
        .eq('recipe_id', id);

      if (!error && data && data.length > 0) {
        setIsSaved(true);
      }
    } catch (err) {
      // Recipe not saved, which is fine
    }
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('recipe_comments')
        .insert([
          {
            recipe_id: id,
            user_id: user.id,
            comment: newComment.trim(),
          },
        ]);

      if (!error) {
        setNewComment('');
        fetchComments();
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleSaveRecipe = async () => {
    if (!user || !id) return;

    try {
      if (isSaved) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_recipes')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', id);

        if (!error) {
          setIsSaved(false);
          toast.current?.show({
            severity: 'info',
            summary: 'Removed',
            detail: 'Recipe removed from bookmarks',
            life: 3000
          });
        }
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_recipes')
          .insert([{ user_id: user.id, recipe_id: id }]);

        if (!error) {
          setIsSaved(true);
          toast.current?.show({
            severity: 'success',
            summary: 'Saved!',
            detail: 'Recipe added to your bookmarks',
            life: 3000
          });
        }
      }
    } catch (err) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update bookmark',
        life: 3000
      });
    }
  };

  const handleAddToShoppingList = () => {
    // Navigate to shopping lists with recipe ingredients
    navigate('/shopping-lists', { 
      state: { 
        addRecipe: {
          id: recipe?.id,
          title: recipe?.title,
          ingredients: recipe?.ingredients
        }
      }
    });
  };

  const handleAddToCollection = () => {
    // Navigate to collections page
    navigate('/collections', {
      state: {
        addRecipe: recipe?.id
      }
    });
  };

  const handlePrintRecipe = () => {
    window.print();
  };

  const handleShareRecipe = () => {
    setShowShareDialog(true);
  };

  const handleDeleteRecipe = () => {
    confirmDialog({
      message: `Are you sure you want to delete "${recipe?.title}"? This action cannot be undone.`,
      header: 'Delete Recipe',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: async () => {
        if (!user || !recipe || recipe.user_id !== user.id) {
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: 'You can only delete your own recipes',
            life: 3000
          });
          return;
        }

        setIsDeleting(true);
        try {
          // Delete the recipe from database
          const { error } = await supabase
            .from('recipes')
            .delete()
            .eq('id', recipe.id)
            .eq('user_id', user.id); // Extra security check

          if (error) {
            throw error;
          }

          toast.current?.show({
            severity: 'success',
            summary: 'Recipe Deleted',
            detail: 'Your recipe has been successfully deleted',
            life: 3000
          });

          // Navigate back to recipes list after a short delay
          setTimeout(() => {
            navigate('/recipes');
          }, 1500);

        } catch (err) {
          console.error('Error deleting recipe:', err);
          toast.current?.show({
            severity: 'error',
            summary: 'Delete Failed',
            detail: 'Failed to delete recipe. Please try again.',
            life: 3000
          });
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  const moreOptionsItems: MenuItem[] = [
    {
      label: isSaved ? 'Remove Bookmark' : 'Add Bookmark',
      icon: isSaved ? 'pi pi-heart-fill' : 'pi pi-heart',
      command: handleSaveRecipe
    },
    {
      label: 'Add to Shopping List',
      icon: 'pi pi-shopping-cart',
      command: handleAddToShoppingList
    },
    {
      label: 'Add to Collection',
      icon: 'pi pi-folder-plus',
      command: handleAddToCollection
    },
    {
      separator: true
    },
    {
      label: 'Print Recipe',
      icon: 'pi pi-print',
      command: handlePrintRecipe
    },
    {
      label: 'Share Recipe',
      icon: 'pi pi-share-alt',
      command: handleShareRecipe
    },
    // Add delete option only for recipe owner
    ...(user && recipe && recipe.user_id === user.id ? [
      {
        separator: true
      },
      {
        label: 'Delete Recipe',
        icon: 'pi pi-trash',
        command: handleDeleteRecipe,
        className: 'text-red-600'
      }
    ] : [])
  ];

  // Owner-specific menu items (for the main action buttons)
  const ownerMenuItems: MenuItem[] = [
    {
      label: 'Edit Recipe',
      icon: 'pi pi-pencil',
      command: () => navigate(`/recipes/${recipe?.id}/edit`)
    },
    {
      separator: true
    },
    {
      label: 'Delete Recipe',
      icon: 'pi pi-trash',
      command: handleDeleteRecipe,
      className: 'text-red-600'
    }
  ];

  const handleVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();
    
    console.log('Voice command received:', lowerCommand);
    
    if (lowerCommand.includes('next step')) {
      if (recipe && currentStep < recipe.steps.length - 1) {
        setCurrentStep(currentStep + 1);
        console.log('Moving to next step:', currentStep + 1);
      }
    } else if (lowerCommand.includes('previous step')) {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
        console.log('Moving to previous step:', currentStep - 1);
      }
    } else if (lowerCommand.includes('read ingredients')) {
      console.log('Reading ingredients...');
      if (recipe && 'speechSynthesis' in window) {
        const ingredientsList = recipe.ingredients.map(ing => 
          `${ing.amount} ${ing.unit} ${ing.name}`
        ).join(', ');
        const utterance = new SpeechSynthesisUtterance(`Ingredients: ${ingredientsList}`);
        utterance.rate = 0.8; // Slower speech for better comprehension
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
      }
    } else if (lowerCommand.includes('read current step') || lowerCommand.includes('read step')) {
      console.log('Reading current step...');
      if (recipe && 'speechSynthesis' in window && recipe.steps[currentStep]) {
        const currentStepText = recipe.steps[currentStep].instruction;
        const utterance = new SpeechSynthesisUtterance(`Step ${currentStep + 1}: ${currentStepText}`);
        utterance.rate = 0.8;
        utterance.volume = 0.8;
        speechSynthesis.speak(utterance);
      }
    } else if (lowerCommand.includes('start cooking')) {
      setIsCookingMode(true);
      console.log('Starting cooking mode');
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Cooking mode activated. You can now use voice commands to navigate through the recipe.');
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
      }
    } else if (lowerCommand.includes('stop cooking')) {
      setIsCookingMode(false);
      console.log('Stopping cooking mode');
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Cooking mode deactivated.');
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
      }
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.current?.show({
        severity: 'success',
        summary: 'Link Copied!',
        detail: 'Recipe link has been copied to your clipboard',
        life: 3000
      });
      setShowShareDialog(false);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      toast.current?.show({
        severity: 'success',
        summary: 'Link Copied!',
        detail: 'Recipe link has been copied to your clipboard',
        life: 3000
      });
      setShowShareDialog(false);
    }
  };

  const shareViaWhatsApp = () => {
    const message = `Check out this amazing recipe: ${recipe?.title}\n${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = () => {
    const subject = `Recipe: ${recipe?.title}`;
    const body = `Hi!\n\nI found this amazing recipe and thought you might like it:\n\n${recipe?.title}\n${recipe?.description || ''}\n\nCheck it out here: ${shareUrl}\n\nHappy cooking!`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <i className="pi pi-spinner pi-spin text-4xl text-blue-500"></i>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <Message severity="error" text={error || 'Recipe not found'} className="w-full" />
    );
  }

  return (
    <div className="space-y-8">
      <Toast ref={toast} />
      <ConfirmDialog />
      
      {/* Recipe Header */}
      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="relative">
              <img
                src={getRecipeImageUrl(recipe.image_url, 'large')}
                alt={recipe.title}
                className="w-full h-80 object-cover rounded-lg"
                onError={handleImageError}
                loading="lazy"
              />
              {user && (
                <div className="absolute top-3 right-3">
                  <Button
                    icon={isSaved ? 'pi pi-heart-fill' : 'pi pi-heart'}
                    className={`p-button-rounded p-button-text transition-all duration-200 ${
                      isSaved 
                        ? 'text-red-500 hover:text-red-600 bg-white/90 hover:bg-white shadow-md' 
                        : 'text-white hover:text-red-400 bg-black/30 hover:bg-black/50'
                    }`}
                    onClick={handleSaveRecipe}
                    tooltip={isSaved ? 'Remove from bookmarks' : 'Add to bookmarks'}
                    tooltipOptions={{ position: 'left' }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-between">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{recipe.title}</h1>
            {recipe.description && (
              <div className="mb-6 p-5 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-l-4 border-orange-400 dark:border-orange-500 rounded-r-lg">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic text-lg">
                  "{recipe.description}"
                </p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-3 mb-6">
              {recipe.dietary_tags.map((tag, index) => (
                <Tag key={index} value={tag} className="bg-green-100 text-green-800 px-3 py-1" />
              ))}
              <Tag value={recipe.cuisine} className="bg-blue-100 text-blue-800 px-3 py-1" />
              <Tag value={recipe.difficulty} className="bg-yellow-100 text-yellow-800 px-3 py-1" />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                  <i className="pi pi-clock"></i>
                  <span className="font-medium">Prep: {recipe.prep_time}min</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <i className="pi pi-clock"></i>
                  <span className="font-medium">Cook: {recipe.cooking_time}min</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                  <i className="pi pi-users"></i>
                  <span className="font-medium">{recipe.servings} servings</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <i className="pi pi-eye"></i>
                  <span className="font-medium">{recipe.view_count} views</span>
                </div>
              </div>
            </div>

            <div className="recipe-actions mb-4">
              <Button
                label={isSaved ? 'Bookmarked' : 'Bookmark'}
                icon={isSaved ? 'pi pi-heart-fill' : 'pi pi-heart'}
                className={`flex-shrink-0 ${isSaved ? 'p-button-success' : 'p-button-outlined'}`}
                onClick={handleSaveRecipe}
              />
              <Button
                label="More Options"
                icon="pi pi-ellipsis-v"
                className="p-button-outlined flex-shrink-0"
                onClick={(e) => moreOptionsMenu.current?.toggle(e)}
              />
              <Rating value={4.5} readOnly stars={5} cancel={false} />
              {user && recipe.user_id === user.id && (
                <>
                  <Button
                    label="Edit Recipe"
                    icon="pi pi-pencil"
                    className="p-button-outlined flex-shrink-0"
                    onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
                  />
                  <Button
                    label="Delete Recipe"
                    icon="pi pi-trash"
                    className="p-button-outlined p-button-danger flex-shrink-0"
                    onClick={handleDeleteRecipe}
                    loading={isDeleting}
                  />
                </>
              )}
            </div>

            {/* More Options Menu */}
            <Menu
              ref={moreOptionsMenu}
              model={moreOptionsItems}
              popup
            />
            
            {/* Cooking Mode Button - Separate Row */}
            <div className="mt-4">
              <Button
                label={isCookingMode ? 'Stop Cooking Mode' : 'Start Cooking Mode'}
                icon={isCookingMode ? 'pi pi-stop' : 'pi pi-play'}
                className={`w-full ${isCookingMode ? 'p-button-danger' : 'p-button-success'}`}
                onClick={() => setIsCookingMode(!isCookingMode)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Share Recipe Dialog */}
      <Dialog
        header={
          <div className="flex items-center gap-3">
            <i className="pi pi-share-alt text-blue-500"></i>
            <span>Share Recipe</span>
          </div>
        }
        visible={showShareDialog}
        onHide={() => setShowShareDialog(false)}
        style={{ width: '90vw', maxWidth: '500px' }}
        footer={
          <div className="button-container justify-end">
            <Button
              label="Close"
              onClick={() => setShowShareDialog(false)}
              className="p-button-outlined"
            />
          </div>
        }
      >
        <div className="space-y-6">
          {/* Recipe Preview */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <img
              src={getRecipeImageUrl(recipe?.image_url, 'small')}
              alt={recipe?.title}
              className="w-16 h-16 object-cover rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('pexels.com')) {
                  target.src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400';
                }
              }}
            />
            <div>
              <h4 className="font-semibold text-gray-800">{recipe?.title}</h4>
              <p className="text-sm text-gray-600">
                {recipe?.cuisine} • {recipe?.cooking_time}min • {recipe?.difficulty}
              </p>
            </div>
          </div>

          {/* Copy Link Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Recipe Link
            </label>
            <div className="flex gap-3">
              <InputText
                value={shareUrl}
                readOnly
                className="flex-1"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                label="Copy"
                icon="pi pi-copy"
                onClick={copyToClipboard}
                className="p-button-success"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Click the link to select all, or use the Copy button
            </p>
          </div>

          {/* Quick Share Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Share
            </label>
            <div className="button-container">
              <Button
                label="WhatsApp"
                icon="pi pi-whatsapp"
                onClick={shareViaWhatsApp}
                className="p-button-outlined p-button-success"
              />
              <Button
                label="Email"
                icon="pi pi-envelope"
                onClick={shareViaEmail}
                className="p-button-outlined"
              />
            </div>
          </div>

          {/* Share Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <i className="pi pi-info-circle text-blue-500 mt-0.5"></i>
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">Sharing Tips:</p>
                <ul className="text-blue-700 space-y-1">
                  <li>• Copy the link to share anywhere</li>
                  <li>• Use WhatsApp for quick mobile sharing</li>
                  <li>• Email includes recipe details automatically</li>
                  <li>• Anyone with the link can view this recipe</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Voice Controller */}
      {isCookingMode && (
        <VoiceController onCommand={handleVoiceCommand} />
      )}

      {/* Ingredients */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Ingredients</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {recipe.ingredients.map((ingredient, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <i className="pi pi-check-circle text-green-500 dark:text-green-400"></i>
              <span className="font-medium">
                {ingredient.amount} {ingredient.unit} {ingredient.name}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Instructions */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Instructions</h2>
        <div className="space-y-6">
          {recipe.steps.map((step, index) => (
            <div
              key={index}
              className={`p-6 border rounded-lg transition-all duration-200 ${
                isCookingMode && index === currentStep 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 shadow-md transform scale-[1.02]' 
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  isCookingMode && index === currentStep ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-500 dark:bg-gray-600'
                }`}>
                  {step.step}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 dark:text-gray-200 text-lg leading-relaxed mb-3">{step.instruction}</p>
                  {step.tips && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <i className="pi pi-lightbulb text-yellow-600 dark:text-yellow-400"></i>
                        <div>
                          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Pro Tip:</span>
                          <span className="text-sm text-yellow-800 dark:text-yellow-200 ml-1">{step.tips}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Comments */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Comments</h2>
        
        {user && (
          <div className="mb-6">
            <InputTextarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this recipe..."
              rows={4}
              className="w-full mb-4"
            />
            <div className="button-container">
              <Button
                label="Add Comment"
                icon="pi pi-comment"
                className="p-button-success"
                disabled={!newComment.trim()}
                onClick={handleAddComment}
              />
            </div>
          </div>
        )}

        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <i className="pi pi-user text-gray-500 dark:text-gray-400"></i>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {comment.user?.full_name || comment.user?.username || 'Anonymous'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{comment.comment}</p>
            </div>
          ))}
          
          {comments.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <i className="pi pi-comment text-4xl mb-3 block"></i>
              <p>No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RecipeDetail;