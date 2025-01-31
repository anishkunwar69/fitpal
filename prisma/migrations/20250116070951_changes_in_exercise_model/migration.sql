/*
  Warnings:

  - You are about to drop the column `numberOfSets` on the `Exercise` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Exercise" DROP COLUMN "numberOfSets",
ADD COLUMN     "targetSets" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "Set" ADD COLUMN     "reps" INTEGER;
