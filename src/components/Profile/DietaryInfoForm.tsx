
import React from 'react';
import { useProfile } from '@/context/ProfileContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

// Multi-select component that handles string arrays
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
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
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
  dietaryPreferences: z.array(z.string()),
  nutritionalTheory: z.string().min(1, 'Please select a nutritional approach').optional(),
  foodAllergies: z.array(z.string()),
});

export function DietaryInfoForm() {
  const { formData, setFormData } = useProfile();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dietaryPreferences: formData.dietary.dietaryPreferences || [],
      nutritionalTheory: formData.dietary.nutritionalTheory || undefined,
      foodAllergies: formData.dietary.foodAllergies || [],
    },
  });

  // Update formData in context whenever form values change
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      setFormData(prev => ({
        ...prev,
        dietary: {
          dietaryPreferences: value.dietaryPreferences || [],
          nutritionalTheory: value.nutritionalTheory,
          foodAllergies: value.foodAllergies || [],
        }
      }));
    });
    
    return () => subscription.unsubscribe();
  }, [form, setFormData]);

  return (
    <Form {...form}>
      <div className="space-y-8">
        {/* Dietary Preferences */}
        <FormField
          control={form.control}
          name="dietaryPreferences"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dietary Preferences</FormLabel>
              <FormControl>
                <MultiSelectField
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="E.g., vegetarian, low-carb (press Enter to add)"
                  label="Dietary Preferences"
                />
              </FormControl>
              <FormDescription>
                Enter any dietary preferences like vegetarian, vegan, low-carb, etc.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nutritional Approach */}
        <FormField
          control={form.control}
          name="nutritionalTheory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nutritional Approach</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="space-y-3"
                >
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="tim_spector" />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="font-normal">Tim Spector Approach</FormLabel>
                      <FormDescription>
                        Focus on diverse, plant-based foods for gut microbiome health
                      </FormDescription>
                    </div>
                  </FormItem>
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="keto" />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="font-normal">Ketogenic</FormLabel>
                      <FormDescription>
                        High fat, moderate protein, very low carb diet
                      </FormDescription>
                    </div>
                  </FormItem>
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="paleo" />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="font-normal">Paleo</FormLabel>
                      <FormDescription>
                        Whole foods diet based on foods similar to those eaten by early humans
                      </FormDescription>
                    </div>
                  </FormItem>
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="mediterranean" />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="font-normal">Mediterranean</FormLabel>
                      <FormDescription>
                        Plant-based foods, lean proteins, and healthy fats
                      </FormDescription>
                    </div>
                  </FormItem>
                  <FormItem className="flex items-start space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="balanced" />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="font-normal">Balanced</FormLabel>
                      <FormDescription>
                        Traditional balanced approach with all major food groups
                      </FormDescription>
                    </div>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Food Allergies */}
        <FormField
          control={form.control}
          name="foodAllergies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Food Allergies or Intolerances</FormLabel>
              <FormControl>
                <MultiSelectField
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder="E.g., peanuts, shellfish (press Enter to add)"
                  label="Food Allergies"
                />
              </FormControl>
              <FormDescription>
                Enter any food allergies or intolerances you have.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}
