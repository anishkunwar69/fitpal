import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { MuscleGroupName, WorkoutDay } from "@prisma/client";
import { auth, currentUser } from "@clerk/nextjs/server";

const WorkoutProgramSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  description: z.string().optional(),
  workoutDays: z
    .array(z.enum([
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ]))
    .min(1, "At least one workout day is required"),
  muscleGroups: z
    .array(z.enum(["CHEST", "TRICEPS", "BACK", "BICEPS", "SHOULDERS", "LEGS"]))
    .min(1, "At least one muscle group is required"),
});

export async function POST(request: NextRequest) {
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

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        {
          message: "Invalid request body - must be valid JSON",
          success: false,
        },
        { status: 400 }
      );
    }

    if (!body) {
      return NextResponse.json(
        { message: "Request body is required", success: false },
        { status: 400 }
      );
    }

    const validatedData = WorkoutProgramSchema.parse(body);

    const existingProgram = await prisma.workoutProgram.findFirst({
      where: {
        userId: user.id,
        name: {
          equals: validatedData.name,
          mode: 'insensitive', // Case insensitive comparison
        },
      },
    });

    if (existingProgram) {
      return NextResponse.json(
        {
          message: "You already have a workout program with this name",
          success: false,
        },
        { status: 400 }
      );
    }

    const workoutProgram = await prisma.workoutProgram.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        workoutDays: validatedData.workoutDays as WorkoutDay[],
        userId: user.id,
        muscleGroups: {
          create: validatedData.muscleGroups.map((groupName) => ({
            name: groupName as MuscleGroupName,
          })),
        },
      },
      include: {
        muscleGroups: true,
      },
    });

    return NextResponse.json({
      message: "Workout program created successfully",
      success: true,
      data: workoutProgram,
    });
  } catch (error: any) {
    console.error("Error details:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Validation error",
          errors: error.errors,
          success: false,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: "Couldn't create your workout program. Try again later",
        success: false,
      },
      { status: 500 }
    );
  }
}
