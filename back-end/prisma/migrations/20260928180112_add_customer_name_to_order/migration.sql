/*
  Warnings:

  - Added the required column `customerName` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN "customerName" TEXT;

UPDATE "Order" o
SET "customerName" = u."name"
FROM "User" u
WHERE u."id" = o."userId";

ALTER TABLE "Order" ALTER COLUMN "customerName" SET NOT NULL;
