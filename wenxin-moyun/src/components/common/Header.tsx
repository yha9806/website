import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Trophy, Swords, Info, Home, BarChart3, GitCompare, FlaskConical } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: '首页', href: '/', icon: Home },
    { name: '排行榜', href: '/leaderboard', icon: Trophy },
    { name: '模型对决', href: '/battle', icon: Swords },
    { name: '模型对比', href: '/compare', icon: GitCompare },
    { name: '评测任务', href: '/evaluations', icon: FlaskConical },
    { name: '数据看板', href: '/dashboard', icon: BarChart3 },
    { name: '关于', href: '/about', icon: Info },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || 
           (path === '/leaderboard' && location.pathname.startsWith('/leaderboard'));
  };

  return (
    <header className="bg-neutral-50 dark:bg-[#161B22] border-b border-gray-200 dark:border-[#30363D] sticky top-0 z-50 shadow-sm dark:shadow-none transition-colors duration-200">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-4 group">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-400 to-indigo-600 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500" />
              <div className="relative w-14 h-14 bg-gradient-to-br from-rose-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-all duration-300">
                <span className="text-white font-bold text-2xl" style={{ fontFamily: 'serif' }}>文</span>
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent" style={{ fontFamily: 'serif' }}>
                文心墨韵
              </h1>
              <p className="text-xs text-slate-600">AI 艺术创作评测平台</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive(item.href)
                      ? 'bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-800/20 text-primary-600 dark:text-primary-300 shadow-md'
                      : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:shadow-sm'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Theme Toggle */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`
                    flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive(item.href)
                      ? 'bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-800/20 text-primary-600 dark:text-primary-300 shadow-md'
                      : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:shadow-sm'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            
            {/* Mobile Theme Toggle */}
            <div className="px-4 py-2">
              <ThemeToggle />
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}