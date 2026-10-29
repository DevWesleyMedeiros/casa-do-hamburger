-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('PRODUCT_CREATED', 'PRODUCT_DELETED', 'ORDER_STATUS_CHANGED', 'ORDER_CANCELLED');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('PRODUCT', 'ORDER');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_id_idx" ON "AuditLog"("createdAt", "id");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_id_idx" ON "AuditLog"("actorId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_id_idx" ON "AuditLog"("action", "createdAt", "id");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_id_idx" ON "AuditLog"("entityType", "entityId", "createdAt", "id");
