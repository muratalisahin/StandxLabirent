-- Keep only player "ali". Run this in Supabase SQL Editor.

DELETE FROM public.public_labyrinth_scores
WHERE lower(x_username) <> 'ali';

DELETE FROM public.labyrinth_players
WHERE lower(x_username) <> 'ali';
