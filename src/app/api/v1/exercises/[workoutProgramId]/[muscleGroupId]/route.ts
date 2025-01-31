import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: { workoutProgramId: string, muscleGroupId: string } }
) {
  try {
    const { workoutProgramId, muscleGroupId } = await context.params;
    const userInfo = await currentUser();
    if (!userInfo) {
      return NextResponse.json(
        { message: "Unauthorized", success: false },
        { status: 401 }
      );
    }

    const exercises = await prisma.exercise.findMany({
      where: {
        workoutProgramId: Number(workoutProgramId),
        muscleGroups: {
          some: {
            id: Number(muscleGroupId)
          }
        }
      },
      include: {
        muscleGroups: true
      }
    });
    
    return NextResponse.json({
      message: "Exercises retrieved successfully",
      success: true,
      data: exercises
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Something went wrong while fetching exercises",
        success: false
      },
      { status: 500 }
    );
  }
}
