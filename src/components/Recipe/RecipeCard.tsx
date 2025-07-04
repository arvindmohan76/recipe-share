import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Rating } from 'primereact/rating';
import { Recipe } from '../../lib/supabase';
import { getRecipeImageUrl } from '../../lib/imageUtils';
import { useNavigate } from 'react-router-dom';

interface RecipeCardProps {
  recipe: Recipe;
  onSave?: (recipeId: string) => void;
  isSaved?: boolean;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onSave, isSaved }) => {
  const navigate = useNavigate();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    // Only set fallback if it's not already a fallback image
    if (!target.src.includes('pexels.com')) {
      target.src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400';
    }
  };

  const header = (
    <div className="relative">
      <img
        alt={recipe.title}
        src={getRecipeImageUrl(recipe.image_url, 'medium')}
        className="w-full h-48 object-cover"
        onError={handleImageError}
        loading="lazy"
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

  return (
    <Card
      header={header}
      className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200"
    >
      {/* Card Content - Flex grow to fill available space */}
      <div className="flex flex-col h-full">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem]">
          {recipe.title}
        </h3>

        {/* Description */}
        <div className="flex-grow mb-4">
          {recipe.description && (
            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
              {recipe.description}
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3 min-h-[2rem]">
          {recipe.dietary_tags.slice(0, 2).map((tag, index) => (
            <Tag key={index} value={tag} className="bg-green-100 text-green-800 text-xs px-2 py-1" />
          ))}
          <Tag value={recipe.cuisine} className="bg-blue-100 text-blue-800 text-xs px-2 py-1" />
          <Tag value={recipe.difficulty} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1" />
        </div>

        {/* Recipe Info */}
        <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <i className="pi pi-clock"></i>
              <span>{recipe.cooking_time}min</span>
            </div>
            <div className="flex items-center gap-1">
              <i className="pi pi-users"></i>
              <span>{recipe.servings}</span>
            </div>
          </div>
          <span className="hidden sm:inline">({recipe.view_count} views)</span>
        </div>

        {/* Footer - Always at bottom */}
        <div className="flex justify-between items-center gap-2 mt-auto pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Rating value={4.5} readOnly stars={5} cancel={false} className="text-sm" />
          </div>
          <Button
            label="View"
            icon="pi pi-eye"
            className="p-button-sm flex-shrink-0"
            onClick={() => navigate(`/recipes/${recipe.id}`)}
          />
        </div>
      </div>
    </Card>
  );
};

export default RecipeCard;