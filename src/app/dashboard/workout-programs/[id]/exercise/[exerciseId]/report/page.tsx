"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, memo } from "react";
import {
  Loader2,
  TrendingUp,
  AlertCircle,
  RefreshCcw,
  ArrowLeft,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import Link from "next/link";
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

interface Metrics {
  totalReps: number;
  avgWeight: number;
  estimatedOneRepMax: number;
}
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
const registerChartComponents = () => {
  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
  );
};
registerChartComponents();
const MemoizedBar = memo(Bar);
const SetAnalysis = memo(
  ({ set, index }: { set: ChartDataPoint; index: number }) => {
    const targetAvg = (set.minReps + set.maxReps) / 2;
    const completionRate = Math.round((set.actualReps / targetAvg) * 100);
    const barWidth = `${Math.min(completionRate, 100)}%`;

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-medium">
          <div className="space-y-0.5">
            <span className="text-gray-700 block">Set {index + 1}</span>
            <span className="text-xs text-gray-500">
              {set.date} - {set.time}
            </span>
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
          <span>
            Target range: {set.minReps}-{set.maxReps} reps
          </span>
        </div>
      </div>
    );
  }
);
SetAnalysis.displayName = "SetAnalysis";
const calculateMetrics = (chartData: ChartDataPoint[]): Metrics => {
  if (chartData.length === 0) {
    return {
      totalReps: 0,
      avgWeight: 0,
      estimatedOneRepMax: 0,
    };
  }

  const totalVolume = chartData.reduce(
    (acc: number, set: ChartDataPoint) => acc + set.weight * set.actualReps,
    0
  );

  const avgWeight = Math.round(
    chartData.reduce(
      (acc: number, set: ChartDataPoint) => acc + set.weight,
      0
    ) / chartData.length
  );
  const maxSet = chartData.reduce((max: ChartDataPoint, set: ChartDataPoint) =>
    set.weight * set.actualReps > max.weight * max.actualReps ? set : max
  );

  const estimatedOneRepMax = Math.round(
    maxSet.weight * (36 / (37 - maxSet.actualReps))
  );

  return {
    totalReps: totalVolume,
    avgWeight,
    estimatedOneRepMax,
  };
};

