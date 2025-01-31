import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns";
import { auth, currentUser } from "@clerk/nextjs/server";

type timeFrameTypes = "week" | "month" | "year";

// this api will fetch all the sets related info according to the time frame
export async function GET(
  request: NextRequest,
  { params }: { params: { timeFrame: timeFrameTypes; exerciseId: string } }
) {
  try {
    const { userId } = await auth();
    const userInfo = await currentUser();
    if (!userId || !userInfo) {
      return NextResponse.json(
        { message: "Please log in to continue", success: false },
        { status: 401 }
      );
    }

    const { timeFrame, exerciseId } = await params;
    const currentDate = new Date();

    // Fetch exercise with minReps and maxReps
    const exercise = await prisma.exercise.findFirst({
      where: {
        id: Number(exerciseId),
        workoutProgram: {
          user: {
            externalId: userInfo.id,
          },
        },
      },
      select: {
        id: true,
        minReps: true,
        maxReps: true,
      },
    });

    if (!exercise) {
      return NextResponse.json(
        { message: "Exercise not found or unauthorized", success: false },
        { status: 404 }
      );
    }

    let exerciseSetsForTheTimeFrame;
    if (timeFrame === "week") {
      exerciseSetsForTheTimeFrame = await prisma.set.findMany({
        where: {
          exerciseId: Number(exerciseId),
          createdAt: {
            gte: startOfWeek(currentDate),
            lte: endOfWeek(currentDate),
          },
        },
        orderBy: { createdAt: "asc" },
      });
    } else if (timeFrame === "month") {
      exerciseSetsForTheTimeFrame = await prisma.set.findMany({
        where: {
          exerciseId: Number(exerciseId),
          createdAt: {
            gte: startOfMonth(currentDate),
            lte: endOfMonth(currentDate),
          },
        },
        orderBy: { createdAt: "asc" },
      });
    } else {
      exerciseSetsForTheTimeFrame = await prisma.set.findMany({
        where: {
          exerciseId: Number(exerciseId),
          createdAt: {
            gte: startOfYear(currentDate),
            lte: endOfYear(currentDate),
          },
        },
        orderBy: { createdAt: "asc" },
      });
    }

    if (!exerciseSetsForTheTimeFrame.length) {
      return NextResponse.json(
        {
          message: `No sets found for this exercise in the selected ${timeFrame}.`,
          success: false,
          data: [],
        },
        { status: 404 }
      );
    }

    // Group sets by date
    const groupedSets = exerciseSetsForTheTimeFrame.reduce((acc: any[], set) => {
      const date = new Date(set.createdAt).toISOString().split('T')[0];
      const existingGroup = acc.find(group => group.date === date);

      if (existingGroup) {
        existingGroup.sets.push(set);
      } else {
        acc.push({
          date,
          sets: [set],
        });
      }
      return acc;
    }, []);

    // Calculate metrics for each group
    const processedData = groupedSets.map(group => {
      const totalSets = group.sets.length;
      const totalReps = group.sets.reduce((sum: number, set: any) => sum + (set.reps || 0), 0);
      const avgWeight = group.sets.reduce((sum: number, set: any) => sum + (set.weight || 0), 0) / totalSets;
      
      // Calculate target achievement using maxReps
      const targetReps = exercise.maxReps * totalSets;
      const achievementRate = (totalReps / targetReps) * 100;

      return {
        date: group.date,
        totalSets,
        repRange: `${exercise.minReps}-${exercise.maxReps}`,
        achievedReps: totalReps,
        avgWeight: Math.round(avgWeight * 100) / 100, // Round to 2 decimal places
        achievementRate: Math.round(achievementRate),
      };
    });

    return NextResponse.json(
      {
        message: `Exercise sets fetched successfully for ${timeFrame}`,
        success: true,
        data: processedData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Something went wrong while fetching exercise sets",
        success: false,
      },
      { status: 500 }
    );
  }
}
