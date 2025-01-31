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

    const { exerciseId } = await req.json();

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
          userId: user.id
        }
      },
    });

    if (!exercise) {
      return NextResponse.json(
        { message: "Exercise not found or you don't have permission to delete it", success: false },
        { status: 404 }
      );
    }

    // Wrap deletions in a transaction
    const deletedExercise = await prisma.$transaction(async (tx) => {
      // Delete all associated sets first
      await tx.set.deleteMany({
        where: {
          exerciseId: Number(exerciseId),
        },
      });

      // Delete the exercise
      return tx.exercise.delete({
        where: {
          id: Number(exerciseId),
        },
      });
    });

    return NextResponse.json({
      message: "Exercise deleted successfully",
      success: true,
      data: deletedExercise,
    });

  } catch (error) {
    console.error("Error details:", error);
    return NextResponse.json(
      {
        message: "Something went wrong.Please try again later",
        success: false,
      },
      { status: 500 }
    );
  }
}
