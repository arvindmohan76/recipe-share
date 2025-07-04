import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Rating } from 'primereact/rating';
import { Recipe } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface RecipeCardProps {
  recipe: Recipe;
  onSave?: (recipeId: string) => void;
  isSaved?: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSave, isSaved }) => {
  const navigate = useNavigate();

  const header = (
    <div className="relative">
      <img
        alt={recipe.title}
        src={recipe.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'}
        className="w-full h-48 object-cover rounded-t-lg"
      />
      <div className="absolute top-2 right-2">
        <Button
          icon={isSaved ? 'pi pi-heart-fill' : 'pi pi-heart'}
          className={`p-button-rounded p-button-text ${isSaved ? 'text-red-500' : 'text-white'}`}
          onClick={() => onSave?.(recipe.id)}
        />
      </div>
    </div>
  );

  const footer = (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Rating value={4.5} readOnly stars={5} cancel={false} />
        <span className="text-sm text-gray-600">({recipe.view_count} views)</span>
      </div>
      <Button
        label="View Recipe"
        icon="pi pi-eye"
        onClick={() => navigate(`/recipes/${recipe.id}`)}
      />
    </div>
  );

  return (
    <Card
      title={recipe.title}
      subTitle={recipe.description}
      header={header}
      footer={footer}
      className="mb-4 hover:shadow-lg transition-shadow"
    >
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {recipe.dietary_tags.map((tag, index) => (
            <Tag key={index} value={tag} className="bg-green-100 text-green-800" />
          ))}
          <Tag value={recipe.cuisine} className="bg-blue-100 text-blue-800" />
          <Tag value={recipe.difficulty} className="bg-yellow-100 text-yellow-800" />
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <i className="pi pi-clock"></i>
            <span>{recipe.cooking_time}min</span>
          </div>
          <div className="flex items-center gap-1">
            <i className="pi pi-users"></i>
            <span>{recipe.servings} servings</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RecipeCard;