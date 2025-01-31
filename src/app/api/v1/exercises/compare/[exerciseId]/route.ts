import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { endOfDay, startOfDay, subDays } from "date-fns";

export async function GET(
  request: NextRequest,
  { params }: { params: { exerciseId: string } }
) {
  try {
    // Auth check
    const { userId } = await auth();
    const userInfo = await currentUser();

    if (!userId || !userInfo) {
      return NextResponse.json(
        { message: "Please log in to continue", success: false },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { externalId: userInfo.id },
    });

    if (!user) {
      return NextResponse.json(
        { message: "No user exists in the database", success: false },
        { status: 401 }
      );
    }

    const { exerciseId } = params;
    const today = new Date();
    const endOfToday = endOfDay(today);
    const startOfToday = startOfDay(today);

    // First, get the exercise to check target sets
    const exercise = await prisma.exercise.findUnique({
      where: { id: Number(exerciseId) },
      select: { targetSets: true }
    });

    if (!exercise) {
      return NextResponse.json(
        { message: "Exercise not found", success: false },
        { status: 404 }
      );
    }

    // Get today's sets where count matches target sets
    const todaysSets = await prisma.set.findMany({
      where: {
        exerciseId: Number(exerciseId),
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group today's sets by createdAt date and filter groups with matching target sets
    const todaysSetGroups = todaysSets.reduce((acc: any, set) => {
      const date = set.createdAt.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(set);
      return acc;
    }, {});

    const validTodaysSets = Object.values(todaysSetGroups).find(
      (group: any) => group.length === exercise.targetSets
    ) as any[];

    // Get previous sets where count matches target sets
    const previousSets = await prisma.set.findMany({
      where: {
        exerciseId: Number(exerciseId),
        createdAt: {
          lt: startOfToday,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group previous sets by createdAt date and filter groups with matching target sets
    const previousSetGroups = previousSets.reduce((acc: any, set) => {
      const date = set.createdAt.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = [];
      acc[date].push(set);
      return acc;
    }, {});

    const validPreviousSets = Object.values(previousSetGroups).find(
      (group: any) => group.length === exercise.targetSets
    ) as any[];

    if (!validPreviousSets) {
      return NextResponse.json(
        { 
          message: "Cannot compare as there is only one completed session available", 
          success: false 
        },
        { status: 400 }
      );
    }

    // Calculate statistics
    const calculateSetStats = (sets: any[]) => {
      if (sets.length === 0) return null;
      
      return {
        totalVolume: sets.reduce((acc, set) => acc + (set.weight * set.reps), 0),
        avgWeight: sets.reduce((acc, set) => acc + set.weight, 0) / sets.length,
        avgReps: sets.reduce((acc, set) => acc + set.reps, 0) / sets.length,
        maxWeight: Math.max(...sets.map(set => set.weight)),
        maxReps: Math.max(...sets.map(set => set.reps)),
        sets: sets,
      };
    };

    const todayStats = calculateSetStats(validTodaysSets || []);
    const previousStats = calculateSetStats(validPreviousSets);

    // Calculate improvements
    const improvements = todayStats && previousStats ? {
      volumeChange: ((todayStats.totalVolume - previousStats.totalVolume) / previousStats.totalVolume) * 100,
      weightChange: ((todayStats.avgWeight - previousStats.avgWeight) / previousStats.avgWeight) * 100,
      repsChange: ((todayStats.avgReps - previousStats.avgReps) / previousStats.avgReps) * 100,
    } : null;

    return NextResponse.json({
      message: "Comparison data retrieved successfully",
      success: true,
      data: {
        today: todayStats,
        previous: previousStats,
        improvements,
      }
    });

  } catch (error: any) {
    console.error("Error details:", error);
    return NextResponse.json(
      {
        message: error.message || "Internal server error",
        success: false,
      },
      { status: 500 }
    );
  }
}