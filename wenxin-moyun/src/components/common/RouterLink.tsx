import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';

/**
 * RouterLink - A wrapper that ensures correct routing behavior in Cloud Storage static hosting.
 * 
 * In production (Cloud Storage), the app is served from a deep path:
 * https://storage.googleapis.com/wenxin-moyun-prod-new-static/index.html
 * 
 * This component uses navigate() instead of Link to ensure hash routing works correctly.
 */
export function RouterLink({ to, children, className, ...props }: LinkProps & { className?: string }) {
  const navigate = useNavigate();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Navigate using the router's navigate function
    if (typeof to === 'string') {
      navigate(to);
    } else {
      navigate(to);
    }
  };

  return (
    <a 
      href="#" 
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </a>
  );
}

// Export as default for easier drop-in replacement
export default RouterLink;