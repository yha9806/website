import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Calendar, FileText, Database, FlaskConical, Trophy, Image, Building2, GraduationCap, Palette } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { IOSButton } from '../ios';
import { HeaderControls } from './ThemeToggle';
import VulcaLogo from './VulcaLogo';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const resourcesRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
        setIsResourcesOpen(false);
      }
      if (solutionsRef.current && !solutionsRef.current.contains(event.target as Node)) {
        setIsSolutionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Main navigation items (Scale.com style)
  const mainNav = [
    { name: 'Product', href: '/product' },
  ];

  // Solutions dropdown
  const solutionsItems = [
    { name: 'AI Labs', href: '/solutions/ai-labs', icon: Building2, desc: 'Model selection & release' },
    { name: 'Research', href: '/solutions/research', icon: GraduationCap, desc: 'Academic benchmarking' },
    { name: 'Museums', href: '/solutions/museums', icon: Palette, desc: 'Cultural AI curation' },
  ];

  // Resources dropdown items
  const resourcesItems = [
    { name: 'Methodology', href: '/methodology', icon: FlaskConical },
    { name: 'Dataset', href: '/dataset', icon: Database },
    { name: 'Papers', href: '/papers', icon: FileText },
  ];

  // Demo links (public demo library)
  const demoLinks = [
    { name: 'Models', href: '/models', icon: Trophy },
    { name: 'VULCA Demo', href: '/vulca', icon: FlaskConical },
    { name: 'Exhibitions', href: '/exhibitions', icon: Image },
  ];

  const isActive = (path: string) => {
    return location.pathname === path ||
           (path === '/models' && location.pathname.startsWith('/model')) ||
           (path === '/exhibitions' && location.pathname.startsWith('/exhibitions')) ||
           (path === '/solutions' && location.pathname.startsWith('/solutions'));
  };

  return (
    <header className="ios-glass border-b border-gray-200/20 dark:border-gray-700/20 sticky top-0 z-50 backdrop-blur-xl">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="group">
            <VulcaLogo size="lg" showSubtitle={false} variant="header" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {/* Product */}
            {mainNav.map((item) => (
              <Link key={item.name} to={item.href}>
                <IOSButton
                  variant={isActive(item.href) ? "primary" : "text"}
                  size="sm"
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  {item.name}
                </IOSButton>
              </Link>
            ))}

            {/* Solutions Dropdown */}
            <div className="relative" ref={solutionsRef}>
              <IOSButton
                variant={isSolutionsOpen || isActive('/solutions') ? "primary" : "text"}
                size="sm"
                onClick={() => setIsSolutionsOpen(!isSolutionsOpen)}
                className="flex items-center gap-1"
                aria-haspopup="menu"
                aria-expanded={isSolutionsOpen}
                aria-controls="solutions-dropdown-menu"
              >
                Solutions
                <ChevronDown className={`w-4 h-4 transition-transform ${isSolutionsOpen ? 'rotate-180' : ''}`} />
              </IOSButton>

              {isSolutionsOpen && (
                <div
                  id="solutions-dropdown-menu"
                  role="menu"
                  className="absolute top-full left-0 mt-2 w-64 ios-glass rounded-xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg py-2 z-50"
                >
                  <Link
                    to="/solutions"
                    onClick={() => setIsSolutionsOpen(false)}
                    className="block px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                  >
                    All Solutions
                  </Link>
                  <div className="border-t border-gray-200/20 dark:border-gray-700/20 my-1" />
                  {solutionsItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsSolutionsOpen(false)}
                      className="flex items-start gap-3 px-4 py-2 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                    >
                      <item.icon className="w-5 h-5 text-bronze-500 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">{item.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Customers */}
            <Link to="/customers">
              <IOSButton
                variant={isActive('/customers') ? "primary" : "text"}
                size="sm"
              >
                Customers
              </IOSButton>
            </Link>

            {/* Pricing */}
            <Link to="/pricing">
              <IOSButton
                variant={isActive('/pricing') ? "primary" : "text"}
                size="sm"
              >
                Pricing
              </IOSButton>
            </Link>

            {/* Resources Dropdown */}
            <div className="relative" ref={resourcesRef}>
              <IOSButton
                variant={isResourcesOpen ? "primary" : "text"}
                size="sm"
                onClick={() => setIsResourcesOpen(!isResourcesOpen)}
                className="flex items-center gap-1"
                aria-haspopup="menu"
                aria-expanded={isResourcesOpen}
                aria-controls="resources-dropdown-menu"
              >
                Resources
                <ChevronDown className={`w-4 h-4 transition-transform ${isResourcesOpen ? 'rotate-180' : ''}`} />
              </IOSButton>

              {isResourcesOpen && (
                <div
                  id="resources-dropdown-menu"
                  role="menu"
                  className="absolute top-full left-0 mt-2 w-56 ios-glass rounded-xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg py-2 z-50"
                >
                  <div className="px-4 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Documentation
                  </div>
                  {resourcesItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsResourcesOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                    >
                      <item.icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                    </Link>
                  ))}
                  <div className="border-t border-gray-200/20 dark:border-gray-700/20 my-2" />
                  <div className="px-4 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Public Demo
                  </div>
                  {demoLinks.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsResourcesOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                    >
                      <item.icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

            {/* Theme Toggle */}
            <HeaderControls />

            {/* Book a Demo CTA */}
            <Link to="/demo">
              <IOSButton
                variant="primary"
                size="sm"
                className="ml-2 flex items-center gap-1.5"
                data-testid="book-demo-cta"
              >
                <Calendar className="w-4 h-4" />
                Book a Demo
              </IOSButton>
            </Link>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center space-x-2 lg:hidden">
            <HeaderControls />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-colors duration-200"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 space-y-2 ios-glass rounded-xl mt-2 mb-4 border border-gray-200/20 dark:border-gray-700/20">
            {/* Book a Demo - Prominent on mobile */}
            <div className="px-3 pb-3 border-b border-gray-200/20 dark:border-gray-700/20">
              <Link to="/demo" onClick={() => setIsMenuOpen(false)}>
                <IOSButton variant="primary" size="md" className="w-full flex items-center justify-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Book a Demo
                </IOSButton>
              </Link>
            </div>

            {/* Main nav items */}
            <div className="px-3 space-y-1">
              <Link to="/product" onClick={() => setIsMenuOpen(false)}>
                <IOSButton variant={isActive('/product') ? "primary" : "text"} size="md" className="w-full justify-start">
                  Product
                </IOSButton>
              </Link>

              {/* Solutions section */}
              <div className="pl-0">
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider px-3 py-2">
                  Solutions
                </div>
                <Link to="/solutions" onClick={() => setIsMenuOpen(false)}>
                  <IOSButton variant={isActive('/solutions') ? "primary" : "text"} size="sm" className="w-full justify-start">
                    All Solutions
                  </IOSButton>
                </Link>
                {solutionsItems.map((item) => (
                  <Link key={item.name} to={item.href} onClick={() => setIsMenuOpen(false)}>
                    <IOSButton variant="text" size="sm" className="w-full justify-start flex items-center gap-2">
                      <item.icon className="w-4 h-4 text-gray-500" />
                      {item.name}
                    </IOSButton>
                  </Link>
                ))}
              </div>

              <Link to="/customers" onClick={() => setIsMenuOpen(false)}>
                <IOSButton variant={isActive('/customers') ? "primary" : "text"} size="md" className="w-full justify-start">
                  Customers
                </IOSButton>
              </Link>

              <Link to="/pricing" onClick={() => setIsMenuOpen(false)}>
                <IOSButton variant={isActive('/pricing') ? "primary" : "text"} size="md" className="w-full justify-start">
                  Pricing
                </IOSButton>
              </Link>
            </div>

            {/* Resources section */}
            <div className="border-t border-gray-200/20 dark:border-gray-700/20 pt-2 px-3">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider px-3 py-2">
                Resources
              </div>
              {resourcesItems.map((item) => (
                <Link key={item.name} to={item.href} onClick={() => setIsMenuOpen(false)}>
                  <IOSButton variant="text" size="sm" className="w-full justify-start flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-gray-500" />
                    {item.name}
                  </IOSButton>
                </Link>
              ))}
            </div>

            {/* Demo section */}
            <div className="border-t border-gray-200/20 dark:border-gray-700/20 pt-2 px-3">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider px-3 py-2">
                Public Demo
              </div>
              {demoLinks.map((item) => (
                <Link key={item.name} to={item.href} onClick={() => setIsMenuOpen(false)}>
                  <IOSButton variant="text" size="sm" className="w-full justify-start flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-gray-500" />
                    {item.name}
                  </IOSButton>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
