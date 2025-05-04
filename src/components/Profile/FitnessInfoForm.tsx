
import React from 'react';
import { useProfile } from '@/context/ProfileContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ActivityLevel } from '@/types/profile';

const formSchema = z.object({
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active'], { 
    required_error: 'Please select an activity level' 
  }),
  icalFeedUrl: z.string().url('Please enter a valid URL').or(z.string().length(0)).optional(),
});

export function FitnessInfoForm() {
  const { formData, setFormData } = useProfile();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      activityLevel: formData.fitness.activityLevel || undefined,
      icalFeedUrl: formData.fitness.icalFeedUrl || '',
    },
  });

  // Update formData in context whenever form values change
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      setFormData(prev => ({
        ...prev,
        fitness: {
          activityLevel: value.activityLevel as ActivityLevel,
          icalFeedUrl: value.icalFeedUrl,
        }
      }));
    });
    
    return () => subscription.unsubscribe();
  }, [form, setFormData]);

  const activityLevelDescriptions = {
    sedentary: 'Little to no exercise',
    light: 'Light exercise 1-3 days/week',
    moderate: 'Moderate exercise 3-5 days/week',
    active: 'Hard exercise 6-7 days/week',
    very_active: 'Very hard exercise & physical job or 2x training'
  };

  return (
    <Form {...form}>
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="activityLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Level</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary</SelectItem>
                  <SelectItem value="light">Lightly Active</SelectItem>
                  <SelectItem value="moderate">Moderately Active</SelectItem>
                  <SelectItem value="active">Very Active</SelectItem>
                  <SelectItem value="very_active">Extremely Active</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                {field.value ? activityLevelDescriptions[field.value as ActivityLevel] : 'How active are you on a typical day?'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icalFeedUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>iCalendar Feed URL (Optional)</FormLabel>
              <FormControl>
                <Input 
                  type="text" 
                  placeholder="https://calendar.google.com/calendar/ical/..." 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Add your iCalendar feed URL to automatically sync your workout schedule
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}
