import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE() {
  try {
    // Delete in order to respect foreign key constraints
    await prisma.$transaction([
      // Delete Sets first since they depend on Exercises
      prisma.set.deleteMany(),
      
      // Delete Exercises before WorkoutProgram
      prisma.exercise.deleteMany(),
      
      // Delete MuscleGroups
      prisma.muscleGroup.deleteMany(),
      
      // Delete WorkoutPrograms last
      prisma.workoutProgram.deleteMany(),
    ]);

    return NextResponse.json({ message: "All data deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting data:", error);
    return NextResponse.json(
      { error: "Failed to delete data" },
      { status: 500 }
    );
  }
}