export default function ExerciseAnalytics() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = params.exerciseId as string;
  const {
    data: exercise,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["exercise-details", exerciseId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/exercises/details/${exerciseId}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data;
    },
  });
  const chartData = useMemo(
    () =>
      exercise?.data.sets.map((set: ExerciseSet, index: number) => ({
        setNumber: `Set ${index + 1}`,
        actualReps: set.reps || 0,
        minReps: exercise.data.minReps,
        maxReps: exercise.data.maxReps,
        weight: set.weight === null ? 0 : parseFloat(set.weight.toString()),
        date: new Date(set.createdAt).toLocaleDateString(),
        time: new Date(set.createdAt).toLocaleTimeString(),
        createdAt: set.createdAt,
      })) ?? [],
    [exercise?.data.sets, exercise?.data.minReps, exercise?.data.maxReps]
  );
  const metrics = useMemo(() => calculateMetrics(chartData), [chartData]);

  const totalReps = useMemo(
    () =>
      chartData.reduce(
        (acc: number, set: ChartDataPoint) => acc + set.actualReps,
        0
      ),
    [chartData]
  );

  const avgCompletionRate = useMemo(() => {
    if (!exercise?.data || chartData.length === 0) return 0;
    return Math.round(
      (chartData.reduce((acc: number, set: ChartDataPoint) => {
        const targetAvg = (exercise.data.minReps + exercise.data.maxReps) / 2;
        return acc + set.actualReps / targetAvg;
      }, 0) /
        chartData.length) *
        100
    );
  }, [chartData, exercise?.data]);
  const { weightProgressChartData, chartOptions } = useMemo(
    () => ({
      weightProgressChartData: {
        labels: chartData.map((set: ChartDataPoint) => set.setNumber),
        datasets: [
          {
            label: "Weight (kg)",
            data: chartData.map((set: ChartDataPoint) => set.weight),
            backgroundColor: "rgba(249, 115, 22, 0.8)",
            borderColor: "rgb(249, 115, 22)",
            borderWidth: 1,
            borderRadius: 4,
            maxBarThickness: 50,
          },
        ],
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context: any) => `Weight: ${context.parsed.y}kg`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Weight (kg)",
              color: "rgb(107, 114, 128)",
              font: {
                size: 12,
              },
            },
            grid: {
              display: true,
              color: "rgba(0, 0, 0, 0.1)",
            },
          },
          x: {
            grid: {
              display: false,
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
            },
          },
        },
        animation: {
          duration: 0,
        },
        devicePixelRatio: 2,
      },
    }),
    [chartData]
  );
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
            Something went wrong while fetching your exercise report
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
              href={`/dashboard/workout-programs/${params.id}/exercises`}
              className="inline-flex items-center px-6 py-3 rounded-xl border border-orange-200 text-orange-600 font-medium shadow-lg hover:shadow-orange-500/25 transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-orange-100 text-gray-600 hover:text-orange-500 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {exercise.data.name}
          </h1>
          <p className="mt-1 text-gray-600">Exercise Report</p>
        </div>
      </div>
      <Card className="overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-base sm:text-lg gap-2">
            <span className="line-clamp-2">
              {exercise.data.name} - Set Analysis
            </span>
            <span className="text-xs sm:text-sm font-normal text-orange-500">
              Last updated:{" "}
              {new Date(
                exercise.data.sets[exercise.data.sets.length - 1]?.updatedAt
              ).toLocaleDateString()}
            </span>
          </CardTitle>
          <CardDescription className="text-sm">
            Comparing completed reps vs target rep range
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6 py-2 sm:py-4 max-w-4xl mx-auto">
            {chartData.map((set: ChartDataPoint, index: number) => (
              <SetAnalysis key={set.createdAt} set={set} index={index} />
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-xs sm:text-sm p-4 sm:p-6">
          <div className="flex gap-2 font-medium leading-none">
            {chartData.length} sets recorded
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            Showing completed reps vs target reps for each set
          </div>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-orange-100">
          <CardHeader className="pb-2 p-4">
            <CardTitle className="text-sm font-medium text-orange-900">
              Session Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-orange-600">
                  Total Sets:
                </span>
                <span className="text-base sm:text-lg font-bold text-orange-700">
                  {chartData.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-orange-600">
                  Total Reps:
                </span>
                <span className="text-base sm:text-lg font-bold text-orange-700">
                  {totalReps}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm text-orange-600">
                  Volume:
                </span>
                <span className="text-base sm:text-lg font-bold text-orange-700">
                  {metrics.totalReps}kg
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">
              Workout Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-orange-600">Estimated 1RM:</span>
                <span className="text-lg font-bold text-orange-700 ml-2">
                  {metrics.estimatedOneRepMax}kg
                </span>
                <span className="text-xs text-gray-500 block mt-0.5">
                  Your theoretical one-rep maximum
                </span>
              </div>
              <div>
                <span className="text-sm text-orange-600">Average Weight:</span>
                <span className="text-lg font-bold text-orange-700 ml-2">
                  {metrics.avgWeight}kg
                </span>
                <span className="text-xs text-gray-500 block mt-0.5">
                  Mean weight across all sets
                </span>
              </div>
              <div></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">
              Target Range
            </CardTitle>
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
                <span className="text-sm text-orange-600">
                  Completion Rate:
                </span>
                <span className="text-lg font-bold text-orange-700 ml-2">
                  {avgCompletionRate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center mt-8 mb-8">
        <button
          onClick={() =>
            router.push(
              `/dashboard/workout-programs/${params.id}/exercise/${params.exerciseId}/compare`
            )
          }
          className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 rounded-2xl bg-orange-500 text-white hover:bg-orange-600 gap-2 text-lg font-medium transition-all"
        >
          <TrendingUp className="w-6 h-6" />
          Compare with Recent Session
        </button>
      </div>

      <Card className="border-orange-100">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-medium text-orange-900">
            Weight Progress Timeline
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Weight progression across sets
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="w-full h-[250px] sm:h-[300px] md:h-[400px]">
            <MemoizedBar
              data={weightProgressChartData}
              options={{
                ...chartOptions,
                maintainAspectRatio: false,
                scales: {
                  ...chartOptions.scales,
                  x: {
                    ...chartOptions.scales.x,
                    ticks: {
                      ...chartOptions.scales.x.ticks,
                      maxRotation: 45,
                      minRotation: 45,
                      font: {
                        size: window.innerWidth < 640 ? 10 : 12,
                      },
                    },
                  },
                  y: {
                    ...chartOptions.scales.y,
                    ticks: {
                      font: {
                        size: window.innerWidth < 640 ? 10 : 12,
                      },
                    },
                  },
                },
              }}
              redraw={false}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="bg-orange-50 p-2.5 sm:p-3 rounded-lg">
              <p className="text-gray-600">Starting Weight</p>
              <p className="text-base sm:text-lg font-bold text-orange-700">
                {chartData[0]?.weight || 0}kg
              </p>
            </div>
            <div className="bg-orange-50 p-2.5 sm:p-3 rounded-lg">
              <p className="text-gray-600">Ending Weight</p>
              <p className="text-base sm:text-lg font-bold text-orange-700">
                {chartData[chartData.length - 1]?.weight || 0}kg
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
