
import React from 'react';
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { BatchCookingIntensity } from '@/types/profile';
import { UseFormReturn } from 'react-hook-form';

const intensityLabels = {
  low: { label: 'Low (2x)', description: 'Recipes appear about 2 times per week' },
  medium: { label: 'Medium (3-4x)', description: 'Recipes appear 3-4 times per week' },
  high: { label: 'High (5-7x)', description: 'Recipes appear 5-7 times per week' }
};

interface BatchCookingSettingsProps {
  form: UseFormReturn<any>;
}

export const BatchCookingSettings = ({ form }: BatchCookingSettingsProps) => {
  const batchCookingEnabled = form.watch('batchCookingEnabled');
  const batchCookingIntensity = form.watch('batchCookingIntensity');

  const getSliderValue = (intensity: BatchCookingIntensity | undefined): number[] => {
    switch (intensity) {
      case 'low': return [0];
      case 'medium': return [1];
      case 'high': return [2];
      default: return [1];
    }
  };

  const getIntensityFromSlider = (value: number[]): BatchCookingIntensity => {
    switch (value[0]) {
      case 0: return 'low';
      case 1: return 'medium';
      case 2: return 'high';
      default: return 'medium';
    }
  };

  return (
    <div className="space-y-6 border-t pt-6">
      <div>
        <h3 className="text-lg font-medium">Batch Cooking Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Reduce cooking time by repeating recipes throughout the week.
        </p>
      </div>

      {/* Batch Cooking Enabled Toggle */}
      <FormField
        control={form.control}
        name="batchCookingEnabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">
                Enable Batch Cooking
              </FormLabel>
              <FormDescription>
                Repeat recipes during the week to save cooking time
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Batch Cooking Settings (only show when enabled) */}
      {batchCookingEnabled && (
        <div className="space-y-6">
          {/* Batch Cooking Intensity Slider */}
          <FormField
            control={form.control}
            name="batchCookingIntensity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Batch Cooking Intensity</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    <Slider
                      min={0}
                      max={2}
                      step={1}
                      value={getSliderValue(field.value)}
                      onValueChange={(value) => {
                        const intensity = getIntensityFromSlider(value);
                        field.onChange(intensity);
                      }}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Low (2x)</span>
                      <span>Medium (3-4x)</span>
                      <span>High (5-7x)</span>
                    </div>
                    {batchCookingIntensity && (
                      <div className="text-center">
                        <p className="font-medium">{intensityLabels[batchCookingIntensity].label}</p>
                        <p className="text-sm text-muted-foreground">
                          {intensityLabels[batchCookingIntensity].description}
                        </p>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormDescription>
                  Controls how often recipes are repeated during the week.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Batch Cooking People */}
          <FormField
            control={form.control}
            name="batchCookingPeople"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of People</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={field.value || 1}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormDescription>
                  How many people will be eating each meal?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Example:</strong> With {intensityLabels[batchCookingIntensity || 'medium'].label.toLowerCase()} intensity for {form.watch('batchCookingPeople') || 1} people, 
              recipes will appear {intensityLabels[batchCookingIntensity || 'medium'].description.toLowerCase()}, 
              providing {((form.watch('batchCookingPeople') || 1) * (batchCookingIntensity === 'low' ? 2 : batchCookingIntensity === 'high' ? 6 : 3.5)).toFixed(0)} total servings per recipe.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
