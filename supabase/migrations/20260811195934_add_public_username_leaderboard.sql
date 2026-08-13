/*
# Add username-only identity and global leaderboard

1. New Tables
- `labyrinth_players`
- `id` (uuid, public player identifier)
- `x_username` (text, canonical display handle, unique)
- `created_at` (timestamptz)
- `public_labyrinth_scores`
- `id` (uuid, score identifier)
- `player_id` (uuid, player reference)
- `x_username` (text, safe display snapshot)
- `score` (integer, completed-run score)
- `doors_opened` (integer, correct doors)
- `completion_time_seconds` (integer, elapsed run time)
- `created_at` (timestamptz)

2. Security
- RLS is enabled on both tables.
- Username-only players can create and read public player records.
- Anyone can read global scores and submit a score.
- Scores are immutable after submission; update and delete are denied.

3. Important note
- This is a username-only identity, not secure account authentication. Anyone who enters the same username can use that public identity.
- Usernames are normalized to lowercase for uniqueness while the entered casing is retained for display.
*/

CREATE TABLE IF NOT EXISTS public.labyrinth_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  x_username text NOT NULL CHECK (char_length(x_username) BETWEEN 1 AND 15),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS labyrinth_players_username_key
  ON public.labyrinth_players (lower(x_username));

CREATE TABLE IF NOT EXISTS public.public_labyrinth_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.labyrinth_players(id) ON DELETE CASCADE,
  x_username text NOT NULL CHECK (char_length(x_username) BETWEEN 1 AND 15),
  score integer NOT NULL CHECK (score >= 0 AND score <= 15000),
  doors_opened integer NOT NULL CHECK (doors_opened >= 0 AND doors_opened <= 5),
  completion_time_seconds integer NOT NULL CHECK (completion_time_seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS public_labyrinth_scores_rank_idx
  ON public.public_labyrinth_scores (score DESC, completion_time_seconds ASC, created_at ASC);

ALTER TABLE public.labyrinth_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_labyrinth_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view public players" ON public.labyrinth_players;
CREATE POLICY "Anyone can view public players"
  ON public.labyrinth_players FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can create a public player" ON public.labyrinth_players;
CREATE POLICY "Anyone can create a public player"
  ON public.labyrinth_players FOR INSERT TO anon, authenticated WITH CHECK (char_length(x_username) BETWEEN 1 AND 15);

DROP POLICY IF EXISTS "Public players cannot be updated" ON public.labyrinth_players;
CREATE POLICY "Public players cannot be updated"
  ON public.labyrinth_players FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Public players cannot be deleted" ON public.labyrinth_players;
CREATE POLICY "Public players cannot be deleted"
  ON public.labyrinth_players FOR DELETE TO anon, authenticated USING (false);

DROP POLICY IF EXISTS "Anyone can view global scores" ON public.public_labyrinth_scores;
CREATE POLICY "Anyone can view global scores"
  ON public.public_labyrinth_scores FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Anyone can submit a global score" ON public.public_labyrinth_scores;
CREATE POLICY "Anyone can submit a global score"
  ON public.public_labyrinth_scores FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(x_username) BETWEEN 1 AND 15
    AND score >= 0 AND score <= 15000
    AND doors_opened BETWEEN 0 AND 5
    AND completion_time_seconds >= 0
  );

DROP POLICY IF EXISTS "Global scores cannot be updated" ON public.public_labyrinth_scores;
CREATE POLICY "Global scores cannot be updated"
  ON public.public_labyrinth_scores FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Global scores cannot be deleted" ON public.public_labyrinth_scores;
CREATE POLICY "Global scores cannot be deleted"
  ON public.public_labyrinth_scores FOR DELETE TO anon, authenticated USING (false);