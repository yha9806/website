import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/common/Layout';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ModelDetailPage from './pages/ModelDetailPage';
import BattlePage from './pages/BattlePage';
import AboutPage from './pages/AboutPage';
import ComparePage from './pages/ComparePage';
import DashboardPage from './pages/DashboardPage';
import EvaluationsPage from './pages/EvaluationsPage';
import EvaluationDetailPage from './pages/EvaluationDetailPage';
import LoginPage from './pages/LoginPage';

function App() {
  return (
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
          <Route path="/about" element={<AboutPage />} />
        </Route>
      </Routes>
    </Router>
    </ThemeProvider>
  );
}

export default App;