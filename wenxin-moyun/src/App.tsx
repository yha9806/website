import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/common/Layout';
import ErrorBoundary from './components/common/ErrorBoundary';
import { cacheUtils } from './services/api';
import { useEffect, Suspense, lazy } from 'react';

// Core pages - eagerly loaded
import HomePage from './pages/HomePage';
import ModelsPage from './pages/LeaderboardPage';
import ModelDetailPage from './pages/ModelDetailPage';
import EvaluationsPage from './pages/EvaluationsPage';
import EvaluationDetailPage from './pages/EvaluationDetailPage';
import GalleryPage from './pages/GalleryPage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

// Marketing pages - lazy loaded (Scale.com style)
const ProductPage = lazy(() => import('./pages/ProductPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const TrustPage = lazy(() => import('./pages/TrustPage'));
const BookDemoPage = lazy(() => import('./pages/BookDemoPage'));
const DemoConfirmationPage = lazy(() => import('./pages/DemoConfirmationPage'));
const PilotPage = lazy(() => import('./pages/PilotPage'));
const ChangelogPage = lazy(() => import('./pages/ChangelogPage'));

// Solutions pages - lazy loaded
const SolutionsPage = lazy(() => import('./pages/solutions/SolutionsPage'));
const AILabSolutionPage = lazy(() => import('./pages/solutions/AILabSolutionPage'));
const ResearchSolutionPage = lazy(() => import('./pages/solutions/ResearchSolutionPage'));
const MuseumSolutionPage = lazy(() => import('./pages/solutions/MuseumSolutionPage'));

// VULCA and Exhibitions - lazy loaded
const VULCADemoPage = lazy(() => import('./pages/vulca/VULCADemoPage'));
const ExhibitionsPage = lazy(() => import('./pages/exhibitions/ExhibitionsPage'));
const ExhibitionDetailPage = lazy(() => import('./pages/exhibitions/ExhibitionDetailPage'));
const ArtworkPage = lazy(() => import('./pages/exhibitions/ArtworkPage'));

// Academic/Research pages - lazy loaded
const MethodologyPage = lazy(() => import('./pages/MethodologyPage'));
const DatasetPage = lazy(() => import('./pages/DatasetPage'));
const PapersPage = lazy(() => import('./pages/PapersPage'));

// Trust & Ethics pages - lazy loaded
const DataEthicsPage = lazy(() => import('./pages/DataEthicsPage'));
const SOPPage = lazy(() => import('./pages/SOPPage'));

// Legal pages - lazy loaded
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));

// Report page - lazy loaded
const ModelReportPage = lazy(() => import('./pages/ModelReportPage'));

// Comparison page - lazy loaded
const CompareModelsPage = lazy(() => import('./pages/CompareModelsPage'));

// Reusable loading component
function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">{text}</p>
      </div>
    </div>
  );
}

