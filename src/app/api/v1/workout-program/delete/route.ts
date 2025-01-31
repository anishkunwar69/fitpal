import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
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

    const { workoutProgramId } = await req.json();

    if (!workoutProgramId || isNaN(Number(workoutProgramId))) {
      return NextResponse.json(
        { message: "Invalid workout program ID", success: false },
        { status: 400 }
      );
    }

    const deletedWorkoutProgram = await prisma.$transaction(async (tx) => {
      await tx.set.deleteMany({
        where: {
          exercise: {
            workoutProgramId: Number(workoutProgramId)
          }
        }
      });

      await tx.exercise.deleteMany({
        where: {
          workoutProgramId: Number(workoutProgramId)
        }
      });

      return tx.workoutProgram.delete({
        where: {
          userId: user.id,
          id: Number(workoutProgramId),
        },
      });
    });

    return NextResponse.json({
      message: "Workout program deleted successfully",
      success: true,
      data: deletedWorkoutProgram,
    });

  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json(
      {
        message: "Something went wrong. Try again later",
        success: false,
      },
      { status: 500 }
    );
  }
}
