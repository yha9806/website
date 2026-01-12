/**
 * useSEO Hook
 *
 * Automatically updates document meta tags based on current route.
 * Adds JSON-LD structured data for SEO.
 *
 * @module hooks/useSEO
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  updatePageMeta,
  getOrganizationStructuredData,
  getSoftwareApplicationStructuredData,
  getDatasetStructuredData,
} from '../config/seo';

/**
 * Hook to manage SEO meta tags and structured data
 */
export function useSEO(): void {
  const location = useLocation();

  useEffect(() => {
    // Update meta tags based on current path
    const path = location.pathname;
    updatePageMeta(path);

    // Add structured data on mount (only once)
    addStructuredData();
  }, [location.pathname]);
}

/**
 * Add JSON-LD structured data to the document
 */
function addStructuredData(): void {
  // Check if already added
  if (document.querySelector('script[data-seo="structured-data"]')) {
    return;
  }

  const structuredData = [
    getOrganizationStructuredData(),
    getSoftwareApplicationStructuredData(),
    getDatasetStructuredData(),
  ];

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-seo', 'structured-data');
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
}

/**
 * Component wrapper for pages that need specific SEO
 */
export function usePageSEO(customMeta?: {
  title?: string;
  description?: string;
  ogImage?: string;
}): void {
  useEffect(() => {
    if (customMeta?.title) {
      document.title = customMeta.title;
    }

    if (customMeta?.description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute('content', customMeta.description);
      }
    }

    if (customMeta?.ogImage) {
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        ogImage.setAttribute('content', customMeta.ogImage);
      }
    }
  }, [customMeta?.title, customMeta?.description, customMeta?.ogImage]);
}

export default useSEO;
