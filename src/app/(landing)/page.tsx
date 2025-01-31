import { currentUser } from "@clerk/nextjs/server";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  Sparkles,
  Target,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const USP_ITEMS = [
  {
    icon: ClipboardList,
    text: "Track workouts with ease",
  },
  {
    icon: Target,
    text: "Progress tracking",
  },
  {
    icon: BarChart3,
    text: "Workout analytics",
  },
] as const;

const AVATAR_COUNT = 5;

export default async function Home() {
  const user = await currentUser();
  return (
    <>
      <section className="relative flex min-h-[calc(100vh-4rem)] bg-gradient-to-b from-orange-50 to-white">
        {/* Decorative elements */}
        <div
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden pointer-events-none"
        >
          <div className="absolute w-[200px] md:w-[500px] h-[200px] md:h-[500px] rounded-full bg-orange-200/30 -top-20 -right-20 blur-3xl animate-pulse" />
          <div className="absolute w-[200px] md:w-[500px] h-[200px] md:h-[500px] rounded-full bg-orange-100/40 -bottom-20 -left-20 blur-3xl animate-pulse" />
        </div>

        <div className="container relative mx-auto flex items-center justify-center px-4">
          <div className="flex flex-col items-center max-w-4xl mx-auto text-center py-12 md:py-20">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
              Track Your Workouts,
              <div className="relative inline-block mx-auto my-2 md:my-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-500 rounded-lg -rotate-2" />

                  <div className="relative z-10 px-4 py-1 md:px-6 md:py-2 bg-orange-500 rounded-lg rotate-2 transform transition-transform duration-300 hover:rotate-0 hover:scale-105">
                    <span className="relative inline-flex items-center text-white">
                      No BS
                      <Sparkles className="w-4 h-4 md:w-5 md:h-5 ml-1.5 md:ml-2" />
                    </span>

                    <div className="absolute -right-1 -top-1 w-2 h-2 bg-orange-300 rounded-full" />
                    <div className="absolute -left-1 -bottom-1 w-2 h-2 bg-orange-300 rounded-full" />
                  </div>

                  <div className="absolute -bottom-1 left-0 right-0 h-2 bg-orange-300 rounded-full transform -rotate-2" />
                </div>
              </div>
              Included
            </h1>

            <p className="mt-4 md:mt-8 text-base md:text-lg text-gray-600 max-w-[280px] md:max-w-2xl">
              Your pocket workout companion. Simple, powerful, and designed for
              real people who want real results.
            </p>

            <div className="grid w-full gap-3 mt-8 md:mt-16 md:grid-cols-3 md:gap-6">
              {USP_ITEMS.map(({ icon: Icon, text }, index) => (
                <div
                  key={index}
                  className="flex items-center p-4 md:flex-col md:p-6 space-x-3 md:space-x-0 transition-all duration-300 rounded-xl bg-white/80 backdrop-blur-sm hover:shadow-lg active:scale-95 md:hover:scale-105"
                >
                  <Icon className="w-6 h-6 md:w-8 md:h-8 md:mb-3 text-orange-500 flex-shrink-0" />
                  <p className="text-sm md:text-base font-medium text-gray-700">
                    {text}
                  </p>
                </div>
              ))}
            </div>

            <Link href={user ? "/dashboard" : "/sign-up"}>
              <button
                className="group relative w-full md:w-auto overflow-hidden px-6 py-3 md:px-8 md:py-4 mt-8 md:mt-16 text-base md:text-lg font-medium text-white rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all duration-300"
                type="button"
              >
                <span className="relative z-10 flex items-center justify-center">
                  {user
                    ? "Add A Workout To Get Started"
                    : " Start Your Fitness Journey"}
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute top-0 -left-[150%] w-[120%] h-full bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 group-hover:left-[150%] transition-all duration-1000 ease-out" />
              </button>
            </Link>

            <div className="mt-12 md:mt-20">
              <div className="flex justify-center -space-x-2">
                {Array.from({ length: AVATAR_COUNT }, (_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 md:w-12 md:h-12 overflow-hidden transition-all duration-300 border-2 rounded-full border-white hover:scale-110 hover:z-10 hover:shadow-lg"
                  >
                    <Image
                      src={`/avatars/avatar-${i + 1}.jpg`}
                      alt={`User ${i + 1}`}
                      width={48}
                      height={48}
                      className="object-cover"
                      priority={i < 2}
                      loading={i < 2 ? "eager" : "lazy"}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-3 md:mt-4">
                <div
                  role="img"
                  aria-label="5 out of 5 stars"
                  className="flex justify-center space-x-1"
                >
                  {Array.from({ length: AVATAR_COUNT }, (_, i) => (
                    <span
                      key={i}
                      className="text-base md:text-xl text-orange-400"
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-sm md:text-base text-gray-600">
                  Trusted by{" "}
                  <span className="font-semibold text-orange-500">2,000+</span>{" "}
                  fitness enthusiasts
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
