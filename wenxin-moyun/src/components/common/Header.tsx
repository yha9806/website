import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Trophy, Home, FlaskConical, Image, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { IOSButton } from '../ios';
import ThemeToggle, { HeaderControls } from './ThemeToggle';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Navigation with Lucide icons (cleaner than emoji)
  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Models', href: '/models', icon: Trophy },
    { name: 'Exhibitions', href: '/exhibitions', icon: Image },
    { name: 'VULCA', href: '/vulca', icon: FlaskConical },
  ];

  const isActive = (path: string) => {
    return location.pathname === path ||
           (path === '/models' && location.pathname.startsWith('/model')) ||
           (path === '/exhibitions' && location.pathname.startsWith('/exhibitions'));
  };

  return (
    <header className="ios-glass border-b border-gray-200/20 dark:border-gray-700/20 sticky top-0 z-50 backdrop-blur-xl">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Minimal Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm transform group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                WenXin MoYun
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI Art Platform</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link key={item.name} to={item.href}>
                <IOSButton
                  variant={isActive(item.href) ? "primary" : "text"}
                  size="sm"
                  className="flex items-center gap-1.5"
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </IOSButton>
              </Link>
            ))}
            <div className="ml-2">
              <HeaderControls />
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center space-x-2 md:hidden">
            <HeaderControls />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-3 space-y-1 ios-glass rounded-xl mt-2 mb-4 border border-gray-200/20 dark:border-gray-700/20">
            {navigation.map((item) => (
              <Link key={item.name} to={item.href} onClick={() => setIsMenuOpen(false)}>
                <IOSButton
                  variant={isActive(item.href) ? "primary" : "text"}
                  size="md"
                  className="w-full justify-start flex items-center gap-3"
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </IOSButton>
              </Link>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}