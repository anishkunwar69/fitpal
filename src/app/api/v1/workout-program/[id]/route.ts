import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    const userInfo = await currentUser();
    const params = await context.params;
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

    // Ensure params.id exists and is a valid number
    const workoutId = params?.id;
    if (!workoutId || isNaN(Number(workoutId))) {
      return NextResponse.json(
        { message: "Invalid workout program ID", success: false },
        { status: 400 }
      );
    }

    const workoutProgram = await prisma.workoutProgram.findUnique({
      where: {
        id: Number(workoutId),
        userId: user.id,
      },
      include: {
        muscleGroups: true,
        exercises: {
          include: {
            muscleGroups: true,
          },
        },
      },
    });

    if (!workoutProgram) {
      return NextResponse.json(
        { message: "Workout program not found", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Workout program retrieved successfully",
      success: true,
      data: workoutProgram,
    });
  } catch (error: any) {
    console.error("Error details:", error);
    return NextResponse.json(
      {
        message: "Something went wrong while fetching workout program",
        success: false,
      },
      { status: 500 }
    );
  }
} 