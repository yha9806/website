import { useState, useEffect, useCallback } from 'react';
import battlesService from '../services/battles.service';
import type { BattleResponse, VoteResponse } from '../services/battles.service';
import type { Battle } from '../types/types';

// Convert BattleResponse to Battle type for frontend compatibility
function convertToBattle(response: BattleResponse): Battle {
  return {
    id: response.id,
    modelA: response.model_a,
    modelB: response.model_b,
    task: {
      id: response.id,
      type: response.task_type as 'poem' | 'painting' | 'story',
      prompt: response.task_prompt,
      category: response.task_category,
      difficulty: response.difficulty as 'easy' | 'medium' | 'hard'
    },
    votesA: response.votes_a,
    votesB: response.votes_b,
    status: response.status as 'active' | 'completed',
    createdAt: response.created_at,
    completedAt: response.completed_at
  };
}

export function useBattles(status?: 'active' | 'completed') {
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchBattles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await battlesService.getBattles(status);
      const convertedBattles = response.battles.map(convertToBattle);
      setBattles(convertedBattles);
      setTotal(response.total);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch battles:', err);
      setError('Failed to load battles');
      setBattles([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  const getRandomBattle = useCallback(async (): Promise<Battle | null> => {
    try {
      const response = await battlesService.getRandomBattle();
      return convertToBattle(response);
    } catch (err) {
      console.error('Failed to fetch random battle:', err);
      return null;
    }
  }, []);

  const voteBattle = useCallback(async (battleId: string, voteChoice: 'model_a' | 'model_b'): Promise<VoteResponse> => {
    try {
      const result = await battlesService.voteForBattle(battleId, voteChoice);
      // Update local state if needed
      setBattles(prevBattles => 
        prevBattles.map(battle => {
          if (battle.id === battleId) {
            return {
              ...battle,
              votesA: result.votes_a,
              votesB: result.votes_b
            };
          }
          return battle;
        })
      );
      return result;
    } catch (err) {
      console.error('Failed to vote:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchBattles();
  }, [fetchBattles]);

  return { battles, loading, error, total, voteBattle, getRandomBattle };
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