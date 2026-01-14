/**
 * Breadcrumb - Navigation breadcrumb component
 * Follows iOS design system and product manual section 2.2/2.3 requirements
 */

import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  className?: string;
}

export function Breadcrumb({ items, showHome = true, className = '' }: BreadcrumbProps) {
  // Prepend home item if showHome is true
  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: 'Home', href: '/', icon: <Home className="w-4 h-4" /> }, ...items]
    : items;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1 text-sm ${className}`}
    >
      <ol className="flex items-center gap-1 flex-wrap">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;

          return (
            <Fragment key={index}>
              <li className="flex items-center">
                {item.href && !isLast ? (
                  <Link
                    to={item.href}
                    className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-slate-500 transition-colors"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <span
                    className={`flex items-center gap-1.5 ${
                      isLast
                        ? 'text-gray-900 dark:text-gray-100 font-medium'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.icon}
                    <span className="truncate max-w-[200px]">{item.label}</span>
                  </span>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="text-gray-400 dark:text-gray-500">
                  <ChevronRight className="w-4 h-4" />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
