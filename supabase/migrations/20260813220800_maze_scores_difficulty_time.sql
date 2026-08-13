-- Run this in project veklqzdrxtogmyxjdpib SQL Editor.

ALTER TABLE public.maze_scores
  ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS completion_time_seconds integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS maze_scores_board_idx
  ON public.maze_scores (difficulty, score DESC, completion_time_seconds ASC);
