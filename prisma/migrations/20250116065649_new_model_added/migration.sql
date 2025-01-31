/*
  Warnings:

  - You are about to drop the column `reps` on the `Exercise` table. All the data in the column will be lost.
  - You are about to drop the column `sets` on the `Exercise` table. All the data in the column will be lost.
  - Added the required column `maxReps` to the `Exercise` table without a default value. This is not possible if the table is not empty.
  - Added the required column `minReps` to the `Exercise` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('KG', 'LBS');

-- AlterTable
ALTER TABLE "Exercise" DROP COLUMN "reps",
DROP COLUMN "sets",
ADD COLUMN     "maxReps" INTEGER NOT NULL,
ADD COLUMN     "minReps" INTEGER NOT NULL,
ADD COLUMN     "numberOfSets" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "unit" "WeightUnit" NOT NULL DEFAULT 'KG';

-- CreateTable
CREATE TABLE "Set" (
    "id" SERIAL NOT NULL,
    "weight" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "exerciseId" INTEGER NOT NULL,

    CONSTRAINT "Set_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Set_exerciseId_idx" ON "Set"("exerciseId");

-- AddForeignKey
ALTER TABLE "Set" ADD CONSTRAINT "Set_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
