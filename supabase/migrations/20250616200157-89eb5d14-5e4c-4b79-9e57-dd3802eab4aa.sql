
-- Add meal_type column to recipes table if it doesn't exist properly
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS meal_type TEXT[] DEFAULT NULL;

-- Add a comment to explain the field
COMMENT ON COLUMN public.recipes.meal_type IS 'Array of meal types this recipe is suitable for: breakfast, lunch, dinner, snack';

-- Create an index to improve query performance when filtering by meal type
CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON public.recipes USING GIN (meal_type);
