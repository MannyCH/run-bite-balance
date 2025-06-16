
-- Add seasonal and temperature suitability fields to recipes table
ALTER TABLE public.recipes 
ADD COLUMN IF NOT EXISTS seasonal_suitability TEXT[] DEFAULT ARRAY['year_round'],
ADD COLUMN IF NOT EXISTS temperature_preference TEXT DEFAULT 'any',
ADD COLUMN IF NOT EXISTS dish_type TEXT DEFAULT 'neutral';

-- Add comments to explain the new fields
COMMENT ON COLUMN public.recipes.seasonal_suitability IS 'Array of seasons when this recipe is most suitable: spring, summer, autumn, winter, year_round';
COMMENT ON COLUMN public.recipes.temperature_preference IS 'Temperature preference: hot_weather, cold_weather, mild_weather, any';
COMMENT ON COLUMN public.recipes.dish_type IS 'Type of dish based on temperature effect: warming, cooling, neutral';
