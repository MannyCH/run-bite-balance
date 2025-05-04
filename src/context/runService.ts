
import { Run } from "./types";
import { fetchICalRuns } from "@/utils/icalUtils";
import { generateId } from "./utils";

/**
 * Imports runs from an iCal URL
 */
export const importRunsFromIcal = async (url: string): Promise<Run[]> => {
  try {
    console.log("Fetching iCal runs from:", url);
    
    // Fetch runs from iCal
    const importedRuns = await fetchICalRuns(url);
    console.log("Imported runs:", importedRuns.length);
    
    // Add IDs to imported runs
    return importedRuns.map(run => ({
      ...run,
      id: `imported-${generateId()}`,
    })) as Run[];
  } catch (error) {
    console.error('Error importing runs:', error);
    throw error;
  }
};