function App() {
  // Initialize cache warming on app start with version check
  useEffect(() => {
    const versionUpdated = cacheUtils.checkVersion();

    const timer = setTimeout(() => {
      if (versionUpdated) {
        console.log('App: Version updated, warming cache with fresh data');
      }
      cacheUtils.warmUp();
    }, versionUpdated ? 500 : 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error('App Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    if (process.env.NODE_ENV === 'production') {
      // Error reporting would go here
    }
  };

  return (
    <ErrorBoundary onError={handleError}>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Login page without Layout */}
            <Route path="/login" element={<LoginPage />} />

            {/* All other pages with Layout */}
            <Route element={<Layout />}>
              {/* Marketing pages (Scale.com style) */}
              <Route path="/" element={<HomePage />} />
              <Route path="/product" element={
                <Suspense fallback={<PageLoader text="Loading Product..." />}>
                  <ProductPage />
                </Suspense>
              } />
              <Route path="/pricing" element={
                <Suspense fallback={<PageLoader text="Loading Pricing..." />}>
                  <PricingPage />
                </Suspense>
              } />
              <Route path="/customers" element={
                <Suspense fallback={<PageLoader text="Loading Customers..." />}>
                  <CustomersPage />
                </Suspense>
              } />
              <Route path="/trust" element={
                <Suspense fallback={<PageLoader text="Loading Trust & Security..." />}>
                  <TrustPage />
                </Suspense>
              } />
              <Route path="/demo" element={
                <Suspense fallback={<PageLoader text="Loading Demo Scheduler..." />}>
                  <BookDemoPage />
                </Suspense>
              } />
              <Route path="/demo/confirmation" element={
                <Suspense fallback={<PageLoader text="Loading..." />}>
                  <DemoConfirmationPage />
                </Suspense>
              } />
              <Route path="/pilot" element={
                <Suspense fallback={<PageLoader text="Loading Pilot..." />}>
                  <PilotPage />
                </Suspense>
              } />
              <Route path="/changelog" element={
                <Suspense fallback={<PageLoader text="Loading Changelog..." />}>
                  <ChangelogPage />
                </Suspense>
              } />

              {/* Solutions pages */}
              <Route path="/solutions" element={
                <Suspense fallback={<PageLoader text="Loading Solutions..." />}>
                  <SolutionsPage />
                </Suspense>
              } />
              <Route path="/solutions/ai-labs" element={
                <Suspense fallback={<PageLoader text="Loading AI Labs Solution..." />}>
                  <AILabSolutionPage />
                </Suspense>
              } />
              <Route path="/solutions/research" element={
                <Suspense fallback={<PageLoader text="Loading Research Solution..." />}>
                  <ResearchSolutionPage />
                </Suspense>
              } />
              <Route path="/solutions/museums" element={
                <Suspense fallback={<PageLoader text="Loading Museums Solution..." />}>
                  <MuseumSolutionPage />
                </Suspense>
              } />

              {/* Public Demo / Models */}
              <Route path="/models" element={<ModelsPage />} />
              <Route path="/models/:category" element={<ModelsPage />} />
              {/* Legacy route redirects */}
              <Route path="/leaderboard" element={<ModelsPage />} />
              <Route path="/leaderboard/:category" element={<ModelsPage />} />
              <Route path="/model/:id" element={<ModelDetailPage />} />
              <Route path="/model/:id/report" element={
                <Suspense fallback={<PageLoader text="Loading Report..." />}>
                  <ModelReportPage />
                </Suspense>
              } />

              {/* Model Comparison - SEO-friendly URLs */}
              <Route path="/compare/:comparison" element={
                <Suspense fallback={<PageLoader text="Loading Comparison..." />}>
                  <CompareModelsPage />
                </Suspense>
              } />

              {/* VULCA Demo */}
              <Route path="/vulca" element={
                <Suspense fallback={<PageLoader text="Loading VULCA Demo..." />}>
                  <VULCADemoPage />
                </Suspense>
              } />

              {/* Exhibition Routes */}
              <Route path="/exhibitions" element={
                <Suspense fallback={<PageLoader text="Loading Exhibitions..." />}>
                  <ExhibitionsPage />
                </Suspense>
              } />
              <Route path="/exhibitions/:id" element={
                <Suspense fallback={<PageLoader text="Loading Exhibition..." />}>
                  <ExhibitionDetailPage />
                </Suspense>
              } />
              <Route path="/exhibitions/:id/:artworkId" element={
                <Suspense fallback={<PageLoader text="Loading Artwork..." />}>
                  <ArtworkPage />
                </Suspense>
              } />

              {/* Academic/Research Routes */}
              <Route path="/methodology" element={
                <Suspense fallback={<PageLoader text="Loading Methodology..." />}>
                  <MethodologyPage />
                </Suspense>
              } />
              <Route path="/dataset" element={
                <Suspense fallback={<PageLoader text="Loading Dataset..." />}>
                  <DatasetPage />
                </Suspense>
              } />
              <Route path="/papers" element={
                <Suspense fallback={<PageLoader text="Loading Papers..." />}>
                  <PapersPage />
                </Suspense>
              } />

              {/* Trust & Ethics Routes */}
              <Route path="/data-ethics" element={
                <Suspense fallback={<PageLoader text="Loading Data & Ethics..." />}>
                  <DataEthicsPage />
                </Suspense>
              } />
              <Route path="/sop" element={
                <Suspense fallback={<PageLoader text="Loading SOP..." />}>
                  <SOPPage />
                </Suspense>
              } />

              {/* Legal Pages */}
              <Route path="/privacy" element={
                <Suspense fallback={<PageLoader text="Loading Privacy Policy..." />}>
                  <PrivacyPage />
                </Suspense>
              } />
              <Route path="/terms" element={
                <Suspense fallback={<PageLoader text="Loading Terms of Service..." />}>
                  <TermsPage />
                </Suspense>
              } />

              {/* User Evaluations */}
              <Route path="/evaluations" element={<EvaluationsPage />} />
              <Route path="/evaluations/:id" element={<EvaluationDetailPage />} />
              <Route path="/gallery" element={<GalleryPage />} />

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
