import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE() {
  try {
    await prisma.$transaction([
      prisma.set.deleteMany(),
      prisma.exercise.deleteMany(),
      prisma.muscleGroup.deleteMany(),
      prisma.workoutProgram.deleteMany(),
    ]);

    return NextResponse.json(
      { message: "All data deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting data:", error);
    return NextResponse.json(
      { error: "Failed to delete data" },
      { status: 500 }
    );
  }
}
