
// Weather service for fetching Bern, Switzerland weather data using Open-Meteo API
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
 * Fetch weather forecast for Bern, Switzerland using Open-Meteo API
 */
export async function fetchBernWeather(startDate: string, endDate: string): Promise<WeeklyWeather | null> {
  try {
    // Bern coordinates: lat=46.9481, lon=7.4474
    const lat = 46.9481;
    const lon = 7.4474;
    
    // Calculate the number of days for the forecast
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const dayCount = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 3600 * 24)) + 1;
    
    // Open-Meteo API call - free, no API key required
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=Europe/Zurich&forecast_days=${Math.min(dayCount, 16)}`
    );
    
    if (!response.ok) {
      console.error('Open-Meteo API error:', response.statusText);
      return getSeasonalFallback(startDate);
    }
    
    const data = await response.json();
    
    // Process the forecast data
    const dailyWeather: WeatherData[] = [];
    
    // Open-Meteo returns arrays of daily data
    if (data.daily && data.daily.time) {
      for (let i = 0; i < data.daily.time.length; i++) {
        const forecastDate = data.daily.time[i];
        const maxTemp = data.daily.temperature_2m_max[i];
        const minTemp = data.daily.temperature_2m_min[i];
        const weatherCode = data.daily.weather_code[i];
        
        // Calculate average temperature for the day
        const avgTemp = Math.round((maxTemp + minTemp) / 2);
        
        // Convert weather code to condition string
        const condition = interpretWeatherCode(weatherCode);
        
        // Only include dates within our range
        const forecastDateObj = new Date(forecastDate);
        if (forecastDateObj >= startDateObj && forecastDateObj <= endDateObj) {
          dailyWeather.push({
            temperature: avgTemp,
            condition: condition,
            date: forecastDate
          });
        }
      }
    }
    
    // Fill missing days with seasonal fallback if needed
    for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      if (!dailyWeather.find(day => day.date === dateStr)) {
        const seasonalTemp = getSeasonalTemperature(dateStr);
        dailyWeather.push({
          temperature: seasonalTemp,
          condition: 'Clear',
          date: dateStr
        });
      }
    }
    
    // Sort by date to ensure proper order
    dailyWeather.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate average temperature
    const averageTemp = dailyWeather.reduce((sum, day) => sum + day.temperature, 0) / dailyWeather.length;
    
    console.log(`Weather data fetched for Bern: ${dailyWeather.length} days, avg temp ${Math.round(averageTemp)}°C`);
    
    return {
      averageTemp: Math.round(averageTemp),
      dailyWeather,
      temperatureCategory: categorizeTemperature(averageTemp),
      season: getSeason(startDate)
    };
    
  } catch (error) {
    console.error('Error fetching weather data from Open-Meteo:', error);
    return getSeasonalFallback(startDate);
  }
}

/**
 * Interpret Open-Meteo weather codes to readable conditions
 */
function interpretWeatherCode(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly Cloudy';
  if (code <= 48) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Rain Showers';
  if (code <= 86) return 'Snow Showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
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
  
  console.log(`Using seasonal fallback for ${season}: ${avgTemp}°C average`);
  
  // Generate fallback data for the requested period
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
