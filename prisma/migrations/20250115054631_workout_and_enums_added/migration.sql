/*
  Warnings:

  - Changed the type of `name` on the `MuscleGroup` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MuscleGroupName" AS ENUM ('CHEST', 'TRICEPS', 'BACK', 'BICEPS', 'SHOULDERS', 'LEGS');

-- CreateEnum
CREATE TYPE "WorkoutDay" AS ENUM ('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');

-- AlterTable
ALTER TABLE "MuscleGroup" DROP COLUMN "name",
ADD COLUMN     "name" "MuscleGroupName" NOT NULL;

-- AlterTable
ALTER TABLE "WorkoutProgram" ADD COLUMN     "workoutDays" "WorkoutDay"[];

-- CreateIndex
CREATE UNIQUE INDEX "MuscleGroup_name_key" ON "MuscleGroup"("name");
