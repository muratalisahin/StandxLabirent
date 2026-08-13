import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Difficulty } from './mazes';

export type GlobalScore = {
  id: string;
  x_username: string;
  score: number;
  difficulty: Difficulty;
  completion_time_seconds: number;
  created_at: string;
};

export type BestScore = {
  best: number | null;
  runs: number | null;
  loading: boolean;
};

type MazeScoreRow = {
  id: string;
  name: string;
  score: number;
  created: string;
  difficulty?: string | null;
  completion_time_seconds?: number | null;
};

function mapRow(row: MazeScoreRow): GlobalScore {
  const difficulty: Difficulty =
    row.difficulty === 'easy' || row.difficulty === 'hard' || row.difficulty === 'medium'
      ? row.difficulty
      : 'medium';
  return {
    id: row.id,
    x_username: row.name,
    score: row.score,
    difficulty,
    completion_time_seconds: row.completion_time_seconds ?? 0,
    created_at: row.created,
  };
}

export function useBestScore(playerId: string | undefined, difficulty?: Difficulty) {
  const [state, setState] = useState<BestScore>({ best: null, runs: null, loading: true });

  useEffect(() => {
    if (!playerId) {
      setState({ best: null, runs: null, loading: false });
      return;
    }

    let active = true;
    setState((current) => ({ ...current, loading: true }));

    (async () => {
      let scoreQuery = supabase
        .from('maze_scores')
        .select('score')
        .ilike('name', playerId)
        .order('score', { ascending: false })
        .limit(1);
      let countQuery = supabase
        .from('maze_scores')
        .select('id', { count: 'exact', head: true })
        .ilike('name', playerId);
      if (difficulty) {
        scoreQuery = scoreQuery.eq('difficulty', difficulty);
        countQuery = countQuery.eq('difficulty', difficulty);
      }

      const { data, error } = await scoreQuery.maybeSingle();
      const { count, error: countError } = await countQuery;

      if (!active) return;
      if (error || countError) {
        setState({ best: null, runs: null, loading: false });
        return;
      }
      setState({ best: data?.score ?? null, runs: count ?? 0, loading: false });
    })();

    return () => {
      active = false;
    };
  }, [difficulty, playerId]);

  return state;
}

export async function getGlobalScores(difficulty?: Difficulty) {
  const full = supabase
    .from('maze_scores')
    .select('id, name, score, created, difficulty, completion_time_seconds')
    .order('score', { ascending: false })
    .order('completion_time_seconds', { ascending: true })
    .limit(10);

  const query = difficulty ? full.eq('difficulty', difficulty) : full;
  const { data, error } = await query;

  if (!error) {
    return ((data ?? []) as MazeScoreRow[]).map(mapRow);
  }

  const fallback = supabase
    .from('maze_scores')
    .select('id, name, score, created')
    .order('score', { ascending: false })
    .order('created', { ascending: true })
    .limit(10);
  const { data: oldData, error: oldError } = await fallback;
  if (oldError) throw oldError;
  return ((oldData ?? []) as MazeScoreRow[]).map(mapRow);
}

export async function saveScore(
  row: {
    score: number;
    doors_opened: number;
    completion_time_seconds: number;
    difficulty: Difficulty;
  },
  _playerId: string,
  username: string,
) {
  const full = await supabase.from('maze_scores').insert({
    name: username,
    score: row.score,
    difficulty: row.difficulty,
    completion_time_seconds: row.completion_time_seconds,
  });
  if (!full.error) return;

  const { error } = await supabase.from('maze_scores').insert({
    name: username,
    score: row.score,
  });
  if (error) throw error;
}
