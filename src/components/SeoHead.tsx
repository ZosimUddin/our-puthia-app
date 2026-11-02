import React from 'react';
import SEO from './SEO';

interface SeoHeadProps {
  title: string;
  description: string;
  url?: string;
  image?: string;
}

/**
 * Backward compatible wrapper for the unified SEO component.
 * Delegates to SEO component which uses react-helmet-async.
 */
export const SeoHead = ({ title, description, url, image }: SeoHeadProps) => {
  // Translate 'url' prop to 'path' if it's relative, or just pass as is if SEO handles it
  // For now, we'll just pass title, description and image to maintain safety.
  return (
    <SEO 
      title={title} 
      description={description} 
      image={image}
      path={url}
    />
  );
};

export default SeoHead;

