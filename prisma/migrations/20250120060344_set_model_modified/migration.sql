/*
  Warnings:

  - Added the required column `validUpto` to the `Set` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Set" ADD COLUMN     "validUpto" TIMESTAMP(3) NOT NULL;
