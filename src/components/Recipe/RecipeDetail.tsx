import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Rating } from 'primereact/rating';
import { InputTextarea } from 'primereact/inputtextarea';
import { Message } from 'primereact/message';
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

  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      fetchRecipe();
      fetchComments();
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
        speechSynthesis.speak(utterance);
      }
    } else if (lowerCommand.includes('start cooking')) {
      setIsCookingMode(true);
      console.log('Starting cooking mode');
    } else if (lowerCommand.includes('stop cooking')) {
      setIsCookingMode(false);
      console.log('Stopping cooking mode');
    }
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
      {/* Recipe Header */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <img
              src={getRecipeImageUrl(recipe.image_url, 'large')}
              alt={recipe.title}
              className="w-full h-64 object-cover rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800';
              }}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{recipe.title}</h1>
            <p className="text-gray-600 mb-4">{recipe.description}</p>
            
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
              {user && recipe.user_id === user.id && (
                <Button
                  label="Edit Recipe"
                  icon="pi pi-pencil"
                  className="p-button-outlined mr-3"
                  onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
                />
              )}
              <Button
                label={isCookingMode ? 'Stop Cooking Mode' : 'Start Cooking Mode'}
                icon={isCookingMode ? 'pi pi-stop' : 'pi pi-play'}
                className={`px-4 py-2 ${isCookingMode ? 'p-button-danger' : 'p-button-success'}`}
                onClick={() => setIsCookingMode(!isCookingMode)}
              />
            </div>
          </div>
        </div>
      </Card>

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