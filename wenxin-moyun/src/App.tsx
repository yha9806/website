import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/common/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import { cacheUtils } from './services/api';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ModelDetailPage from './pages/ModelDetailPage';
import BattlePage from './pages/BattlePage';
import AboutPage from './pages/AboutPage';
import ComparePage from './pages/ComparePage';
import DashboardPage from './pages/DashboardPage';
import EvaluationsPage from './pages/EvaluationsPage';
import EvaluationDetailPage from './pages/EvaluationDetailPage';
import GalleryPage from './pages/GalleryPage';
import LoginPage from './pages/LoginPage';
import TestIOSComponents from './pages/TestIOSComponents';
import TestAdvancedIOSComponents from './pages/TestAdvancedIOSComponents';

function App() {
  // Initialize cache warming on app start
  useEffect(() => {
    // Warm up cache after a short delay to not block initial render
    const timer = setTimeout(() => {
      cacheUtils.warmUp();
    }, 2000);
    
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
        
        {/* Other pages with Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/leaderboard/:category" element={<LeaderboardPage />} />
          <Route path="/model/:id" element={<ModelDetailPage />} />
          <Route path="/battle" element={<BattlePage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/evaluations" element={<EvaluationsPage />} />
          <Route path="/evaluations/:id" element={<EvaluationDetailPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/test-ios" element={<TestIOSComponents />} />
          <Route path="/test-ios-advanced" element={<TestAdvancedIOSComponents />} />
        </Route>
        </Routes>
      </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;