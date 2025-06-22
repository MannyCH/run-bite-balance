
interface UserProfile {
  batch_cooking_enabled?: boolean | null;
  batch_cooking_intensity?: 'low' | 'medium' | 'high' | null;
  batch_cooking_people?: number | null;
}

export interface BatchCookingConfig {
  enabled: boolean;
  intensity: string;
  people: number;
  repetitionRange: {
    min: number;
    max: number;
    label: string;
  };
  maxUniqueDinners: number;
  maxUniqueLunches: number;
  maxUniqueBreakfasts: number;
}

export function getBatchCookingConfig(profile: UserProfile): BatchCookingConfig {
  const batchCookingEnabled = profile.batch_cooking_enabled || false;
  const batchIntensity = profile.batch_cooking_intensity || 'medium';
  const batchPeople = profile.batch_cooking_people || 1;

  // Calculate repetition ranges based on intensity
  const getRepetitionRange = (intensity: string): { min: number; max: number; label: string } => {
    switch (intensity) {
      case 'low': return { min: 2, max: 2, label: '2x' };
      case 'medium': return { min: 3, max: 4, label: '3-4x' };
      case 'high': return { min: 5, max: 7, label: '5-7x' };
      default: return { min: 3, max: 4, label: '3-4x' };
    }
  };

  const repetitionRange = getRepetitionRange(batchIntensity);

  // Calculate max unique recipes per meal type for batch cooking
  const totalDays = 7; // Always 7 days for weekly plan
  const maxUniqueDinners = batchCookingEnabled ? Math.ceil(totalDays / repetitionRange.max) : totalDays;
  const maxUniqueLunches = batchCookingEnabled ? Math.ceil(totalDays / Math.max(2, repetitionRange.max - 1)) : totalDays;
  const maxUniqueBreakfasts = batchCookingEnabled ? Math.ceil(totalDays / Math.max(2, repetitionRange.max - 2)) : totalDays;

  return {
    enabled: batchCookingEnabled,
    intensity: batchIntensity,
    people: batchPeople,
    repetitionRange,
    maxUniqueDinners,
    maxUniqueLunches,
    maxUniqueBreakfasts,
  };
}

export function buildBatchCookingPrompt(config: BatchCookingConfig): string {
  if (!config.enabled) {
    return `
- DISABLED: Provide variety across all 7 days
- Each day should have unique meal combinations`;
  }

  return `
- ENABLED: Intensity "${config.intensity}" (${config.repetitionRange.label} repetitions per week) for ${config.people} people
- Repetition range: ${config.repetitionRange.min}-${config.repetitionRange.max} times per week per recipe
- Max unique dinners: ${config.maxUniqueDinners} (priority for batching)
- Max unique lunches: ${config.maxUniqueLunches} (secondary priority)
- Max unique breakfasts: ${config.maxUniqueBreakfasts} (lower priority)
- NEVER batch snacks - always unique for run days
- Use flexibility within ${config.repetitionRange.min}-${config.repetitionRange.max} range based on practical needs
- Include portion notes like "Make ${config.repetitionRange.max}x portion for ${config.repetitionRange.max} meals"`;
}
