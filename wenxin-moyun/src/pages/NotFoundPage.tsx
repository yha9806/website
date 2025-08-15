import { Link } from 'react-router-dom';
import { IOSButton } from '../components/ios';
import { EmojiIcon } from '../components/ios';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="space-y-6">
        {/* 404 Icon */}
        <div className="flex justify-center">
          <EmojiIcon category="status" name="error" size="2xl" />
        </div>
        
        {/* 404 Title */}
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">
          404
        </h1>
        
        {/* Error Message */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/">
            <IOSButton variant="primary" size="lg">
              <EmojiIcon category="navigation" name="home" size="sm" />
              Go Home
            </IOSButton>
          </Link>
          
          <Link to="/leaderboard">
            <IOSButton variant="secondary" size="lg">
              <EmojiIcon category="content" name="ranking" size="sm" />
              View Rankings
            </IOSButton>
          </Link>
        </div>
        
        {/* Additional Help */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            You can also try:
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link 
              to="/battle" 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Model Battle
            </Link>
            <Link 
              to="/evaluations" 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Evaluations
            </Link>
            <Link 
              to="/gallery" 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Gallery
            </Link>
            <Link 
              to="/about" 
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              About
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}