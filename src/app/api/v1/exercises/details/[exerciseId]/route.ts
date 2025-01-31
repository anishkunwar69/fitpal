import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { endOfDay } from "date-fns";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: { exerciseId: string } }
) {
  try {
    const { userId } = await auth();
    const userInfo = await currentUser();
    const params = await context.params;
    const currentDate = new Date();
    const endOfToday = endOfDay(currentDate);
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

    const exerciseId = params?.exerciseId;
    if (!exerciseId || isNaN(Number(exerciseId))) {
      return NextResponse.json(
        { message: "Invalid exercise ID", success: false },
        { status: 400 }
      );
    }

    const exercise = await prisma.exercise.findFirst({
      where: {
        id: Number(exerciseId),
        workoutProgram: {
          userId: user.id,
        },
      },
      include: {
        workoutProgram: {
          select: {
            id: true,
            name: true,
            description: true,
            userId: true,
          },
        },
        sets: {
          where: {
            validUpto: { equals: endOfToday }
          },
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            reps: true,
            weight: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        muscleGroups: true,
      },
    });

    if (!exercise) {
      return NextResponse.json(
        { message: "Exercise not found", success: false },
        { status: 404 }
      );
    }

    const transformedExercise = {
      ...exercise,
      sets: exercise.sets.map(set => ({
        ...set,
        createdAt: set.createdAt.toISOString(),
        updatedAt: set.updatedAt.toISOString(),
      })),
    };

    return NextResponse.json({
      message: "Exercise retrieved successfully",
      success: true,
      data: transformedExercise,
    });
    
  } catch (error: any) {
    console.error("Error details:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        success: false,
      },
      { status: 500 }
    );
  }
} 