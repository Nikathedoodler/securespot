/*
  Warnings:

  - You are about to drop the column `state` on the `Location` table. All the data in the column will be lost.
  - You are about to drop the column `zipCode` on the `Location` table. All the data in the column will be lost.
  - Added the required column `country` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lat` to the `Location` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lng` to the `Location` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Location" DROP COLUMN "state",
DROP COLUMN "zipCode",
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "lat" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "lng" DOUBLE PRECISION NOT NULL;
