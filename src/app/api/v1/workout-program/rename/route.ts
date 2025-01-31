import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";

const updateWorkoutProgramSchema = z.object({
  newWorkoutProgramName: z.string().min(1, "Workout program name is required"),
  workoutProgramId: z.number().positive("Invalid workout program ID"),
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
    const validationResult = updateWorkoutProgramSchema.safeParse(body);

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

    const { newWorkoutProgramName, workoutProgramId } = validationResult.data;

    const existingWorkoutProgram = await prisma.workoutProgram.findFirst({
      where: {
        id: workoutProgramId,
        userId: user.id,
      },
    });

    if (!existingWorkoutProgram) {
      return NextResponse.json(
        { message: "Workout program not found", success: false },
        { status: 404 }
      );
    }

    const duplicateProgram = await prisma.workoutProgram.findFirst({
      where: {
        userId: user.id,
        name: newWorkoutProgramName,
        id: { not: workoutProgramId },
      },
    });

    if (duplicateProgram) {
      return NextResponse.json(
        { 
          message: "A workout program with this name already exists", 
          success: false 
        },
        { status: 400 }
      );
    }

    
    const updatedWorkoutProgram = await prisma.workoutProgram.update({
      where: {
        id: workoutProgramId,
        userId: user.id,
      },
      data: {
        name: newWorkoutProgramName,
      },
    });

    return NextResponse.json({
      message: "Workout program name updated successfully",
      success: true,
      data: updatedWorkoutProgram,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message || "Something went wrong. Try again later",
        success: false,
      },
      { status: 500 }
    );
  }
}
