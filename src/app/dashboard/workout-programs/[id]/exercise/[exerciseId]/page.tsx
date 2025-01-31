'use client'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Loader2, Plus, RefreshCcw, Target } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface Exercise {
  id: number
  name: string
  targetSets: number
  minReps: number
  maxReps: number
  unit: 'KG' | 'LBS'
  sets: Array<{
    id: number
    weight: number
    reps: number
    createdAt: string
  }>
  workoutProgram: {
    id: number
    name: string
    description: string
  }
  muscleGroups: Array<{
    name: string
  }>
}

interface ApiResponse {
  message: string
  success: boolean
  data: Exercise
}

const setSchema = z.object({
  weight: z.number().min(0, "Weight must be positive"),
  reps: z.number().min(1, "At least one rep required"),
});

type SetFormData = z.infer<typeof setSchema>;

export default function ExerciseDetails() {
  const { data, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ['exercise-details'],
    queryFn: async () => {
      const exerciseId = window.location.pathname.split('/').pop()
      const response = await fetch(`/api/v1/exercises/details/${exerciseId}`)
      const data = await response.json()
      if (!data.success) {
        throw new Error(data.message)
      }
      return data
    }
  })

  const queryClient = useQueryClient();
  const [showSetForm, setShowSetForm] = useState(false);

  const form = useForm<SetFormData>({
    resolver: zodResolver(setSchema),
    defaultValues: {
      weight: 0,
      reps: 0,
    },
  });

  const addSetMutation = useMutation({
    mutationFn: async (data: SetFormData) => {
      const exerciseId = window.location.pathname.split('/').pop();
      const response = await fetch(`/api/v1/exercises/set/add/${exerciseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to add set');
      }
      return result;
    },
    onSuccess: () => {
      setShowSetForm(false);
      form.reset();
      toast.success("Set added successfully");
      queryClient.invalidateQueries({ queryKey: ['exercise-details'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add set");
    },
  });

  const { exercise, completedSets, progressPercentage } = useMemo(() => {
    const exercise = data?.data
    const completedSets = exercise?.sets?.length || 0
    const progressPercentage = (completedSets / (exercise?.targetSets || 1)) * 100
    return { exercise, completedSets, progressPercentage }
  }, [data?.data])

  const onSubmit = useCallback((data: SetFormData) => {
    addSetMutation.mutate(data)
  }, [addSetMutation])

  if (isLoading) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md w-full">
          <div className="bg-orange-50 rounded-full p-6 mb-6">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Loading Exercise Data
          </h3>
          <p className="text-gray-600 mb-6">
            Please wait while we fetch your exercise details
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md w-full">
          <div className="bg-red-50 rounded-full p-6 mb-6">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Exercise Data</h3>
          <p className="text-gray-600 mb-6">
            Something went wrong while fetching exercise details
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            <Link
              href={`/dashboard/workout-programs/${window.location.pathname.split('/')[3]}/exercises`}
              className="inline-flex items-center px-6 py-3 rounded-xl border border-orange-200 text-orange-600 font-medium shadow-lg hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="mb-8">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-orange-100 text-gray-600 hover:text-orange-500 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{exercise?.name}</h1>
            <p className="mt-1 text-gray-600">
              Part of program: {exercise?.workoutProgram.name}
            </p>
          </div>
          <Link
            href={`/dashboard/workout-programs/${exercise?.workoutProgram.id}`}
            className="text-orange-600 hover:text-orange-700 text-sm font-medium"
          >
            Back to Program
          </Link>
        </div>
        {exercise?.workoutProgram.description && (
          <p className="mt-4 text-gray-600 text-sm">{exercise.workoutProgram.description}</p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#F97316"
                strokeWidth="3"
                strokeDasharray={`${progressPercentage}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{completedSets}/{exercise?.targetSets}</span>
              <span className="text-sm text-gray-600">Sets</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Exercise Details</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Target Sets:</span>
              <span className="font-medium">{exercise?.targetSets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Rep Range:</span>
              <span className="font-medium">{exercise?.minReps} - {exercise?.maxReps}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Muscle Groups:</span>
              <div className="flex gap-2">
                {exercise?.muscleGroups.map(muscle => (
                  <span key={muscle.name} className="px-2 py-1 bg-orange-50 text-orange-700 rounded-full text-xs">
                    {muscle.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {exercise && completedSets < exercise.targetSets && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <div className="min-w-5 mt-0.5">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-5 h-5 text-orange-500"
            >
              <path 
                fillRule="evenodd" 
                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
          <div>
            {completedSets === 0 ? (
              <>
                <h4 className="font-medium text-orange-800">Ready to Start Your Workout?</h4>
                <p className="mt-1 text-sm text-orange-700">
                  Time to tackle your first set! Add {exercise.targetSets} sets to complete today's exercise. 
                  <span className="block mt-1 text-orange-800">
                    Track your progress and unlock performance insights by logging your sets! 🎯
                  </span>
                </p>
              </>
            ) : (
              <>
                <h4 className="font-medium text-orange-800">Keep Going! You're Making Progress</h4>
                <p className="mt-1 text-sm text-orange-700">
                  You've completed {completedSets} out of {exercise.targetSets} sets. 
                  Push through those remaining {exercise.targetSets - completedSets} sets to achieve your workout goal! 💪
                  <span className="block mt-1 text-orange-800">
                    Complete all target sets to unlock your progress tracking and performance insights!
                  </span>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {completedSets < (exercise?.targetSets || 0) ? (
        <div className="space-y-4">
          <button 
            className="w-full bg-orange-500 text-white rounded-lg px-4 py-3 flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
            onClick={() => setShowSetForm(!showSetForm)}
          >
            <Plus className="w-5 h-5" />
            Add New Set
          </button>

          {showSetForm && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight ({exercise?.unit})</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.5"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/^0+/, '');
                              field.onChange(value ? Number(value) : '');
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reps</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/^0+/, '');
                              field.onChange(value ? Number(value) : '');
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <button
                    type="submit"
                    disabled={addSetMutation.isPending}
                    className="w-full bg-orange-500 text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {addSetMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Adding Set...
                      </>
                    ) : (
                      'Save Set'
                    )}
                  </button>
                </form>
              </Form>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <div className="min-w-5 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-600">
                <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-green-800">Outstanding Achievement!</h4>
              <p className="mt-1 text-sm text-green-700">
                You've completed all {exercise?.targetSets} sets - that's incredible work! 
                Check out your exercise report to see your progress over time.
              </p>
            </div>
          </div>
          <Link
            href={`/dashboard/workout-programs/${exercise?.workoutProgram.id}/exercise/${exercise?.id}/report`}
            className="w-full bg-green-500 text-white rounded-lg px-4 py-3 flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
          >
            <Target className="w-5 h-5" />
            View Exercise Reports
          </Link>
        </div>
      )}

      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Set History</h2>
          {exercise?.sets && exercise.sets.length > 0 ? (
            <div className="space-y-4">
              {exercise.sets.some(set => {
                const setDate = new Date(set.createdAt).toDateString();
                const today = new Date().toDateString();
                return setDate === today;
              }) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-green-600">
                      <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm.87 15.75h-1.5v-1.5h1.5v1.5zm0-4.5h-1.5v-6h1.5v6z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-green-800">
                      You've logged sets today - great job keeping up with your workout routine!
                    </p>
                  </div>
                </div>
              )}
              
              {exercise.sets.map((set, index) => (
                <div 
                  key={set.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full text-orange-600 font-medium">
                      {index + 1}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">Weight:</span>
                        <span className="text-sm text-gray-900">{set.weight} {exercise.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">Reps:</span>
                        <span className="text-sm text-gray-900">{set.reps}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(set.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No sets recorded yet
            </div>
          )}
        </div>
      </div>
    </div>
  )
}