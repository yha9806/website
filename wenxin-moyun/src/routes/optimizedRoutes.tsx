import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/common/Layout';
import { perfMonitor } from '../utils/performanceOptimizer';

// 加载中组件
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="inline-flex items-center space-x-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
        <span className="text-gray-600">Loading...</span>
      </div>
    </div>
  </div>
);

// 懒加载页面组件
const HomePage = lazy(() => {
  perfMonitor.mark('HomePage-start');
  return import('../pages/HomePage').then(module => {
    perfMonitor.measure('HomePage-load', 'HomePage-start');
    return module;
  });
});

const LeaderboardPage = lazy(() => {
  perfMonitor.mark('LeaderboardPage-start');
  return import('../pages/LeaderboardPage').then(module => {
    perfMonitor.measure('LeaderboardPage-load', 'LeaderboardPage-start');
    return module;
  });
});

const ModelDetailPage = lazy(() => {
  perfMonitor.mark('ModelDetailPage-start');
  return import('../pages/ModelDetailPage').then(module => {
    perfMonitor.measure('ModelDetailPage-load', 'ModelDetailPage-start');
    return module;
  });
});

const EvaluationsPage = lazy(() => {
  perfMonitor.mark('EvaluationsPage-start');
  return import('../pages/EvaluationsPage').then(module => {
    perfMonitor.measure('EvaluationsPage-load', 'EvaluationsPage-start');
    return module;
  });
});

const EvaluationDetailPage = lazy(() => {
  perfMonitor.mark('EvaluationDetailPage-start');
  return import('../pages/EvaluationDetailPage').then(module => {
    perfMonitor.measure('EvaluationDetailPage-load', 'EvaluationDetailPage-start');
    return module;
  });
});

const LoginPage = lazy(() => {
  perfMonitor.mark('LoginPage-start');
  return import('../pages/LoginPage').then(module => {
    perfMonitor.measure('LoginPage-load', 'LoginPage-start');
    return module;
  });
});

// 优化的路由配置
export function OptimizedRoutes() {
  return (
    <Routes>
      {/* 登录页面（无布局） */}
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        }
      />

      {/* 带布局的页面 */}
      <Route element={<Layout />}>
        <Route
          path="/"
          element={
            <Suspense fallback={<PageLoader />}>
              <HomePage />
            </Suspense>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <Suspense fallback={<PageLoader />}>
              <LeaderboardPage />
            </Suspense>
          }
        />
        <Route
          path="/leaderboard/:category"
          element={
            <Suspense fallback={<PageLoader />}>
              <LeaderboardPage />
            </Suspense>
          }
        />
        <Route
          path="/model/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <ModelDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/evaluations"
          element={
            <Suspense fallback={<PageLoader />}>
              <EvaluationsPage />
            </Suspense>
          }
        />
        <Route
          path="/evaluations/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <EvaluationDetailPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}
