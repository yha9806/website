import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/common/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import { cacheUtils } from './services/api';
import { useEffect, Suspense, lazy } from 'react';
import HomePage from './pages/HomePage';
import ModelsPage from './pages/LeaderboardPage';  // Renamed: Rankings -> Models
import ModelDetailPage from './pages/ModelDetailPage';
import EvaluationsPage from './pages/EvaluationsPage';
import EvaluationDetailPage from './pages/EvaluationDetailPage';
import GalleryPage from './pages/GalleryPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

// Lazy load pages to improve initial load time
const VULCADemoPage = lazy(() => import('./pages/vulca/VULCADemoPage'));
const ExhibitionsPage = lazy(() => import('./pages/exhibitions/ExhibitionsPage'));
const ExhibitionDetailPage = lazy(() => import('./pages/exhibitions/ExhibitionDetailPage'));
const ArtworkPage = lazy(() => import('./pages/exhibitions/ArtworkPage'));

// Academic/Research pages - lazy loaded
const MethodologyPage = lazy(() => import('./pages/MethodologyPage'));
const DatasetPage = lazy(() => import('./pages/DatasetPage'));
const PapersPage = lazy(() => import('./pages/PapersPage'));

function App() {
  // Initialize cache warming on app start with version check
  useEffect(() => {
    // Immediate version check to clear outdated cache
    const versionUpdated = cacheUtils.checkVersion();
    
    // Warm up cache after a short delay to not block initial render
    const timer = setTimeout(() => {
      if (versionUpdated) {
        console.log('App: Version updated, warming cache with fresh data');
      }
      cacheUtils.warmUp();
    }, versionUpdated ? 500 : 2000); // Shorter delay if version was updated
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error for debugging and reporting
    console.error('App Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
    
    // In production, you could send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.captureException(error, { extra: errorInfo });
    }
  };

  return (
    <ErrorBoundary onError={handleError}>
      <ThemeProvider>
        <Router>
        <Routes>
        {/* Login page without Layout */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Core pages with Layout - Simplified navigation */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          {/* Models (formerly Rankings/Leaderboard) */}
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/models/:category" element={<ModelsPage />} />
          {/* Legacy route redirect */}
          <Route path="/leaderboard" element={<ModelsPage />} />
          <Route path="/leaderboard/:category" element={<ModelsPage />} />
          <Route path="/model/:id" element={<ModelDetailPage />} />
          {/* Evaluations */}
          <Route path="/evaluations" element={<EvaluationsPage />} />
          <Route path="/evaluations/:id" element={<EvaluationDetailPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/vulca" element={
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-blue mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading VULCA Demo...</p>
              </div>
            </div>}>
              <VULCADemoPage />
            </Suspense>
          } />
          {/* Exhibition Routes */}
          <Route path="/exhibitions" element={
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-blue mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading Exhibitions...</p>
              </div>
            </div>}>
              <ExhibitionsPage />
            </Suspense>
          } />
          <Route path="/exhibitions/:id" element={
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-blue mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading Exhibition...</p>
              </div>
            </div>}>
              <ExhibitionDetailPage />
            </Suspense>
          } />
          <Route path="/exhibitions/:id/:artworkId" element={
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-blue mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading Artwork...</p>
              </div>
            </div>}>
              <ArtworkPage />
            </Suspense>
          } />
          {/* Academic/Research Routes */}
          <Route path="/methodology" element={
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-blue mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading Methodology...</p>
              </div>
            </div>}>
              <MethodologyPage />
            </Suspense>
          } />
          <Route path="/dataset" element={
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-blue mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading Dataset...</p>
              </div>
            </div>}>
              <DatasetPage />
            </Suspense>
          } />
          <Route path="/papers" element={
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-blue mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading Papers...</p>
              </div>
            </div>}>
              <PapersPage />
            </Suspense>
          } />
          {/* 404 catch-all route */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        </Routes>
      </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;