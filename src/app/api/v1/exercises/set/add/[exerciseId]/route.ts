import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { endOfDay } from "date-fns";

export async function POST(
  request: NextRequest,
  context: { params: { exerciseId: string } }
) {
  try {
    const currentDate = new Date();
    const endOfToday = endOfDay(currentDate);
    const { userId } = await auth();
    const userInfo = await currentUser();
    const { exerciseId } = await context.params;
    const body = await request.json();

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

    // Validate exerciseId
    if (!exerciseId || isNaN(Number(exerciseId))) {
      return NextResponse.json(
        { message: "Invalid exercise ID", success: false },
        { status: 400 }
      );
    }

    // Verify exercise belongs to user and check set count
    const exercise = await prisma.exercise.findFirst({
      where: {
        id: Number(exerciseId),
        workoutProgram: {
          userId: user.id,
        },
      },
      include:{
        sets:{
          where:{validUpto:{equals:endOfToday}}
        }
      }
    });

    if (!exercise) {
      return NextResponse.json(
        { message: "Exercise not found", success: false },
        { status: 404 }
      );
    }

    console.log("the exercise looks something like this",exercise);

    if (exercise.sets.length >= exercise.targetSets) {
      return NextResponse.json(
        { message: "Target sets already reached", success: false },
        { status: 400 }
      );
    }

    // Create new set
    const newSet = await prisma.set.create({
      data: {
        weight: body.weight,
        reps: body.reps,
        exerciseId: Number(exerciseId),
        validUpto:endOfToday
      },
    });

    return NextResponse.json({
      message: "Set added successfully",
      success: true,
      data: newSet,
    });
  } catch (error: any) {
    console.error("Error details:", error);
    return NextResponse.json(
      {
        message: "Something went wrong. Please try again!",
        success: false,
      },
      { status: 500 }
    );
  }
}
