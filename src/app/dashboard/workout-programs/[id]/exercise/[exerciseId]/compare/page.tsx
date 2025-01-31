"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  TrendingUp,
  Scale,
  Target,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const LoadingState = () => (
  <div className="min-h-[90vh] flex items-center justify-center p-4">
    <div className="max-w-md w-full rounded-xl p-6 text-center">
      <Loader2 className="w-12 h-12 text-orange-500 mx-auto mb-4 animate-spin" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Loading comparison data
      </h2>
      <p className="text-gray-600">
        Please wait while we fetch your exercise comparison
      </p>
    </div>
  </div>
);

const ErrorState = ({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
    <div className="bg-red-50 rounded-full p-4 mb-4">
      <AlertCircle className="w-8 h-8 text-red-500" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">
      Failed to Load Comparison
    </h3>
    <p className="text-gray-600 text-center mb-4 max-w-md">
      {error.message || "There was an error loading your exercise comparison."}
    </p>
    <button
      onClick={onRetry}
      className="inline-flex items-center px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors gap-2"
    >
      Try Again
    </button>
  </div>
);

const NoComparisonState = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm p-6">
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-orange-100 max-w-md w-full text-center">
      <div className="bg-orange-50 rounded-full p-4 w-16 h-16 mx-auto mb-6">
        <Target className="w-8 h-8 text-orange-500" />
      </div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">
        Cannot Compare Yet
      </h3>
      <p className="text-gray-600 mb-6">
        You need at least two completed sessions with the target number of sets
        achieved to make a comparison. Complete another session to see your
        progress!
      </p>
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center px-6 py-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors gap-2 mx-auto"
      >
        <ArrowLeft className="w-5 h-5" />
        Go Back
      </button>
    </div>
  </div>
);

const ComparisonCard = ({
  title,
  current,
  previous,
  icon: Icon,
}: {
  title: string;
  current: number;
  previous: number;
  icon: any;
}) => {
  const change = ((current - previous) / previous) * 100;
  const isImprovement = change > 0;

  return (
    <div className="bg-white rounded-xl p-6 border border-orange-100 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {current.toFixed(1)}
          </p>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-orange-500" />
        </div>
      </div>
      <div
        className={`text-sm ${
          isImprovement ? "text-green-600" : "text-red-600"
        }`}
      >
        {isImprovement ? "↑" : "↓"} {Math.abs(change).toFixed(1)}% from previous
      </div>
    </div>
  );
};

