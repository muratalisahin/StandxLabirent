/*
# Create Labyrinth scores

1. New Tables
- `labyrinth_scores`
- `id` (uuid, primary key)
- `user_id` (uuid, required owner linked to auth.users)
- `score` (integer, completed-run score)
- `doors_opened` (integer, number of correct doors opened)
- `completion_time_seconds` (integer, elapsed time for a completed run)
- `created_at` (timestamptz, submission time)

2. Security
- Row level security is enabled.
- Signed-in players can read their own scores and add, update, or remove only their own score records.

3. Notes
- The user owner defaults from the active authenticated session.
- Scores are kept as a history so the game can show a personal best without exposing other players' private activity.
*/

CREATE TABLE IF NOT EXISTS public.labyrinth_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0),
  doors_opened integer NOT NULL DEFAULT 0 CHECK (doors_opened >= 0 AND doors_opened <= 5),
  completion_time_seconds integer NOT NULL DEFAULT 0 CHECK (completion_time_seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.labyrinth_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players can read own scores" ON public.labyrinth_scores;
CREATE POLICY "Players can read own scores"
  ON public.labyrinth_scores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Players can add own scores" ON public.labyrinth_scores;
CREATE POLICY "Players can add own scores"
  ON public.labyrinth_scores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Players can update own scores" ON public.labyrinth_scores;
CREATE POLICY "Players can update own scores"
  ON public.labyrinth_scores FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Players can delete own scores" ON public.labyrinth_scores;
CREATE POLICY "Players can delete own scores"
  ON public.labyrinth_scores FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS labyrinth_scores_user_score_idx
  ON public.labyrinth_scores (user_id, score DESC, completion_time_seconds ASC);