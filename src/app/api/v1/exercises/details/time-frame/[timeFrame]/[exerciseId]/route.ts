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

export async function GET(
  request: NextRequest,
  params: { params: { timeFrame: timeFrameTypes; exerciseId: string } }
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

    const { timeFrame, exerciseId } = await params.params;
    const currentDate = new Date();
    let exerciseForTheTimeFrame;

    // Verify exercise exists and belongs to user
    const exercise = await prisma.exercise.findFirst({
      where: {
        id: Number(exerciseId),
        workoutProgram: {
          user: {
            externalId: userInfo.id,
          },
        },
      },
    });

    if (!exercise) {
      return NextResponse.json(
        { message: "Exercise not found or unauthorized", success: false },
        { status: 404 }
      );
    }

    if (timeFrame === "week") {
      exerciseForTheTimeFrame = await prisma.set.findMany({
        where: {
          exerciseId: Number(exerciseId),
          createdAt: {
            gte: startOfWeek(currentDate),
            lte: endOfWeek(currentDate),
          },
        },
        include: {
          exercise: true,
        },
      });
    } else if (timeFrame === "month") {
      exerciseForTheTimeFrame = await prisma.set.findMany({
        where: {
          exerciseId: Number(exerciseId),
          createdAt: {
            gte: startOfMonth(currentDate),
            lte: endOfMonth(currentDate),
          },
        },
        include: {
          exercise: true,
        },
      });
    } else {
      exerciseForTheTimeFrame = await prisma.set.findMany({
        where: {
          exerciseId: Number(exerciseId),
          createdAt: {
            gte: startOfYear(currentDate),
            lte: endOfYear(currentDate),
          },
        },
        include: {
          exercise: true,
        },
      });
    }

    if (!exerciseForTheTimeFrame.length) {
      return NextResponse.json(
        {
          message: `No exercise data found for the selected ${timeFrame}`,
          success: false,
          data: [],
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: `Exercise data fetched successfully for ${timeFrame}`,
        success: true,
        data: exerciseForTheTimeFrame,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Something went wrong while fetching exercise data",
        success: false,
      },
      { status: 500 }
    );
  }
}
