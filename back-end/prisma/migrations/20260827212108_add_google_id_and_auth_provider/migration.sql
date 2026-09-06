/*
  Warnings:

  - The `provider` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AuthProviders" AS ENUM ('LOCAL', 'GOOGLE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "password" DROP NOT NULL,
DROP COLUMN "provider",
ADD COLUMN     "provider" "AuthProviders" NOT NULL DEFAULT 'LOCAL';
