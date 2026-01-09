import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Trophy, Swords, Info, Home, BarChart3, GitCompare, FlaskConical, Image } from 'lucide-react';
import { useState } from 'react';
import { IOSButton } from '../ios';
import { EmojiIcon } from '../ios';
import ThemeToggle, { HeaderControls } from './ThemeToggle';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Home', href: '/', icon: Home, emoji: 'home' },
    { name: 'Rankings', href: '/leaderboard', icon: Trophy, emoji: 'leaderboard' },
    { name: 'Exhibitions', href: '/exhibitions', icon: Image, emoji: 'visual' },
    { name: 'VULCA', href: '/vulca', icon: BarChart3, emoji: 'analytics' },
    { name: 'Battles', href: '/battle', icon: Swords, emoji: 'battle' },
    { name: 'Compare', href: '/compare', icon: GitCompare, emoji: 'compare' },
    { name: 'About', href: '/about', icon: Info, emoji: 'info' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path ||
           (path === '/leaderboard' && location.pathname.startsWith('/leaderboard')) ||
           (path === '/exhibitions' && location.pathname.startsWith('/exhibitions'));
  };

  return (
    <header className="ios-glass border-b border-gray-200/20 dark:border-gray-700/20 sticky top-0 z-50 backdrop-blur-xl">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Simplified Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-md transform group-hover:scale-105 transition-transform duration-300">
              <EmojiIcon category="content" name="visual" size="lg" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                WenXin MoYun
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI Art Platform</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navigation.map((item) => (
              <Link key={item.name} to={item.href}>
                <IOSButton
                  variant={isActive(item.href) ? "primary" : "text"}
                  size="sm"
                  className="flex items-center space-x-2"
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  <EmojiIcon category="navigation" name={item.emoji as any} size="xs" />
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
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2 ios-glass rounded-2xl mt-2 mb-4 border border-gray-200/20 dark:border-gray-700/20">
            {navigation.map((item) => (
              <Link key={item.name} to={item.href} onClick={() => setIsMenuOpen(false)}>
                <IOSButton
                  variant={isActive(item.href) ? "primary" : "text"}
                  size="md"
                  className="w-full justify-start flex items-center space-x-3"
                >
                  <EmojiIcon category="navigation" name={item.emoji as any} size="sm" />
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