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

function isDifficulty(value: string | null | undefined): value is Difficulty {
  return value === 'easy' || value === 'medium' || value === 'hard';
}

function parsePackedName(raw: string): { username: string; difficulty?: Difficulty; seconds?: number } {
  const parts = raw.split('~');
  if (parts.length >= 3 && isDifficulty(parts[1])) {
    return { username: parts[0], difficulty: parts[1], seconds: Number(parts[2]) || 0 };
  }
  return { username: raw };
}

function mapRow(row: MazeScoreRow): GlobalScore {
  const packed = parsePackedName(row.name);
  const difficulty: Difficulty = isDifficulty(row.difficulty) ? row.difficulty : packed.difficulty ?? 'medium';
  return {
    id: row.id,
    x_username: packed.username,
    score: row.score,
    difficulty,
    completion_time_seconds: row.completion_time_seconds || packed.seconds || 0,
    created_at: row.created,
  };
}

function packedName(username: string, difficulty: Difficulty, seconds: number) {
  return `${username}~${difficulty}~${seconds}`;
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
      const full = await supabase
        .from('maze_scores')
        .select('name, score, difficulty, completion_time_seconds')
        .order('score', { ascending: false })
        .limit(100);

      const payload = full.error
        ? await supabase.from('maze_scores').select('name, score').order('score', { ascending: false }).limit(100)
        : full;

      if (!active) return;
      if (payload.error) {
        setState({ best: null, runs: null, loading: false });
        return;
      }

      const rows = ((payload.data ?? []) as MazeScoreRow[])
        .map(mapRow)
        .filter((row) => row.x_username.toLowerCase() === playerId.toLowerCase())
        .filter((row) => !difficulty || row.difficulty === difficulty)
        .sort((a, b) => b.score - a.score);
      setState({ best: rows[0]?.score ?? null, runs: rows.length, loading: false });
    })();

    return () => {
      active = false;
    };
  }, [difficulty, playerId]);

  return state;
}

export async function getGlobalScores(difficulty?: Difficulty) {
  const full = await supabase
    .from('maze_scores')
    .select('id, name, score, created, difficulty, completion_time_seconds')
    .order('score', { ascending: false })
    .order('created', { ascending: true })
    .limit(40);

  const rows = full.error
    ? await (async () => {
        const fallback = await supabase
          .from('maze_scores')
          .select('id, name, score, created')
          .order('score', { ascending: false })
          .order('created', { ascending: true })
          .limit(40);
        if (fallback.error) throw fallback.error;
        return (fallback.data ?? []) as MazeScoreRow[];
      })()
    : ((full.data ?? []) as MazeScoreRow[]);

  return rows
    .map(mapRow)
    .filter((row) => !difficulty || row.difficulty === difficulty)
    .sort((a, b) => b.score - a.score || a.completion_time_seconds - b.completion_time_seconds)
    .slice(0, 10);
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
    name: packedName(username, row.difficulty, row.completion_time_seconds),
    score: row.score,
  });
  if (error) throw error;
}
