import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export type GlobalScore = {
  id: string;
  x_username: string;
  score: number;
  doors_opened: number;
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
};

export function useBestScore(playerId: string | undefined) {
  const [state, setState] = useState<BestScore>({ best: null, runs: null, loading: true });

  useEffect(() => {
    if (!playerId) {
      setState({ best: null, runs: null, loading: false });
      return;
    }

    let active = true;
    setState((current) => ({ ...current, loading: true }));

    (async () => {
      const { data, error } = await supabase
        .from('maze_scores')
        .select('score')
        .ilike('name', playerId)
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle();
      const { count, error: countError } = await supabase
        .from('maze_scores')
        .select('id', { count: 'exact', head: true })
        .ilike('name', playerId);

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
  }, [playerId]);

  return state;
}

export async function getGlobalScores() {
  const { data, error } = await supabase
    .from('maze_scores')
    .select('id, name, score, created')
    .order('score', { ascending: false })
    .order('created', { ascending: true })
    .limit(10);

  if (error) throw error;
  return ((data ?? []) as MazeScoreRow[]).map((row) => ({
    id: row.id,
    x_username: row.name,
    score: row.score,
    doors_opened: 5,
    completion_time_seconds: 0,
    created_at: row.created,
  }));
}

export async function saveScore(
  row: { score: number; doors_opened: number; completion_time_seconds: number },
  _playerId: string,
  username: string,
) {
  const { error } = await supabase.from('maze_scores').insert({
    name: username,
    score: row.score,
  });
  if (error) throw error;
}
