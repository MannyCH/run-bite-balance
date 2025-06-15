
// Request validation utilities
export interface MealPlanRequest {
  userId: string;
  startDate: string;
  endDate: string;
  runs?: any[];
}

export function validateRequestBody(body: any): { isValid: boolean; error?: string; data?: MealPlanRequest } {
  if (!body) {
    return { isValid: false, error: 'Invalid JSON in request body' };
  }

  const { userId, startDate, endDate } = body;
  
  if (!userId || !startDate || !endDate) {
    return { isValid: false, error: 'Missing required parameters: userId, startDate, endDate' };
  }

  return { 
    isValid: true, 
    data: { 
      userId, 
      startDate, 
      endDate, 
      runs: body.runs || [] 
    } 
  };
}