const SetComparisonCard = ({
  todaySet,
  previousSet,
  setNumber,
}: {
  todaySet: any;
  previousSet: any;
  setNumber: number;
}) => {
  const weightDiff = todaySet
    ? previousSet
      ? todaySet.weight - previousSet.weight
      : 0
    : 0;
  const repsDiff = todaySet
    ? previousSet
      ? todaySet.reps - previousSet.reps
      : 0
    : 0;

  return (
    <div className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-gray-900">Set {setNumber}</h3>
        <span className="text-sm text-gray-600">
          {todaySet ? `${todaySet.weight}kg × ${todaySet.reps}` : "No data"}
        </span>
      </div>

      {todaySet && previousSet && (
        <div className="flex justify-between text-sm">
          <span
            className={`flex items-center gap-1 ${
              weightDiff >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {weightDiff > 0 ? "↑" : weightDiff < 0 ? "↓" : "="}
            {Math.abs(weightDiff)}kg
          </span>
          <span
            className={`flex items-center gap-1 ${
              repsDiff >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {repsDiff > 0 ? "↑" : repsDiff < 0 ? "↓" : "="}
            {Math.abs(repsDiff)} reps
          </span>
        </div>
      )}
    </div>
  );
};

const ProgressCircle = ({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) => (
  <div className="flex flex-col items-center">
    <div style={{ width: 100, height: 100 }}>
      <CircularProgressbar
        value={Math.abs(value)}
        maxValue={100}
        text={`${value > 0 ? "+" : ""}${value.toFixed(1)}%`}
        styles={buildStyles({
          pathColor: color,
          textColor: color,
          trailColor: "#fee2e2",
          textSize: "16px",
        })}
      />
    </div>
    <p className="text-sm text-gray-600 mt-2 text-center">{label}</p>
  </div>
);

const SummaryCard = ({ today, previous }: { today: any; previous: any }) => {
  const calculatePerformance = () => {
    const metrics = {
      weight:
        ((today.maxWeight - previous.maxWeight) / previous.maxWeight) * 100,
      volume:
        ((today.totalVolume - previous.totalVolume) / previous.totalVolume) *
        100,
      reps: ((today.maxReps - previous.maxReps) / previous.maxReps) * 100,
    };

    const overallScore = (metrics.weight + metrics.volume + metrics.reps) / 3;

    if (overallScore > 10)
      return { emoji: "🚀", text: "Outstanding Progress!" };
    if (overallScore > 5) return { emoji: "💪", text: "Solid Improvement!" };
    if (overallScore > 0) return { emoji: "📈", text: "Moving Forward!" };
    if (overallScore === 0) return { emoji: "⚖️", text: "Maintaining Steady" };
    return { emoji: "🎯", text: "Keep Pushing!" };
  };

  const performance = calculatePerformance();

  return (
    <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Session Summary</h3>
        <span className="text-2xl">{performance.emoji}</span>
      </div>
      <p className="text-gray-600 mb-4">{performance.text}</p>
      <div className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Max Weight Achieved</span>
          <span className="font-medium text-gray-900">{today.maxWeight}kg</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Total Sets Completed</span>
          <span className="font-medium text-gray-900">{today.sets.length}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Average Reps per Set</span>
          <span className="font-medium text-gray-900">
            {today.avgReps.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function Compare() {
  const router = useRouter();
  const params = useParams();
  const exerciseId = params?.exerciseId as string;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["exercise-comparison", exerciseId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/exercises/compare/${exerciseId}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message);
      }
      return data.data;
    },
  });

  if (isLoading) return <LoadingState />;

  if (isError) {
    if ((error as Error).message.includes("only one completed session")) {
      return <NoComparisonState />;
    }
    return <ErrorState error={error as Error} onRetry={refetch} />;
  }

  if (!data?.data?.today || !data?.data?.previous) {
    return <NoComparisonState />;
  }

  const chartData = {
    labels: ["Set 1", "Set 2", "Set 3", "Set 4", "Set 5"].slice(
      0,
      Math.max(
        data.data.today?.sets.length || 0,
        data.data.previous?.sets.length || 0
      )
    ),
    datasets: [
      {
        label: "Today",
        data: data.data.today?.sets.map((set: any) => set.weight) || [],
        backgroundColor: "rgba(249, 115, 22, 0.8)",
      },
      {
        label: "Previous Session",
        data: data.data.previous?.sets.map((set: any) => set.weight) || [],
        backgroundColor: "rgba(249, 115, 22, 0.3)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Weight Comparison by Set",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Weight (kg)",
        },
      },
    },
  };

  const improvements = data.data.improvements || {
    volumeChange: 0,
    weightChange: 0,
    repsChange: 0,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-orange-100 text-gray-600 hover:text-orange-500 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Session Comparison
          </h1>
          <p className="text-gray-600">
            Compare your current session with your previous one
          </p>
        </div>
      </div>

      <SummaryCard today={data.data.today} previous={data.data.previous} />

      {data.data.today && data.data.previous ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <ComparisonCard
              title="Average Weight"
              current={data.data.today.avgWeight}
              previous={data.data.previous.avgWeight}
              icon={Scale}
            />
            <ComparisonCard
              title="Total Volume"
              current={data.data.today.totalVolume}
              previous={data.data.previous.totalVolume}
              icon={TrendingUp}
            />
            <ComparisonCard
              title="Average Reps"
              current={data.data.today.avgReps}
              previous={data.data.previous.avgReps}
              icon={Target}
            />
          </div>

          <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Progress Overview
            </h3>
            <div className="flex justify-around flex-wrap gap-8">
              <ProgressCircle
                value={improvements.weightChange}
                label="Weight Progress"
                color={improvements.weightChange >= 0 ? "#16a34a" : "#dc2626"}
              />
              <ProgressCircle
                value={improvements.volumeChange}
                label="Volume Progress"
                color={improvements.volumeChange >= 0 ? "#16a34a" : "#dc2626"}
              />
              <ProgressCircle
                value={improvements.repsChange}
                label="Reps Progress"
                color={improvements.repsChange >= 0 ? "#16a34a" : "#dc2626"}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Set by Set Comparison
            </h3>
            <div className="space-y-3">
              {data.data.today.sets.map((set: any, index: number) => (
                <SetComparisonCard
                  key={index}
                  todaySet={set}
                  previousSet={data.previous.sets[index]}
                  setNumber={index + 1}
                />
              ))}
            </div>
          </div>

          <div className="hidden md:block mt-8">
            <div className="bg-white p-6 rounded-xl border border-orange-100 shadow-sm">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Comparison Available
          </h3>
          <p className="text-gray-600">
            Complete at least two sessions to see a comparison.
          </p>
        </div>
      )}
    </div>
  );
}
