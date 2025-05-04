
import React from 'react';
import { useProfile } from '@/context/ProfileContext';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FitnessGoal, Gender } from '@/types/profile';

const formSchema = z.object({
  weight: z.coerce.number().positive('Weight must be a positive number'),
  height: z.coerce.number().positive('Height must be a positive number'),
  age: z.coerce.number().int().positive('Age must be a positive integer'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Please select a gender' }),
  targetWeight: z.coerce.number().positive('Target weight must be a positive number'),
  fitnessGoal: z.enum(['lose', 'maintain', 'gain'], { required_error: 'Please select a fitness goal' }),
});

export function BasicInfoForm() {
  const { formData, setFormData } = useProfile();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weight: formData.basic.weight || undefined,
      height: formData.basic.height || undefined,
      age: formData.basic.age || undefined,
      gender: formData.basic.gender || undefined,
      targetWeight: formData.basic.targetWeight || undefined,
      fitnessGoal: formData.basic.fitnessGoal || undefined,
    },
  });

  // Update formData in context whenever form values change
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      setFormData(prev => ({
        ...prev,
        basic: {
          weight: value.weight as number,
          height: value.height as number,
          age: value.age as number,
          gender: value.gender as Gender,
          targetWeight: value.targetWeight as number,
          fitnessGoal: value.fitnessGoal as FitnessGoal,
        }
      }));
    });
    
    return () => subscription.unsubscribe();
  }, [form, setFormData]);

  return (
    <Form {...form}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="70" {...field} />
                </FormControl>
                <FormDescription>Your current weight in kilograms</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height (cm)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="175" {...field} />
                </FormControl>
                <FormDescription>Your height in centimeters</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="30" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="targetWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="65" {...field} />
                </FormControl>
                <FormDescription>Your goal weight in kilograms</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fitnessGoal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fitness Goal</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select goal" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="lose">Lose Weight</SelectItem>
                    <SelectItem value="maintain">Maintain Weight</SelectItem>
                    <SelectItem value="gain">Gain Weight</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </Form>
  );
}
