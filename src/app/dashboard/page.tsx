"use client";
import { Dumbbell } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function Dashboard() {
  const healthTips = useMemo(() => [
    {
      title: "Rest & Recovery",
      description: "Getting adequate rest between workouts is crucial for muscle recovery and growth.",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Proper Hydration",
      description: "Aim to drink at least 8 glasses of water daily to maintain optimal performance.",
      gradient: "from-green-500 to-green-600",
    },
    {
      title: "Nutrition Tip",
      description: "Protein intake helps repair and build muscles. Aim for 1.6-2.2g per kg of body weight.",
      gradient: "from-purple-500 to-purple-600",
    }
  ], []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome Back 👋</h1>
        <p className="text-gray-600 mt-2">Ready for another workout?</p>
      </div>
      
      <div className="mb-8">
        <Link
          href="/dashboard/workout-programs"
          className="block group relative overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          <div className="relative p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-orange-50 group-hover:bg-white/90 transition-colors">
                <Dumbbell className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Workout Programs</h2>
            </div>
            <p className="text-gray-600">Log and track your workouts</p>
          </div>
        </Link>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Health & Fitness Tips</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {healthTips.map((tip, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-md border border-gray-100"
            >
              <div className={`bg-gradient-to-r ${tip.gradient} w-8 h-8 rounded-lg mb-4 flex items-center justify-center`}>
                <span className="text-white text-lg font-bold">{index + 1}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {tip.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {tip.description}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <p className="text-sm font-medium mb-2">💪 Daily Motivation</p>
          <p className="text-xl font-semibold">
            "The difference between try and triumph is just a little umph!"
          </p>
        </div>
      </div>
    </div>
  );
}