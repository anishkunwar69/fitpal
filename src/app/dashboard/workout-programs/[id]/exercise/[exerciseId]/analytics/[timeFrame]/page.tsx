"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Dumbbell,
  Loader2,
  RefreshCcw,
  Target,
  TrendingUp
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Line } from "react-chartjs-2";
import "react-circular-progressbar/dist/styles.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const LoadingState = () => (
  <div className="min-h-[90vh] flex items-center justify-center p-4">
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center w-full max-w-[320px] sm:max-w-[400px]">
      <div className="bg-orange-50 rounded-full p-4 sm:p-6 mb-4 sm:mb-6">
        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-orange-500 animate-spin" />
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
        Loading Exercise Analytics
      </h3>
      <p className="text-sm sm:text-base text-gray-600">
        Please wait while we fetch the exercise analytics
      </p>
    </div>
  </div>
);

const StatsCard = ({
  icon: Icon,
  title,
  value,
  trend,
}: {
  icon: any;
  title: string;
  value: string;
  trend?: number;
}) => (
  <div className="bg-white rounded-xl p-4 sm:p-6 border border-orange-100 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
        {trend !== undefined && (
          <p
            className={`text-xs sm:text-sm mt-1 ${
              trend >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% from previous period
          </p>
        )}
      </div>
      <div className="bg-orange-50 p-2.5 sm:p-3 rounded-lg">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
      </div>
    </div>
  </div>
);

type Set = {
  id: number;
  weight: number;
  reps: number;
  targetReps: number;
  createdAt: string;
  exercise: {
    id: number;
    name: string;
  };
};

const groupSetsByDate = (sets: Set[]) => {
  const grouped = sets.reduce((acc, set) => {
    const date = new Date(set.createdAt).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(set);
    return acc;
  }, {} as Record<string, Set[]>);

  return Object.entries(grouped).map(([date, sets]) => ({
    createdAt: date,
    sets: sets,
  }));
};

const MilestoneCard = ({ sets }: { sets: Set[] }) => {
  const personalBests = {
    weight: Math.max(...sets.map((s) => s.weight)),
    reps: Math.max(...sets.map((s) => s.reps)),
    volume: Math.max(...sets.map((s) => s.weight * s.reps)),
  };

  const recentRecords = sets
    .slice(-5)
    .filter(
      (set) =>
        set.weight === personalBests.weight ||
        set.reps === personalBests.reps ||
        set.weight * set.reps === personalBests.volume
    );

  return (
    <div className="bg-white rounded-xl p-6 border border-orange-100 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🏆 Personal Bests
      </h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Heaviest Weight</p>
          <p className="text-xl font-bold text-gray-900">
            {personalBests.weight} kg
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Most Reps in One Set</p>
          <p className="text-xl font-bold text-gray-900">
            {personalBests.reps} reps
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">
            Highest Volume in One Set (kg × reps)
          </p>
          <p className="text-xl font-bold text-gray-900">
            {personalBests.volume} kg
          </p>
        </div>
        {recentRecords.length > 0 && (
          <div className="mt-4 pt-4 border-t border-orange-100">
            <p className="text-sm font-medium text-green-600">
              🎉 You've hit {recentRecords.length} new record
              {recentRecords.length > 1 ? "s" : ""} in your last 5 sets!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const ConsistencyCard = ({
  data,
}: {
  data: { createdAt: string; sets: Set[] }[];
}) => {
  const workoutDays = new Set(
    data.map((d) => new Date(d.createdAt).toDateString())
  ).size;
  const totalSets = data.reduce((acc, d) => acc + d.sets.length, 0);
  const averageSetsPerWorkout = totalSets / (workoutDays || 1);

  return (
    <div className="bg-white rounded-xl p-6 border border-orange-100 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        💪 Consistency Tracker
      </h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Workout Days</p>
          <p className="text-xl font-bold text-gray-900">{workoutDays} days</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Sets Completed</p>
          <p className="text-xl font-bold text-gray-900">{totalSets} sets</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Average Sets per Workout</p>
          <p className="text-xl font-bold text-gray-900">
            {averageSetsPerWorkout.toFixed(1)} sets
          </p>
        </div>
      </div>
    </div>
  );
};

const AchievementBadge = ({
  title,
  icon,
  description,
}: {
  title: string;
  icon: string;
  description: string;
}) => (
  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
    <span className="text-2xl">{icon}</span>
    <div>
      <p className="font-semibold text-gray-900">{title}</p>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </div>
);

const MotivationCard = ({
  data,
  sets,
}: {
  data: { createdAt: string; sets: Set[] }[];
  sets: Set[];
}) => {
  const achievements = [];
  const totalSets = sets.length;
  const totalWeight = sets.reduce((acc, set) => acc + set.weight * set.reps, 0);

  if (totalSets >= 100)
    achievements.push({
      title: "Century Club",
      icon: "🏆",
      description: "Completed 100+ sets! Elite status achieved!",
    });

  if (totalWeight >= 10000)
    achievements.push({
      title: "Heavy Lifter",
      icon: "💪",
      description: "Lifted over 10,000 kg in total! Incredible strength!",
    });

  const elephantWeight = 5000; // kg
  const elephantsLifted = (totalWeight / elephantWeight).toFixed(1);

  return (
    <div className="bg-white rounded-xl p-6 border border-orange-100 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🌟 Your Achievements
      </h3>

      {achievements.length > 0 ? (
        <div className="space-y-3 mb-6">
          {achievements.map((achievement, index) => (
            <AchievementBadge key={index} {...achievement} />
          ))}
        </div>
      ) : (
        <p className="text-gray-600 mb-6">
          Keep working out to unlock achievements!
        </p>
      )}

      <div className="border-t border-orange-100 pt-4">
        <h4 className="font-medium text-gray-900 mb-3">Fun Facts 🎯</h4>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            You've lifted the equivalent of {elephantsLifted} elephants! 🐘
          </p>
          <p className="text-sm text-gray-600">
            Your dedication puts you in the top {Math.min(100, totalSets)}% of
            users! 🚀
          </p>
        </div>
      </div>
    </div>
  );
};

const ProgressInsights = ({
  data,
}: {
  data: { createdAt: string; sets: Set[] }[];
}) => {
  const calculateProgress = () => {
    if (data.length < 2) return null;

    const firstDay = data[0].sets;
    const lastDay = data[data.length - 1].sets;

    const firstAvgWeight =
      firstDay.reduce((acc, set) => acc + set.weight, 0) / firstDay.length;
    const lastAvgWeight =
      lastDay.reduce((acc, set) => acc + set.weight, 0) / lastDay.length;

    return {
      weightIncrease: (
        ((lastAvgWeight - firstAvgWeight) / firstAvgWeight) *
        100
      ).toFixed(1),
      timeSpan: Math.round(
        (new Date(data[data.length - 1].createdAt).getTime() -
          new Date(data[0].createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    };
  };

  const progress = calculateProgress();

  return (
    <div className="bg-white rounded-xl p-6 border border-orange-100 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📈 Progress Insights
      </h3>

      {progress ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Strength Progress</p>
            <p className="text-2xl font-bold text-gray-900">
              {progress.weightIncrease}% increase
            </p>
            <p className="text-sm text-gray-600">in {progress.timeSpan} days</p>
          </div>

          <div className="pt-4 border-t border-orange-100">
            <p className="text-sm font-medium text-orange-500">
              {Number(progress.weightIncrease) > 10
                ? "🚀 Incredible progress! You're crushing it!"
                : "💪 Steady progress! Keep pushing!"}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-gray-600">
          Complete more workouts to see your progress insights!
        </p>
      )}
    </div>
  );
};

export default function Analytics() {
  const router = useRouter();
  const params = useParams();
  const exerciseId = params?.exerciseId as string;
  const timeFrame = params?.timeFrame as string;

  const { data, isLoading, isError, error, refetch } = useQuery<{
    data: Set[];
    message: string;
  }>({
    queryKey: ["exercise-analytics", exerciseId, timeFrame],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/exercises/details/time-frame/${timeFrame}/${exerciseId}`
      );
      const result = await response.json();

      if (response.status === 404) {
        return result;
      }

      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    },
  });

  if (isLoading) return <LoadingState />;

  if (isError) {
    return (
      <div className="min-h-[90vh] flex items-center justify-center p-4">
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center w-full max-w-[320px] sm:max-w-[400px]">
          <div className="bg-red-50 rounded-full p-4 sm:p-6 mb-4 sm:mb-6">
            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
            Failed to Load Exercise Data
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
            {error instanceof Error
              ? error.message
              : "Something went wrong while fetching exercise details"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => refetch()}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-orange-500 text-white font-medium shadow-lg hover:bg-orange-600 transition-all duration-200"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Try Again
            </button>
            <button
              onClick={() => router.back()}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl border-2 border-orange-500 text-orange-500 font-medium hover:bg-orange-50 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data?.data?.length) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-lg border border-orange-100 text-gray-600 hover:text-orange-500 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-white rounded-xl p-8 border border-orange-100 shadow-sm text-center">
          <div className="max-w-md mx-auto">
            <div className="bg-orange-50 rounded-full p-3 w-fit mx-auto mb-4">
              <Target className="w-6 h-6 text-orange-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Analytics Available
            </h2>
            <p className="text-gray-600 mb-6">
              No exercise data found for the selected {timeFrame}. Complete some
              sets to see your analytics!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const groupedData = groupSetsByDate(data.data);

  const chartData = {
    labels: groupedData.map((entry) => entry.createdAt),
    datasets: [
      {
        label: "Strength Progress",
        data: groupedData.map((entry) => ({
          x: entry.createdAt,
          y:
            entry.sets.reduce((acc, set) => acc + set.weight, 0) /
            entry.sets.length,
        })),
        borderColor: "rgb(249, 115, 22)",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Average Weight: ${context.parsed.y.toFixed(1)} kg`;
          },
        },
        padding: 12,
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        titleColor: "#111827",
        bodyColor: "#111827",
        borderColor: "#FED7AA",
        borderWidth: 1,
        titleFont: {
          size: 14,
          weight: 500,
        },
        bodyFont: {
          size: 13,
        },
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Average Weight (kg)",
          font: {
            size: 12,
            weight: 500,
          },
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 11,
          },
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg border border-orange-100 text-gray-600 hover:text-orange-500 transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Exercise Analytics
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Viewing data for{" "}
            {timeFrame === "week"
              ? "this week"
              : timeFrame === "month"
              ? "this month"
              : "this year"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <StatsCard
          icon={Dumbbell}
          title="Average Weight"
          value={`${
            groupedData.reduce(
              (acc, entry) =>
                acc +
                entry.sets.reduce((setAcc, set) => setAcc + set.weight, 0) /
                  entry.sets.length,
              0
            ) / (groupedData.length || 1)
          } kg`}
        />
        <StatsCard
          icon={TrendingUp}
          title="Max Weight"
          value={`${Math.max(
            ...groupedData.flatMap((entry) =>
              entry.sets.map((set) => set.weight)
            )
          )} kg`}
        />
        <StatsCard
          icon={Calendar}
          title="Total Sessions"
          value={groupedData.length.toString()}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <MotivationCard data={groupedData} sets={data?.data || []} />
        <ProgressInsights data={groupedData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <MilestoneCard sets={data?.data || []} />
        <ConsistencyCard data={groupedData} />
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl border border-orange-100 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
          Strength Progress Timeline
        </h2>
        <div className="h-[300px] sm:h-[400px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
