
-- Add batch cooking enabled toggle and replace repetitions with intensity
ALTER TABLE public.profiles 
ADD COLUMN batch_cooking_enabled boolean DEFAULT false,
ADD COLUMN batch_cooking_intensity text DEFAULT 'medium';

-- Drop the old repetitions column since we're replacing it with intensity
ALTER TABLE public.profiles 
DROP COLUMN batch_cooking_repetitions;

-- Add constraint to ensure only valid intensity values
ALTER TABLE public.profiles 
ADD CONSTRAINT batch_cooking_intensity_check CHECK (batch_cooking_intensity IN ('low', 'medium', 'high'));

-- Update existing records to have batch cooking enabled if they had repetitions > 1
UPDATE public.profiles 
SET batch_cooking_enabled = true 
WHERE batch_cooking_people > 1;
