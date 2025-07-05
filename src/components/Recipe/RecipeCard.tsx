import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Rating } from 'primereact/rating';
import { Recipe } from '../../lib/supabase';
import { calculateDynamicRating, formatEngagementStats, getRatingColor } from '../../lib/ratingUtils';
import { getRecipeImageUrl } from '../../lib/imageUtils';
import { useNavigate } from 'react-router-dom';

interface RecipeCardProps {
  recipe: Recipe;
  onSave?: (recipeId: string) => void;
  isSaved?: boolean;
  bookmarkCount?: number;
  commentCount?: number;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ 
  recipe, 
  onSave, 
  isSaved, 
  bookmarkCount = 0,
  commentCount = 0 
}) => {
  const navigate = useNavigate();

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    // Only set fallback if it's not already a fallback image
    if (!target.src.includes('pexels.com')) {
      target.src = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400';
    }
  };

  // Calculate dynamic rating based on engagement
  const dynamicRating = calculateDynamicRating({
    view_count: recipe.view_count,
    bookmark_count: bookmarkCount,
    comment_count: commentCount
  });

  const engagementStats = formatEngagementStats({
    view_count: recipe.view_count,
    bookmark_count: bookmarkCount,
    comment_count: commentCount
  });

  const header = (
    <div className="relative">
      <img
        alt={recipe.title}
        src={getRecipeImageUrl(recipe.image_url, 'medium')}
        className="w-full h-48 object-cover"
        onError={handleImageError}
        loading="lazy"
      />
      {onSave && (
        <div className="absolute top-3 right-3">
          <Button
            icon={isSaved ? 'pi pi-heart-fill' : 'pi pi-heart'}
            className={`p-button-rounded p-button-text transition-all duration-200 ${
              isSaved 
                ? 'text-red-500 hover:text-red-600 bg-white/90 hover:bg-white shadow-md' 
                : 'text-white hover:text-red-400 bg-black/30 hover:bg-black/50'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSave(recipe.id);
            }}
            tooltip={isSaved ? 'Remove from bookmarks' : 'Add to bookmarks'}
            tooltipOptions={{ position: 'left' }}
          />
        </div>
      )}
      
      {/* Recipe metadata overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="flex items-center justify-between text-white text-sm">
          <div className="flex items-center gap-2">
            <span className="bg-black/50 px-2 py-1 rounded-full text-xs">
              {recipe.difficulty}
            </span>
            <span className="bg-black/50 px-2 py-1 rounded-full text-xs">
              {recipe.cooking_time}min
            </span>
          </div>
          <div className="flex items-center gap-1">
            <i className="pi pi-eye text-xs"></i>
            <span className="text-xs">{recipe.view_count}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card
      header={header}
      className="h-full flex flex-col hover:shadow-lg transition-all duration-200 cursor-pointer group dark:bg-gray-800 dark:border-gray-700"
      onClick={() => navigate(`/recipes/${recipe.id}`)}
    >
      {/* Card Content - Flex grow to fill available space */}
      <div className="flex flex-col h-full">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2 min-h-[3.5rem] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {recipe.title}
        </h3>

        {/* Description */}
        <div className="flex-grow mb-4">
          {recipe.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
              {recipe.description}
            </p>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3 min-h-[2rem]">
          {recipe.dietary_tags.slice(0, 2).map((tag, index) => (
            <Tag key={index} value={tag} className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1" />
          ))}
          <Tag value={recipe.cuisine} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1" />
        </div>

        {/* Recipe Info */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <i className="pi pi-users"></i>
              <span>{recipe.servings} servings</span>
            </div>
            <div className="flex items-center gap-1">
              <i className="pi pi-clock"></i>
              <span>{recipe.prep_time + recipe.cooking_time}min total</span>
            </div>
          </div>
        </div>

        {/* Footer - Always at bottom */}
        <div className="flex flex-col gap-3 mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Rating 
                value={dynamicRating} 
                readOnly 
                stars={5} 
                cancel={false} 
                className="text-sm" 
              />
              <span className={`text-xs font-medium ${getRatingColor(dynamicRating)}`}>
                {dynamicRating.toFixed(1)}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {engagementStats}
            </div>
          </div>
          <div className="w-full">
            <Button
              label="View Recipe"
              icon="pi pi-arrow-right"
              className="w-full p-button-sm p-button-outlined group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-all"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/recipes/${recipe.id}`);
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RecipeCard;