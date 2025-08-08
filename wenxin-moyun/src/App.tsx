import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import HomePage from './pages/HomePage';
import LeaderboardPage from './pages/LeaderboardPage';
import ModelDetailPage from './pages/ModelDetailPage';
import BattlePage from './pages/BattlePage';
import AboutPage from './pages/AboutPage';
import ComparePage from './pages/ComparePage';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/leaderboard/:category" element={<LeaderboardPage />} />
          <Route path="/model/:id" element={<ModelDetailPage />} />
          <Route path="/battle" element={<BattlePage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;