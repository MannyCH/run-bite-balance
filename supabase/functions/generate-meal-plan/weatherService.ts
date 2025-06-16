
// Weather service for fetching Bern, Switzerland weather data
export interface WeatherData {
  temperature: number;
  condition: string;
  date: string;
}

export interface WeeklyWeather {
  averageTemp: number;
  dailyWeather: WeatherData[];
  temperatureCategory: 'hot' | 'mild' | 'cold';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
}

/**
 * Fetch weather forecast for Bern, Switzerland
 */
export async function fetchBernWeather(startDate: string, endDate: string): Promise<WeeklyWeather | null> {
  const apiKey = Deno.env.get('OPENWEATHER_API_KEY');
  
  if (!apiKey) {
    console.warn('No OpenWeather API key found, using seasonal fallback');
    return getSeasonalFallback(startDate);
  }

  try {
    // Bern coordinates: lat=46.9481, lon=7.4474
    const lat = 46.9481;
    const lon = 7.4474;
    
    // Fetch 5-day forecast
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );
    
    if (!response.ok) {
      console.error('Weather API error:', response.statusText);
      return getSeasonalFallback(startDate);
    }
    
    const data = await response.json();
    
    // Process the forecast data
    const dailyWeather: WeatherData[] = [];
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    // Group forecasts by day and take midday temperature
    const dailyData = new Map<string, any>();
    
    data.list.forEach((forecast: any) => {
      const forecastDate = new Date(forecast.dt * 1000);
      const dateStr = forecastDate.toISOString().split('T')[0];
      
      // Only include dates within our range
      if (forecastDate >= startDateObj && forecastDate <= endDateObj) {
        const hour = forecastDate.getHours();
        
        // Use midday forecast (12:00) as representative for the day
        if (hour >= 11 && hour <= 13) {
          dailyData.set(dateStr, {
            temperature: Math.round(forecast.main.temp),
            condition: forecast.weather[0].main,
            date: dateStr
          });
        }
      }
    });
    
    // Convert map to array and fill missing days with interpolated data
    for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      if (dailyData.has(dateStr)) {
        dailyWeather.push(dailyData.get(dateStr));
      } else {
        // Fallback for missing days
        const seasonalTemp = getSeasonalTemperature(dateStr);
        dailyWeather.push({
          temperature: seasonalTemp,
          condition: 'Clear',
          date: dateStr
        });
      }
    }
    
    // Calculate average temperature
    const averageTemp = dailyWeather.reduce((sum, day) => sum + day.temperature, 0) / dailyWeather.length;
    
    return {
      averageTemp: Math.round(averageTemp),
      dailyWeather,
      temperatureCategory: categorizeTemperature(averageTemp),
      season: getSeason(startDate)
    };
    
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return getSeasonalFallback(startDate);
  }
}

/**
 * Categorize temperature into hot, mild, or cold
 */
function categorizeTemperature(temp: number): 'hot' | 'mild' | 'cold' {
  if (temp >= 25) return 'hot';
  if (temp >= 10) return 'mild';
  return 'cold';
}

/**
 * Determine season based on date (Northern Hemisphere - Switzerland)
 */
function getSeason(dateStr: string): 'spring' | 'summer' | 'autumn' | 'winter' {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1; // 1-12
  
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/**
 * Get seasonal temperature estimate for Bern when weather API is unavailable
 */
function getSeasonalTemperature(dateStr: string): number {
  const season = getSeason(dateStr);
  const seasonalAvgs = {
    spring: 15,
    summer: 22,
    autumn: 12,
    winter: 3
  };
  return seasonalAvgs[season];
}

/**
 * Fallback weather data when API is unavailable
 */
function getSeasonalFallback(startDate: string): WeeklyWeather {
  const season = getSeason(startDate);
  const avgTemp = getSeasonalTemperature(startDate);
  
  // Generate 7 days of fallback data
  const dailyWeather: WeatherData[] = [];
  const startDateObj = new Date(startDate);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDateObj);
    date.setDate(startDateObj.getDate() + i);
    
    dailyWeather.push({
      temperature: avgTemp + (Math.random() * 6 - 3), // ±3°C variation
      condition: 'Clear',
      date: date.toISOString().split('T')[0]
    });
  }
  
  return {
    averageTemp: avgTemp,
    dailyWeather,
    temperatureCategory: categorizeTemperature(avgTemp),
    season
  };
}
