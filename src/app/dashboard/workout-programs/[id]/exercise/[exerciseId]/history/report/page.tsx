'use client';

import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, AlertCircle, RefreshCcw, ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useParams, useSearchParams, useRouter } from 'next/navigation';

// Reuse the same interfaces
interface ExerciseSet {
  reps: number | null;
  weight: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ChartDataPoint {
  setNumber: string;
  actualReps: number;
  minReps: number;
  maxReps: number;
  weight: number;
  date: string;
  time: string;
  createdAt: string;
}

export default function ExerciseHistoryReport() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const exerciseId = params.exerciseId as string;
    const date = searchParams.get('date') as string;

    const { data: exercise, isLoading, isError, refetch } = useQuery({
        queryKey: ["exercise-report", exerciseId, date],
        queryFn: async () => {
            const res = await fetch(`/api/v1/exercises/report/${exerciseId}/${date}`);
            const data = await res.json();
            if (!data.success) {
                throw new Error(data.message);
            }
            return data;
        },
    });

    if (isLoading) {
        return (
            <div className="min-h-[90vh] flex items-center justify-center p-4">
                <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md w-full">
                    <div className="bg-orange-50 rounded-full p-6 mb-6">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Loading Exercise Report
                    </h3>
                    <p className="text-gray-600">
                        Please wait while we analyze your exercise data
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
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Failed to Load Exercise Report
                    </h3>
                    <p className="text-gray-600 mb-6">
                        {exercise?.message || "Something went wrong while fetching your exercise report"}
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => refetch()}
                            className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium shadow-lg hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Try Again
                        </button>
                        <button
                            onClick={() => router.back()}
                            className="inline-flex items-center px-6 py-3 rounded-xl border border-orange-200 text-orange-600 font-medium shadow-lg hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Transform the data for the chart
    const chartData = exercise.data.sets.map((set: ExerciseSet, index: number) => ({
        setNumber: `Set ${index + 1}`,
        actualReps: set.reps || 0,
        minReps: exercise.data.minReps,
        maxReps: exercise.data.maxReps,
        weight: set.weight === null ? 0 : parseFloat(set.weight.toString()),
        date: new Date(set.createdAt).toLocaleDateString(),
        time: new Date(set.createdAt).toLocaleTimeString(),
        createdAt: set.createdAt
    }));

    // Calculate metrics
    const totalReps = chartData.reduce((acc: number, set: { actualReps: number }) => acc + set.actualReps, 0);
    const avgCompletionRate = Math.round(
        (chartData.reduce((acc: number, set: { actualReps: number }) => {
            const targetAvg = (exercise.data.minReps + exercise.data.maxReps) / 2;
            return acc + (set.actualReps / targetAvg);
        }, 0) / chartData.length) * 100
    );

    const metrics = calculateMetrics();

    function calculateMetrics() {
        const calculateOneRepMax = (weight: number, reps: number): number => {
            return weight * (36 / (37 - reps));
        };

        const oneRepMaxes = chartData.map((set: ChartDataPoint) => 
            calculateOneRepMax(set.weight, set.actualReps)
        );
        const estimatedOneRepMax = Math.max(...oneRepMaxes).toFixed(1);

        const avgWeight = (
            chartData.reduce((acc: number, set: ChartDataPoint) => acc + set.weight, 0) / chartData.length
        ).toFixed(1);

        const restTimes = chartData.slice(1).map((set: ChartDataPoint, i: number) => {
            const currentSet = new Date(set.createdAt);
            const previousSet = new Date(chartData[i].createdAt);
            return Math.round((currentSet.getTime() - previousSet.getTime()) / 1000 / 60);
        });
        
        const avgRestTime = restTimes.length 
            ? (restTimes.reduce((acc: number, time: number) => acc + time, 0) / restTimes.length).toFixed(1)
            : '0';

        return {
            estimatedOneRepMax,
            avgWeight,
            avgRestTime,
            totalSets: chartData.length,
            totalReps: chartData.reduce((acc: number, set: ChartDataPoint) => acc + set.actualReps, 0),
        };
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
            <div className="mb-8">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-orange-100 text-gray-600 hover:text-orange-500 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{exercise.data.name} - Historical Report</span>
                        <span className="text-sm font-normal text-orange-500">
                            Date: {new Date(date).toLocaleDateString()}
                        </span>
                    </CardTitle>
                    <CardDescription>
                        Comparing completed reps vs target rep range
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6 py-4 max-w-4xl mx-auto">
                        {chartData.map((set: ChartDataPoint, index: number) => {
                            const targetAvg = (set.minReps + set.maxReps) / 2;
                            const completionRate = Math.round((set.actualReps / targetAvg) * 100);
                            const barWidth = `${Math.min(completionRate, 100)}%`;
                            
                            return (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between text-sm font-medium">
                                        <div className="space-y-0.5">
                                            <span className="text-gray-700 block">Set {index + 1}</span>
                                            <span className="text-xs text-gray-500">{set.time}</span>
                                        </div>
                                        <span className="text-orange-600 text-lg">{completionRate}%</span>
                                    </div>
                                    <div className="h-7 bg-orange-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-orange-500 rounded-full transition-all duration-500 relative"
                                            style={{ width: barWidth }}
                                        >
                                            {completionRate >= 30 && (
                                                <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                                                    {set.actualReps} reps @ {set.weight}kg
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span className="font-medium">
                                            {completionRate < 30 && `${set.actualReps} reps @ ${set.weight}kg`}
                                        </span>
                                        <span>Target range: {set.minReps}-{set.maxReps} reps</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
                <CardFooter className="flex-col items-start gap-2 text-sm">
                    <div className="flex gap-2 font-medium leading-none">
                        {chartData.length} sets recorded
                        <TrendingUp className="h-4 w-4" />
                    </div>
                </CardFooter>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <Card className="border-orange-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-orange-900">Session Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <span className="text-sm text-orange-600">Total Sets:</span>
                                <span className="text-lg font-bold text-orange-700 ml-2">{chartData.length}</span>
                            </div>
                            <div>
                                <span className="text-sm text-orange-600">Total Reps:</span>
                                <span className="text-lg font-bold text-orange-700 ml-2">{totalReps}</span>
                            </div>
                            <div>
                                <span className="text-sm text-orange-600">Volume:</span>
                                <span className="text-lg font-bold text-orange-700 ml-2">{metrics.totalReps}kg</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-orange-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-orange-900">Workout Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div>
                                <span className="text-sm text-orange-600">Estimated 1RM:</span>
                                <span className="text-lg font-bold text-orange-700 ml-2">{metrics.estimatedOneRepMax}kg</span>
                            </div>
                            <div>
                                <span className="text-sm text-orange-600">Average Weight:</span>
                                <span className="text-lg font-bold text-orange-700 ml-2">{metrics.avgWeight}kg</span>
                            </div>
                            <div>
                                <span className="text-sm text-orange-600">Rest Periods:</span>
                                <span className="text-lg font-bold text-orange-700 ml-2">{metrics.avgRestTime}min</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-orange-100">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-orange-900">Target Range</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div>
                                <span className="text-sm text-orange-600">Reps Target:</span>
                                <span className="text-lg font-bold text-orange-700 ml-2">
                                    {exercise.data.minReps}-{exercise.data.maxReps}
                                </span>
                            </div>
                            <div>
                                <span className="text-sm text-orange-600">Completion Rate:</span>
                                <span className="text-lg font-bold text-orange-700 ml-2">{avgCompletionRate}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}