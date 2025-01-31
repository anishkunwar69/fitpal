import { isSameDay, parse } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET(request: NextRequest, params: { params: { exerciseId: string, date: string } }) {
  try {
    const { userId } = await auth();
    const userInfo = await currentUser();

    if (!userId || !userInfo) {
      return NextResponse.json(
        { message: "Please log in to continue", success: false },
        { status: 401 }
      );
    }

    const { exerciseId, date } = await params.params;
    const parsedIncomingDate = parse(date, 'yyyy-MM-dd', new Date());

    const exercise = await prisma.exercise.findFirst({
      where: {
        id: Number(exerciseId),
        workoutProgram: {
          user: {
            externalId: userInfo.id,
          },
        },
      },
      include: {
        sets: {
          where: {
            createdAt: {
              gte: parsedIncomingDate,
              lt: new Date(parsedIncomingDate.getTime() + 24 * 60 * 60 * 1000),
            },
          },
          orderBy: {
            createdAt: 'asc',
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

    if (!exercise.sets.length) {
      return NextResponse.json(
        { 
          message: "No sets found for this date",
          success: false,
          data: null 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Exercise report fetched successfully",
      success: true,
      data: {
        name: exercise.name,
        minReps: exercise.minReps,
        maxReps: exercise.maxReps,
        sets: exercise.sets,
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Something went wrong while fetching exercise report",
        success: false,
      },
      { status: 500 }
    );
  }
}