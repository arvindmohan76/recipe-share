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
  const toast = React.useRef<Toast>(null);

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

  const handleShareRecipe = () => {
    setShowShareDialog(true);
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
    <div className="max-w-4xl mx-auto space-y-6">
      <Toast ref={toast} />
      
      {/* Recipe Header */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <img
              src={getRecipeImageUrl(recipe.image_url, 'large')}
              alt={recipe.title}
              className="w-full h-64 object-cover rounded-lg"
              onError={handleImageError}
              loading="lazy"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{recipe.title}</h1>
            {recipe.description && (
              <div className="mb-4 p-4 bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-400 rounded-r-lg">
                <p className="text-gray-700 leading-relaxed italic">
                  "{recipe.description}"
                </p>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mb-4">
              {recipe.dietary_tags.map((tag, index) => (
                <Tag key={index} value={tag} className="bg-green-100 text-green-800" />
              ))}
              <Tag value={recipe.cuisine} className="bg-blue-100 text-blue-800" />
              <Tag value={recipe.difficulty} className="bg-yellow-100 text-yellow-800" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <i className="pi pi-clock"></i>
                  <span>Prep: {recipe.prep_time}min</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <i className="pi pi-clock"></i>
                  <span>Cook: {recipe.cooking_time}min</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <i className="pi pi-users"></i>
                  <span>{recipe.servings} servings</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <i className="pi pi-eye"></i>
                  <span>{recipe.view_count} views</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Rating value={4.5} readOnly stars={5} cancel={false} />
              <Button
                label="Share"
                icon="pi pi-share-alt"
                className="p-button-outlined"
                onClick={handleShareRecipe}
              />
              {user && recipe.user_id === user.id && (
                <Button
                  label="Edit"
                  icon="pi pi-pencil"
                  className="p-button-outlined"
                  onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
                />
              )}
            </div>
            
            {/* Cooking Mode Button - Separate Row */}
            <div className="mt-4">
              <Button
                label={isCookingMode ? 'Stop Cooking' : 'Start Cooking'}
                icon={isCookingMode ? 'pi pi-stop' : 'pi pi-play'}
                className={`${isCookingMode ? 'p-button-outlined p-button-danger' : 'p-button-outlined p-button-success'}`}
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
          <div className="flex justify-end gap-3">
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
            <div className="grid grid-cols-2 gap-3">
              <Button
                label="WhatsApp"
                icon="pi pi-whatsapp"
                onClick={shareViaWhatsApp}
                className="p-button-outlined p-button-success flex justify-center"
              />
              <Button
                label="Email"
                icon="pi pi-envelope"
                onClick={shareViaEmail}
                className="p-button-outlined flex justify-center"
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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Ingredients</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {recipe.ingredients.map((ingredient, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded">
              <i className="pi pi-check-circle text-green-500"></i>
              <span>
                {ingredient.amount} {ingredient.unit} {ingredient.name}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Instructions */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Instructions</h2>
        <div className="space-y-4">
          {recipe.steps.map((step, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg ${
                isCookingMode && index === currentStep ? 'bg-blue-50 border-blue-300' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
                  {step.step}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 mb-2">{step.instruction}</p>
                  {step.tips && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                      <div className="flex items-center gap-2">
                        <i className="pi pi-lightbulb text-yellow-600"></i>
                        <span className="text-sm text-yellow-800">Tip: {step.tips}</span>
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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Comments</h2>
        
        {user && (
          <div className="mb-6">
            <InputTextarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts about this recipe..."
              rows={3}
              className="w-full mb-3 p-3 border border-gray-300 rounded-md"
            />
            <Button
              label="Add Comment"
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2"
              disabled={!newComment.trim()}
              onClick={handleAddComment}
            />
          </div>
        )}

        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b pb-4">
              <div className="flex items-center gap-2 mb-2">
                <i className="pi pi-user text-gray-500"></i>
                <span className="font-medium">
                  {comment.user?.full_name || comment.user?.username || 'Anonymous'}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(comment.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700">{comment.comment}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default RecipeDetail;