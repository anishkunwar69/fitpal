"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle, RefreshCcw } from "lucide-react";
import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

type MuscleGroup = {
  id: number;
  name: string;
};

const exerciseSchema = z.object({
  name: z.string().min(1, "Exercise name is required"),
  notes: z.string().optional(),
  targetSets: z.number().min(1, "At least one set is required"),
  minReps: z.number().min(1, "Minimum reps required"),
  maxReps: z.number().min(1, "Maximum reps required"),
  unit: z.enum(["KG", "LBS"]),
}).refine((data) => data.maxReps >= data.minReps, {
  message: "Maximum reps must be greater than or equal to minimum reps",
  path: ["maxReps"]
});

type ExerciseFormData = z.infer<typeof exerciseSchema>;

// Memoize static form options
const WEIGHT_UNIT_OPTIONS = [
  { value: 'KG', label: 'Kilograms (kg)' },
  { value: 'LBS', label: 'Pounds (lbs)' }
] as const;

const DEFAULT_FORM_VALUES = {
  name: "",
  notes: "",
  targetSets: 3,
  minReps: 8,
  maxReps: 12,
  unit: "KG"
} as const;

// Optimize static components with memo
const LoadingState = memo(() => (
  <div className="min-h-[90vh] flex items-center justify-center p-4">
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md w-full">
      <div className="bg-orange-50 rounded-full p-6 mb-6">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Loading Workout Data</h3>
      <p className="text-gray-600 mb-6">
        Please wait while we fetch the workout details
      </p>
    </div>
  </div>
));
LoadingState.displayName = 'LoadingState';

const ErrorState = memo(() => (
  <div className="min-h-[68vh] flex items-center justify-center p-4">
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md w-full">
      <div className="bg-red-50 rounded-full p-6 mb-6">
        <AlertCircle className="w-12 h-12 text-red-500" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Exercise Data</h3>
      <p className="text-gray-600 mb-6">
        Something went wrong while fetching exercise details
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          Try Again
        </button>
        <Link
          href="/dashboard/workout-programs"
          className="inline-flex items-center px-4 py-2 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Link>
      </div>
    </div>
  </div>
));
ErrorState.displayName = 'ErrorState';

