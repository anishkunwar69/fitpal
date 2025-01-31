import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

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

    // Wrap all deletions in a transaction
    const deletedWorkoutProgram = await prisma.$transaction(async (tx) => {
      // First delete all sets associated with exercises in this workout program
      await tx.set.deleteMany({
        where: {
          exercise: {
            workoutProgramId: Number(workoutProgramId)
          }
        }
      });

      // Then delete all exercises in this workout program
      await tx.exercise.deleteMany({
        where: {
          workoutProgramId: Number(workoutProgramId)
        }
      });

      // Finally delete the workout program itself
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
