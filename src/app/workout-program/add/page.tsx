"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Dumbbell, Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/providers";
import { memo } from 'react';

// Memoized constant arrays
const workoutDays = [
  { label: "Sunday", value: "SUNDAY" },
  { label: "Monday", value: "MONDAY" },
  { label: "Tuesday", value: "TUESDAY" },
  { label: "Wednesday", value: "WEDNESDAY" },
  { label: "Thursday", value: "THURSDAY" },
  { label: "Friday", value: "FRIDAY" },
  { label: "Saturday", value: "SATURDAY" },
] as const;

const muscleGroups = [
  { label: "Chest", value: "CHEST" },
  { label: "Triceps", value: "TRICEPS" },
  { label: "Back", value: "BACK" },
  { label: "Biceps", value: "BICEPS" },
  { label: "Shoulders", value: "SHOULDERS" },
  { label: "Legs", value: "LEGS" },
] as const;

// Memoized form schema
const formSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  description: z.string().optional(),
  workoutDays: z.array(z.string()).min(1, "Select at least one workout day"),
  muscleGroups: z.array(z.string()).min(1, "Select at least one muscle group"),
});

// Memoized components
const BackButton = memo(({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border border-orange-100/50 text-gray-600 hover:text-orange-500 transition-all duration-300 hover:scale-105 active:scale-95 mt-6 md:mt-8"
    aria-label="Go back"
  >
    <ArrowLeft className="w-5 h-5" />
  </button>
));

const HeaderSection = memo(() => (
  <div className="text-center">
    <div className="relative mb-4">
      <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-lg transform rotate-3 transition-transform hover:rotate-6">
        <Dumbbell className="w-8 h-8 md:w-10 md:h-10 text-white" />
      </div>
    </div>
    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
      Create Your Workout
    </h1>
    <p className="text-sm md:text-base text-gray-600">
      Design a program that matches your fitness goals
    </p>
  </div>
));

const CheckboxGroup = memo(({ items, field, name }: { 
  items: readonly { label: string; value: string; }[];
  field: any;
  name: string;
}) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {items.map((item) => (
      <FormItem
        key={item.value}
        className="flex items-center space-x-3 space-y-0"
      >
        <FormControl>
          <Checkbox
            checked={field.value?.includes(item.value)}
            onCheckedChange={(checked) => {
              const currentValues = field.value || [];
              if (checked) {
                field.onChange([...currentValues, item.value]);
              } else {
                field.onChange(currentValues.filter((value: string) => value !== item.value));
              }
            }}
            className="border-orange-200 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
          />
        </FormControl>
        <FormLabel className="text-sm font-medium text-gray-600 cursor-pointer">
          {item.label}
        </FormLabel>
      </FormItem>
    ))}
  </div>
));

export default function AddWorkout() {
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const response = await fetch("/api/v1/workout-program/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Workout program created successfully!", {
        className: "w-[400px]",
        style: {
          padding: '16px',
        },
      });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      router.push("/dashboard/workout-programs");
    },
    onError: (error: Error) => {
      toast.error(error.message, {
        className: "w-[400px]",
        style: {
          padding: '16px',
        },
      });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      workoutDays: [],
      muscleGroups: [],
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutate(values);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[200px] md:w-[500px] h-[200px] md:h-[500px] rounded-full bg-orange-200/30 -top-20 -right-20 blur-3xl animate-pulse" />
        <div className="absolute w-[200px] md:w-[500px] h-[200px] md:h-[500px] rounded-full bg-orange-100/40 -bottom-20 -left-20 blur-3xl animate-pulse" />
      </div>

      <div className="relative min-h-screen">
        <div className="w-full max-w-2xl mx-auto px-4">
          <BackButton onClick={() => router.back()} />

          <div className="flex min-h-[calc(100vh-120px)] items-center justify-center">
            <div className="w-full py-6 md:py-8 space-y-6 md:space-y-8">
              <HeaderSection />

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-xl border border-orange-100/50">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 md:space-y-6"
                  >
                    {/* Program Name Field with Enhanced Design */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-gray-700 font-medium">
                            Program Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Back and Biceps"
                              {...field}
                              className="border-orange-100 focus:border-orange-500 focus:ring-orange-500/20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Description Field */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-gray-700 font-medium">
                            Description (Optional)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="eg. Focus on the eccentric and the tempo"
                              className="resize-none border-orange-100 focus:border-orange-500 focus:ring-orange-500/20 min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Workout Days with Enhanced Grid Layout */}
                    <FormField
                      control={form.control}
                      name="workoutDays"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-gray-700 font-medium">
                            Workout Days
                          </FormLabel>
                          <CheckboxGroup items={workoutDays} field={field} name="workoutDays" />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Muscle Groups with Enhanced Visual Design */}
                    <FormField
                      control={form.control}
                      name="muscleGroups"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-gray-700 font-medium">
                            Target Muscle Groups
                          </FormLabel>
                          <CheckboxGroup items={muscleGroups} field={field} name="muscleGroups" />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Enhanced Submit Button with Adjusted Padding */}
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 md:py-6 rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-6"
                      disabled={isPending}
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          <span className="text-sm md:text-base">
                            Creating Your Program...
                          </span>
                        </>
                      ) : (
                        <span className="text-sm md:text-base">
                          Create Workout Program
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
