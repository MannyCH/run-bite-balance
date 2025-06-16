
import React from 'react';
import { useProfile } from '@/context/ProfileContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
  batchCookingRepetitions: z.number().min(1).max(7).optional(),
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
      batchCookingRepetitions: formData.preferences.batchCookingRepetitions || 1,
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
          batchCookingRepetitions: value.batchCookingRepetitions,
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
        <div className="space-y-6 border-t pt-6">
          <div>
            <h3 className="text-lg font-medium">Batch Cooking Preferences</h3>
            <p className="text-sm text-muted-foreground">
              Configure how often you want to repeat meals and for how many people.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Batch Cooking Repetitions */}
            <FormField
              control={form.control}
              name="batchCookingRepetitions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cook X times per week</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={7}
                      value={field.value || 1}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormDescription>
                    How many times should the same recipe appear during the week?
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
                  <FormLabel>For X people</FormLabel>
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
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Example:</strong> If you select "Cook 3× per week for 2 people", 
              the same recipe will appear 3 times during the week, and each recipe should 
              have enough portions for 2 × 3 = 6 total servings.
            </p>
          </div>
        </div>
      </div>
    </Form>
  );
}
