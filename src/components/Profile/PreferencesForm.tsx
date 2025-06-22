
import React from 'react';
import { useProfile } from '@/context/ProfileContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MealComplexity, BatchCookingIntensity } from '@/types/profile';
import { MultiSelectField } from './MultiSelectField';
import { BatchCookingSettings } from './BatchCookingSettings';

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
        <BatchCookingSettings form={form} />
      </div>
    </Form>
  );
}
