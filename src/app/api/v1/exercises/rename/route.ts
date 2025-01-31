import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

const updateExerciseSchema = z.object({
  newExerciseName: z.string().min(1, "Exercise name is required"),
  exerciseId: z.number().positive("Invalid exercise ID"),
});

export async function PUT(req: NextRequest) {
  try {
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

    const body = await req.json();
    const validationResult = updateExerciseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: "Invalid input data", 
          errors: validationResult.error.errors,
          success: false 
        },
        { status: 400 }
      );
    }

    const { newExerciseName, exerciseId } = validationResult.data;

    const existingExercise = await prisma.exercise.findFirst({
      where: {
        id: exerciseId,
        workoutProgram: {
          userId: user.id,
        },
      },
      include: {
        workoutProgram: true,
      },
    });

    if (!existingExercise) {
      return NextResponse.json(
        { message: "Exercise not found", success: false },
        { status: 404 }
      );
    }

    const duplicateExercise = await prisma.exercise.findFirst({
      where: {
        name: newExerciseName,
        workoutProgramId: existingExercise.workoutProgramId,
        id: { not: exerciseId },
      },
    });

    if (duplicateExercise) {
      return NextResponse.json(
        { 
          message: "An exercise with this name already exists in this workout program", 
          success: false 
        },
        { status: 400 }
      );
    }

    const updatedExercise = await prisma.exercise.update({
      where: {
        id: exerciseId,
      },
      data: {
        name: newExerciseName,
      },
    });

    return NextResponse.json({
      message: "Exercise name updated successfully",
      success: true,
      data: updatedExercise,
    });

  } catch (error: any) {
    console.error("Error details:", error);
    return NextResponse.json(
      {
        message: error.message || "Something went wrong. Try again later",
        success: false,
      },
      { status: 500 }
    );
  }
}
