import { useState, useEffect } from 'react';
import modelsService from '../services/models.service';
import type { LeaderboardEntry } from '../types/types';

export const useLeaderboard = (category?: string) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from API
        try {
          const apiModels = await modelsService.getModels({ 
            category,
            is_active: true,
            include_vulca: true // 请求包含VULCA数据
          });
          
          console.log("useLeaderboard: API returned", apiModels.length, "models");
          if (apiModels && apiModels.length > 0) {
            // Convert to leaderboard entries
            const leaderboardData = apiModels
              .sort((a, b) => {
                // Handle NULL scores - put them at the end
                if (a.overall_score == null && b.overall_score == null) return 0;
                if (a.overall_score == null) return 1;
                if (b.overall_score == null) return -1;
                return b.overall_score - a.overall_score;
              })
              .map((model, index) => ({
                rank: index + 1,
                model: modelsService.convertToFrontendModel(model as any),
                score: model.overall_score,
                change: 0, // API doesn't track changes yet
                battles: 0, // To be implemented
                winRate: 50 + Math.random() * 30 // Placeholder
              }));
            setEntries(leaderboardData);
          } else {
            // Fallback to mock data
            const { mockLeaderboard } = await import('../data/mockData');
            const filtered = category 
              ? mockLeaderboard.filter(e => e.model.category === category)
              : mockLeaderboard;
            setEntries(filtered);
          }
        } catch (apiError) {
          // Fallback to mock data if API fails
          console.log('API unavailable, using mock data');
          const { mockLeaderboard } = await import('../data/mockData');
          const filtered = category 
            ? mockLeaderboard.filter(e => e.model.category === category)
            : mockLeaderboard;
          setEntries(filtered);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [category]);

  return { entries, loading, error };
};