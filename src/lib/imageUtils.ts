import { supabase } from './supabase';

// Default fallback images from Pexels
const DEFAULT_RECIPE_IMAGES = [
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=800'
];

// Image cache for better performance
const imageCache = new Map<string, string>();

/**
 * Get a random default recipe image
 */
export const getDefaultRecipeImage = (): string => {
  const randomIndex = Math.floor(Math.random() * DEFAULT_RECIPE_IMAGES.length);
  return DEFAULT_RECIPE_IMAGES[randomIndex];
};

/**
 * Upload image to Supabase Storage
 */
export const uploadRecipeImage = async (file: File, userId: string): Promise<string | null> => {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.');
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size too large. Please upload images smaller than 5MB.');
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    console.log('Uploading image:', fileName);

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('Upload successful:', data);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    console.log('Public URL:', publicUrl);

    // Cache the URL
    imageCache.set(fileName, publicUrl);

    return publicUrl;
  } catch (error) {
    console.error('Image upload failed:', error);
    return null;
  }
};

/**
 * Get optimized image URL with fallback
 */
export const getRecipeImageUrl = (imageUrl?: string | null, size: 'small' | 'medium' | 'large' = 'medium'): string => {
  // If no image URL provided, return default
  if (!imageUrl) {
    return getDefaultRecipeImage();
  }

  // If it's already a Pexels URL or external URL, return as is
  if (imageUrl.includes('pexels.com') || imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // If it's a Supabase storage URL, check cache first
  if (imageCache.has(imageUrl)) {
    return imageCache.get(imageUrl)!;
  }

  // For Supabase URLs, add transformation parameters for optimization
  try {
    const url = new URL(imageUrl);
    const sizeParams = {
      small: 'width=400&height=300',
      medium: 'width=800&height=600', 
      large: 'width=1200&height=900'
    };
    
    // Add transformation parameters if it's a Supabase URL
    if (url.hostname.includes('supabase')) {
      url.searchParams.set('transform', sizeParams[size]);
    }
    
    const optimizedUrl = url.toString();
    imageCache.set(imageUrl, optimizedUrl);
    return optimizedUrl;
  } catch (error) {
    console.error('Error processing image URL:', error);
    return getDefaultRecipeImage();
  }
};

/**
 * Delete image from Supabase Storage
 */
export const deleteRecipeImage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    if (!fileName) {
      return false;
    }

    const { error } = await supabase.storage
      .from('recipe-images')
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    // Remove from cache
    imageCache.delete(imageUrl);
    return true;
  } catch (error) {
    console.error('Image deletion failed:', error);
    return false;
  }
};

/**
 * Preload image to check if it exists and is accessible
 */
export const preloadImage = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
};

/**
 * Get image with fallback handling
 */
export const getImageWithFallback = async (imageUrl?: string | null): Promise<string> => {
  if (!imageUrl) {
    return getDefaultRecipeImage();
  }

  const processedUrl = getRecipeImageUrl(imageUrl);
  const isAccessible = await preloadImage(processedUrl);
  
  return isAccessible ? processedUrl : getDefaultRecipeImage();
};