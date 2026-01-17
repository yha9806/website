/**
 * usePageMeta Hook
 *
 * Manages page-level meta tags for SEO optimization.
 * Updates document title and meta tags when component mounts.
 */

import { useEffect } from 'react';

interface PageMetaOptions {
  /** Page title (will be appended with " | VULCA") */
  title: string;
  /** Meta description for search engines */
  description: string;
  /** Open Graph title (defaults to title) */
  ogTitle?: string;
  /** Open Graph description (defaults to description) */
  ogDescription?: string;
  /** Open Graph image URL */
  ogImage?: string;
  /** Canonical URL for this page */
  canonicalUrl?: string;
  /** Whether to append " | VULCA" suffix to title */
  appendSuffix?: boolean;
}

const DEFAULT_OG_IMAGE = 'https://vulcaart.art/og-image.png';
const SITE_NAME = 'VULCA';

/**
 * Hook to manage page-level SEO meta tags
 *
 * @example
 * ```tsx
 * usePageMeta({
 *   title: 'Pricing - Free, Pilot, Enterprise',
 *   description: 'Choose the VULCA plan that fits your AI evaluation needs.'
 * });
 * ```
 */
export function usePageMeta({
  title,
  description,
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
  canonicalUrl,
  appendSuffix = true,
}: PageMetaOptions): void {
  useEffect(() => {
    // Update document title
    const fullTitle = appendSuffix ? `${title} | ${SITE_NAME}` : title;
    document.title = fullTitle;

    // Helper to update or create meta tag
    const updateMetaTag = (selector: string, attribute: string, value: string) => {
      let tag = document.querySelector(selector) as HTMLMetaElement | null;
      if (tag) {
        tag.setAttribute(attribute === 'content' ? 'content' : attribute, value);
      } else {
        tag = document.createElement('meta');
        const attrName = selector.includes('property=') ? 'property' : 'name';
        const attrValue = selector.match(/["']([^"']+)["']/)?.[1] || '';
        tag.setAttribute(attrName, attrValue);
        tag.setAttribute('content', value);
        document.head.appendChild(tag);
      }
    };

    // Update meta description
    updateMetaTag('meta[name="description"]', 'content', description);

    // Update Open Graph tags
    updateMetaTag('meta[property="og:title"]', 'content', ogTitle || fullTitle);
    updateMetaTag('meta[property="og:description"]', 'content', ogDescription || description);
    updateMetaTag('meta[property="og:image"]', 'content', ogImage);
    updateMetaTag('meta[property="og:type"]', 'content', 'website');
    updateMetaTag('meta[property="og:site_name"]', 'content', SITE_NAME);

    // Update Twitter Card tags
    updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image');
    updateMetaTag('meta[name="twitter:title"]', 'content', ogTitle || fullTitle);
    updateMetaTag('meta[name="twitter:description"]', 'content', ogDescription || description);
    updateMetaTag('meta[name="twitter:image"]', 'content', ogImage);

    // Update canonical URL
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (canonical) {
        canonical.href = canonicalUrl;
      } else {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        canonical.href = canonicalUrl;
        document.head.appendChild(canonical);
      }
    }
  }, [title, description, ogTitle, ogDescription, ogImage, canonicalUrl, appendSuffix]);
}

export default usePageMeta;
