import React from 'react';
import { Link as RouterLink, LinkProps } from 'react-router-dom';
import { isProductionEnvironment } from '../../utils/routerUtils';

/**
 * SafeLink component that ensures proper navigation in both development and production
 * Handles HashRouter navigation correctly when hosted on Cloud Storage
 */
export function SafeLink({ to, children, ...props }: LinkProps) {
  // In production (Cloud Storage), we need to handle navigation differently
  if (isProductionEnvironment()) {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      
      // Convert the path to a string if it's an object
      const path = typeof to === 'string' ? to : to.pathname || '/';
      
      // For HashRouter, we need to update the hash directly
      if (path.startsWith('/')) {
        window.location.hash = path;
      } else {
        window.location.hash = `/${path}`;
      }
    };
    
    // Render a regular anchor tag with onClick handler
    return (
      <a
        {...props}
        href={`#${typeof to === 'string' ? to : to.pathname || '/'}`}
        onClick={handleClick}
      >
        {children}
      </a>
    );
  }
  
  // In development, use the regular React Router Link
  return (
    <RouterLink to={to} {...props}>
      {children}
    </RouterLink>
  );
}

export default SafeLink;