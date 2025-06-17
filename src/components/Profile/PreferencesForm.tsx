
import React from 'react';
import { useProfile } from '@/context/ProfileContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { MealComplexity, BatchCookingIntensity } from '@/types/profile';

// Reuse MultiSelectField from DietaryInfoForm
const MultiSelectField = ({
  value = [],
  onChange,
  placeholder = 'Type and press Enter to add',
  label,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label: string;
}) => {
  const [inputValue, setInputValue] = React.useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        const newValue = [...value, inputValue.trim()];
        onChange(newValue);
      }
      setInputValue('');
    }
  };

  const removeItem = (itemToRemove: string) => {
    onChange(value.filter(item => item !== itemToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        />
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.map((item) => (
            <div
              key={item}
              className="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm flex items-center"
            >
              {item}
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="ml-2 text-primary hover:text-primary/80"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const formSchema = z.object({
  preferredCuisines: z.array(z.string()),
  foodsToAvoid: z.array(z.string()),
  mealComplexity: z.enum(['simple', 'moderate', 'complex'], { 
    required_error: 'Please select a meal complexity preference' 
  }),
  batchCookingEnabled: z.boolean().optional(),
  batchCookingIntensity: z.enum(['low', 'medium', 'high']).optional(),
  batchCookingPeople: z.number().min(1).max(10).optional(),
});

const intensityLabels = {
  low: { label: 'Low (2x)', description: 'Recipes appear about 2 times per week' },
  medium: { label: 'Medium (3-4x)', description: 'Recipes appear 3-4 times per week' },
  high: { label: 'High (5-7x)', description: 'Recipes appear 5-7 times per week' }
};

export function PreferencesForm() {
  const { formData, setFormData } = useProfile();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      preferredCuisines: formData.preferences.preferredCuisines || [],
      foodsToAvoid: formData.preferences.foodsToAvoid || [],
      mealComplexity: formData.preferences.mealComplexity || undefined,
      batchCookingEnabled: formData.preferences.batchCookingEnabled || false,
      batchCookingIntensity: formData.preferences.batchCookingIntensity || 'medium',
      batchCookingPeople: formData.preferences.batchCookingPeople || 1,
    },
  });

  const batchCookingEnabled = form.watch('batchCookingEnabled');
  const batchCookingIntensity = form.watch('batchCookingIntensity');

  // Update formData in context whenever form values change
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      setFormData(prev => ({
        ...prev,
        preferences: {
          preferredCuisines: value.preferredCuisines || [],
          foodsToAvoid: value.foodsToAvoid || [],
          mealComplexity: value.mealComplexity as MealComplexity,
          batchCookingEnabled: value.batchCookingEnabled,
          batchCookingIntensity: value.batchCookingIntensity as BatchCookingIntensity,
          batchCookingPeople: value.batchCookingPeople,
        }
      }));
    });
    
    return () => subscription.unsubscribe();
  }, [form, setFormData]);

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
    <Form {...form}>
      <div className="space-y-8">
        {/* Preferred Cuisines */}
        <FormField
          control={form.control}
          name="preferredCuisines"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Cuisines</FormLabel>
              <FormControl>
                <MultiSelectField
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="E.g., Italian, Thai, Mexican (press Enter to add)"
                  label="Preferred Cuisines"
                />
              </FormControl>
              <FormDescription>
                What types of cuisines do you enjoy eating?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Foods to Avoid */}
        <FormField
          control={form.control}
          name="foodsToAvoid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Foods to Avoid</FormLabel>
              <FormControl>
                <MultiSelectField
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="E.g., mushrooms, olives (press Enter to add)"
                  label="Foods to Avoid"
                />
              </FormControl>
              <FormDescription>
                Enter any foods you prefer not to eat (excluding allergies).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Meal Complexity */}
        <FormField
          control={form.control}
          name="mealComplexity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meal Complexity Preference</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meal complexity" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="simple">Simple (Quick & easy recipes)</SelectItem>
                  <SelectItem value="moderate">Moderate (Balanced time & flavor)</SelectItem>
                  <SelectItem value="complex">Complex (More elaborate recipes)</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How much time are you willing to spend preparing meals?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Batch Cooking Section */}
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
      </div>
    </Form>
  );
}
