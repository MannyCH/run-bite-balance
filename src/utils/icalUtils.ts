
import ICAL from 'ical';
import { Run } from '@/context/AppContext';

const DEFAULT_PACE = 5.5; // 5:30 pace as number (minutes as decimal)

export async function fetchICalRuns(url: string): Promise<Partial<Run>[]> {
  try {
    // Use a CORS proxy to avoid CORS issues with external calendar feeds
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.text();
    const parsedData = ICAL.parseICS(data);
    
    // Convert iCal events to runs
    const runs: Partial<Run>[] = [];
    
    for (const key in parsedData) {
      const event = parsedData[key];
      
      // Skip non-VEVENT entries
      if (event.type !== 'VEVENT' || !event.start) {
        continue;
      }
      
      // Extract run distance from description or summary if available
      let distance = 5; // Default distance in km
      let title = event.summary || 'Scheduled Run';
      
      // Try to extract distance from description or summary
      if (event.description) {
        const distanceMatch = event.description.match(/(\d+(\.\d+)?)\s*(km|miles)/i);
        if (distanceMatch) {
          distance = parseFloat(distanceMatch[1]);
          // Convert miles to km if needed
          if (distanceMatch[3].toLowerCase() === 'miles') {
            distance *= 1.60934;
          }
        }
      } else if (event.summary) {
        const distanceMatch = event.summary.match(/(\d+(\.\d+)?)\s*(km|miles)/i);
        if (distanceMatch) {
          distance = parseFloat(distanceMatch[1]);
          // Convert miles to km if needed
          if (distanceMatch[3].toLowerCase() === 'miles') {
            distance *= 1.60934;
          }
        }
      }
      
      // Default duration based on pace
      const paceMinutes = DEFAULT_PACE; // 5.5 minutes per km
      const duration = Math.round(distance * paceMinutes * 60); // Convert to seconds
      
      // Create run object
      const run: Partial<Run> = {
        title,
        date: event.start,
        distance,
        duration,
        pace: paceMinutes, // Use numeric pace value
        isPlanned: true,
        route: event.location || undefined,
        isImported: true, // Flag to identify imported runs
      };
      
      runs.push(run);
    }
    
    return runs;
  } catch (error) {
    console.error('Error fetching iCal data:', error);
    return [];
  }
}
