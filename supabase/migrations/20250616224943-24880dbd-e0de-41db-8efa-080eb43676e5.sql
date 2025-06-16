
-- Add batch cooking settings to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN batch_cooking_repetitions integer DEFAULT 1,
ADD COLUMN batch_cooking_people integer DEFAULT 1;

-- Add constraints to ensure reasonable values
ALTER TABLE public.profiles 
ADD CONSTRAINT batch_cooking_repetitions_check CHECK (batch_cooking_repetitions >= 1 AND batch_cooking_repetitions <= 7),
ADD CONSTRAINT batch_cooking_people_check CHECK (batch_cooking_people >= 1 AND batch_cooking_people <= 10);
