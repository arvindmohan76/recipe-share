/**
 * Utility functions for calculating dynamic recipe ratings
 * based on views, bookmarks, and other engagement metrics
 */

export interface RecipeEngagement {
  view_count: number;
  bookmark_count?: number;
  comment_count?: number;
  rating_count?: number;
  average_rating?: number;
}

/**
 * Calculate dynamic star rating based on engagement metrics
 * @param engagement - Recipe engagement data
 * @returns Rating between 1 and 5 stars
 */
export const calculateDynamicRating = (engagement: RecipeEngagement): number => {
  const {
    view_count = 0,
    bookmark_count = 0,
    comment_count = 0,
    rating_count = 0,
    average_rating = 0
  } = engagement;

  // Base score starts at 2.5 (middle rating)
  let score = 2.5;

  // View count contribution (up to 1.5 points)
  // Logarithmic scale to prevent extremely popular recipes from dominating
  const viewScore = Math.min(1.5, Math.log10(Math.max(1, view_count)) * 0.3);
  score += viewScore;

  // Bookmark ratio contribution (up to 1 point)
  // Higher bookmark-to-view ratio indicates quality
  if (view_count > 0) {
    const bookmarkRatio = bookmark_count / view_count;
    const bookmarkScore = Math.min(1.0, bookmarkRatio * 10); // 10% bookmark ratio = max score
    score += bookmarkScore;
  }

  // Comment engagement (up to 0.5 points)
  // Comments indicate user engagement and interest
  const commentScore = Math.min(0.5, comment_count * 0.1);
  score += commentScore;

  // Actual user ratings (if available) - can override calculated score
  if (rating_count > 0 && average_rating > 0) {
    // Weight actual ratings more heavily if we have enough data
    const ratingWeight = Math.min(1.0, rating_count / 10); // Full weight at 10+ ratings
    score = score * (1 - ratingWeight) + average_rating * ratingWeight;
  }

  // Ensure rating is between 1 and 5
  return Math.max(1, Math.min(5, score));
};

/**
 * Get rating category for display purposes
 */
export const getRatingCategory = (rating: number): string => {
  if (rating >= 4.5) return 'Excellent';
  if (rating >= 4.0) return 'Very Good';
  if (rating >= 3.5) return 'Good';
  if (rating >= 3.0) return 'Average';
  if (rating >= 2.5) return 'Fair';
  return 'Needs Improvement';
};

/**
 * Get rating color for UI styling
 */
export const getRatingColor = (rating: number): string => {
  if (rating >= 4.5) return 'text-green-600';
  if (rating >= 4.0) return 'text-green-500';
  if (rating >= 3.5) return 'text-yellow-500';
  if (rating >= 3.0) return 'text-yellow-600';
  if (rating >= 2.5) return 'text-orange-500';
  return 'text-red-500';
};

/**
 * Format engagement stats for display
 */
export const formatEngagementStats = (engagement: RecipeEngagement): string => {
  const { view_count, bookmark_count = 0 } = engagement;
  
  if (view_count === 0) return 'New recipe';
  
  const parts = [];
  
  if (view_count > 0) {
    parts.push(`${view_count} view${view_count !== 1 ? 's' : ''}`);
  }
  
  if (bookmark_count > 0) {
    parts.push(`${bookmark_count} bookmark${bookmark_count !== 1 ? 's' : ''}`);
  }
  
  return parts.join(' • ');
};

/**
 * Calculate popularity score for sorting
 */
export const calculatePopularityScore = (engagement: RecipeEngagement): number => {
  const { view_count = 0, bookmark_count = 0, comment_count = 0 } = engagement;
  
  // Weighted popularity score
  return (view_count * 1) + (bookmark_count * 5) + (comment_count * 3);
};