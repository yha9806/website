import { useState, useEffect } from 'react';
import battlesService, { BattleResponse, VoteResponse } from '../services/battles.service';

export function useBattles(status?: 'active' | 'completed') {
  const [battles, setBattles] = useState<BattleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchBattles = async () => {
      try {
        setLoading(true);
        const response = await battlesService.getBattles(status);
        setBattles(response.battles);
        setTotal(response.total);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch battles:', err);
        setError('Failed to load battles');
        // Fallback to mock data if needed
        setBattles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBattles();
  }, [status]);

  return { battles, loading, error, total };
}

export function useRandomBattle() {
  const [battle, setBattle] = useState<BattleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRandomBattle = async () => {
    try {
      setLoading(true);
      const response = await battlesService.getRandomBattle();
      setBattle(response);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch random battle:', err);
      setError('Failed to load battle');
      setBattle(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRandomBattle();
  }, []);

  return { battle, loading, error, refetch: fetchRandomBattle };
}

export function useBattleVote() {
  const [voting, setVoting] = useState(false);
  const [voteResult, setVoteResult] = useState<VoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const vote = async (battleId: string, voteFor: 'model_a' | 'model_b') => {
    try {
      setVoting(true);
      setError(null);
      const result = await battlesService.voteForBattle(battleId, voteFor);
      setVoteResult(result);
      return result;
    } catch (err) {
      console.error('Failed to vote:', err);
      setError('Failed to submit vote');
      throw err;
    } finally {
      setVoting(false);
    }
  };

  return { vote, voting, voteResult, error };
}