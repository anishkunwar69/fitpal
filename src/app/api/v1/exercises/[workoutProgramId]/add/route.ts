import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { auth, currentUser } from "@clerk/nextjs/server";

const ExerciseSchema = z.object({
  name: z.string().min(1, "Exercise name is required"),
  notes: z.string().optional(),
  targetSets: z.number().min(1, "At least one set is required"),
  minReps: z.number().min(1, "Minimum reps required"),
  maxReps: z.number().min(1, "Maximum reps required"),
  unit: z.enum(["KG", "LBS"]),
  muscleGroupId: z.number().min(1, "Muscle group is required")
}).refine((data) => data.maxReps >= data.minReps, {
  message: "Maximum reps must be greater than or equal to minimum reps",
  path: ["maxReps"]
});

export async function POST(
  request: NextRequest,
  context: { params: { workoutProgramId: string } }
) {
  try {
    const { userId } = await auth();
    const userInfo = await currentUser();
    const workoutId = await Number(context.params.workoutProgramId);

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

    // Validate body against schema
    if (!body) {
      return NextResponse.json(
        { message: "Request body is required", success: false },
        { status: 400 }
      );
    }

    const validatedData = ExerciseSchema.parse(body);
    const muscleGroupId = body.muscleGroupId;

    if (!muscleGroupId) {
      return NextResponse.json(
        { message: "Muscle group ID is required", success: false },
        { status: 400 }
      );
    }

    // Verify workout program exists and belongs to user
    const workoutProgram = await prisma.workoutProgram.findFirst({
      where: {
        id: workoutId,
        userId: user.id,
      },
      include: {
        exercises: true, // Include exercises to check for duplicates
      },
    });

    if (!workoutProgram) {
      return NextResponse.json(
        { message: "Workout program not found", success: false },
        { status: 404 }
      );
    }

    // Check for existing exercise with the same name in this workout program
    const existingExercise = workoutProgram.exercises.find(
      (exercise) => exercise.name.toLowerCase() === validatedData.name.toLowerCase()
    );

    if (existingExercise) {
      return NextResponse.json(
        {
          message: "An exercise with this name already exists in this workout program",
          success: false,
        },
        { status: 400 }
      );
    }

    // Create the exercise
    const exercise = await prisma.exercise.create({
      data: {
        name: validatedData.name,
        notes: validatedData.notes,
        targetSets: validatedData.targetSets,
        minReps: validatedData.minReps,
        maxReps: validatedData.maxReps,
        unit: validatedData.unit,
        workoutProgramId: workoutId,
        muscleGroups: {
          connect: [{ id: muscleGroupId }]
        }
      },
      include: {
        muscleGroups: true
      }
    });

    return NextResponse.json({
      message: "Exercise created successfully",
      success: true,
      data: exercise,
    });
  } catch (error: any) {
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
        message: "Failed to add the exercise. Try again later.",
        success: false,
      },
      { status: 500 }
    );
  }
} 