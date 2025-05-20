
import React from 'react';
import { useProfile } from '@/context/ProfileContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { MealComplexity } from '@/types/profile';

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
  aiRecipeRatio: z.number().min(0).max(100).optional()
});

export function PreferencesForm() {
  const { formData, setFormData } = useProfile();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      preferredCuisines: formData.preferences.preferredCuisines || [],
      foodsToAvoid: formData.preferences.foodsToAvoid || [],
      mealComplexity: formData.preferences.mealComplexity || undefined,
      aiRecipeRatio: formData.preferences.aiRecipeRatio || 30,
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
          aiRecipeRatio: value.aiRecipeRatio
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

        {/* AI Recipe Ratio */}
        <FormField
          control={form.control}
          name="aiRecipeRatio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI-Generated Recipes</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <Slider
                    value={[field.value || 30]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(values) => field.onChange(values[0])}
                    className="py-4"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0% (Only database recipes)</span>
                    <span className="font-medium text-primary">{field.value || 30}%</span>
                    <span>100% (All AI-generated)</span>
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Control how many AI-generated recipes will be created for your meal plans. Higher percentages mean more completely new recipes will be generated based on your preferences and fitness goals.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}