export default function AddExercises() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("");
  const [activeMuscleGroupId, setActiveMuscleGroupId] = useState<number | null>(null);

  // Pre-optimize form configuration
  const form = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: DEFAULT_FORM_VALUES,
    mode: 'onChange' // Validate on change for better UX
  });

  // Optimize query with better caching and prefetching
  const { data: workout, isLoading, isError, refetch } = useQuery({
    queryKey: ["workout", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/workout-program/${params.id}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnReconnect: false
  });

  useEffect(() => {
    if (workout?.muscleGroups?.length > 0) {
      setActiveTab(workout.muscleGroups[0].name);
      setActiveMuscleGroupId(workout.muscleGroups[0].id);
    }
  }, [workout]);

  // Memoize handlers
  const handleMuscleGroupChange = useCallback((name: string, id: number) => {
    setActiveTab(name);
    setActiveMuscleGroupId(id);
  }, []);

  // Optimize mutation with better error handling and optimistic updates
  const exerciseMutation = useMutation({
    mutationFn: async (data: ExerciseFormData) => {
      if (!activeMuscleGroupId) throw new Error("No muscle group selected");

      const exerciseData = {
        ...data,
        muscleGroupId: activeMuscleGroupId,
        workoutProgramId: Number(params.id)
      };

      const response = await fetch(`/api/v1/exercises/${params.id}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create exercise');
      }
      return result;
    },
    onMutate: async (newExercise) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["workout", params.id] });
      const previousWorkout = queryClient.getQueryData(["workout", params.id]);
      return { previousWorkout };
    },
    onError: (error: Error, _, context) => {
      // Rollback on error
      if (context?.previousWorkout) {
        queryClient.setQueryData(["workout", params.id], context.previousWorkout);
      }
      toast.error(error.message || "Failed to add exercise", {
        style: { width: '400px', maxWidth: '90vw' }
      });
    },
    onSuccess: () => {
      router.push(`/dashboard/workout-programs/${params.id}/exercises`);
      form.reset(DEFAULT_FORM_VALUES);
      toast.success("Exercise added successfully", {
        style: { width: '400px', maxWidth: '90vw' }
      });
      queryClient.invalidateQueries({ queryKey: ["workout", params.id] });
    }
  });

  // Optimize form submission
  const onSubmit = useCallback(async (data: ExerciseFormData) => {
    if (!activeMuscleGroupId) {
      toast.error("Please select a muscle group", {
        style: { width: '400px', maxWidth: '90vw' }
      });
      return;
    }
    exerciseMutation.mutate(data);
  }, [exerciseMutation, activeMuscleGroupId]);

  // Memoize the back button handler
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState />;
  }

  // Mobile-optimized responsive styles
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 min-h-screen">
      {/* Back button - optimized for touch */}
      <button 
        onClick={handleBack}
        className="touch-manipulation inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border border-orange-100/50 text-gray-600 hover:text-orange-500 transition-all duration-300 active:scale-95 mb-4 sm:mb-6"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      <div className="space-y-6 sm:space-y-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
            Add Exercises
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Add exercises to {workout?.name}
          </p>
        </div>

        {/* Muscle group tabs - optimized for touch and scroll */}
        <div className="mb-2">
          <label className="text-sm font-medium text-gray-700">
            Select Target Muscle Group
          </label>
        </div>

        <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide -mx-3 px-3">
          <nav 
            className="-mb-px flex space-x-6 sm:space-x-8" 
            aria-label="Tabs"
            role="tablist"
          >
            {workout?.muscleGroups?.map((muscleGroup: MuscleGroup) => (
              <button
                key={muscleGroup.id}
                onClick={() => handleMuscleGroupChange(muscleGroup.name, muscleGroup.id)}
                role="tab"
                aria-selected={activeTab === muscleGroup.name}
                className={`
                  touch-manipulation whitespace-nowrap py-4 px-1 border-b-2 
                  font-medium text-sm transition-colors min-w-[80px]
                  ${
                    activeTab === muscleGroup.name
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                {muscleGroup.name.charAt(0) + muscleGroup.name.slice(1).toLowerCase()}
              </button>
            ))}
          </nav>
        </div>

        {/* Form with improved mobile input handling */}
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-5 sm:space-y-6"
            autoComplete="off"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-1.5 sm:space-y-2">
                  <FormLabel className="text-sm sm:text-base text-gray-700 font-medium">Exercise Name</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      className="border-orange-100 focus:border-orange-500 focus:ring-orange-500/20 text-sm sm:text-base"
                    />
                  </FormControl>
                  <FormMessage className="text-xs sm:text-sm" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {["targetSets", "minReps", "maxReps"].map((fieldName) => (
                <FormField
                  key={fieldName}
                  control={form.control}
                  name={fieldName as keyof ExerciseFormData}
                  render={({ field }) => (
                    <FormItem className="space-y-1.5 sm:space-y-2">
                      <FormLabel className="text-sm sm:text-base text-gray-700 font-medium">
                        {fieldName === "targetSets" ? "Sets" : 
                         fieldName === "minReps" ? "Minimum Reps" : "Maximum Reps"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="border-orange-100 focus:border-orange-500 focus:ring-orange-500/20 text-sm sm:text-base"
                        />
                      </FormControl>
                      <FormMessage className="text-xs sm:text-sm" />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <FormField
              control={form.control}
              name="unit"
              render={({ field }) => (
                <FormItem className="space-y-1.5 sm:space-y-2">
                  <FormLabel className="text-sm sm:text-base text-gray-700 font-medium">Weight Unit</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="mt-1 block w-full px-3 py-2 text-sm sm:text-base rounded-md border-orange-100 shadow-sm focus:border-orange-500 focus:ring-orange-500/20"
                    >
                      {WEIGHT_UNIT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage className="text-xs sm:text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-1.5 sm:space-y-2">
                  <FormLabel className="text-sm sm:text-base text-gray-700 font-medium">Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="resize-none border-orange-100 focus:border-orange-500 focus:ring-orange-500/20 min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
                    />
                  </FormControl>
                  <FormMessage className="text-xs sm:text-sm" />
                </FormItem>
              )}
            />

            {/* Submit button - optimized for touch */}
            <button
              type="submit"
              disabled={exerciseMutation.isPending}
              className={`
                touch-manipulation w-full bg-gradient-to-r from-orange-500 to-orange-600 
                hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-xl 
                shadow-lg hover:shadow-orange-500/25 transition-all duration-300 
                transform active:scale-[0.98] flex justify-center items-center
                text-base font-medium min-h-[56px]
                ${exerciseMutation.isPending ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {exerciseMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  <span>Adding Exercise...</span>
                </>
              ) : (
                "Add Exercise"
              )}
            </button>
          </form>
        </Form>
      </div>
    </div>
  );
} 