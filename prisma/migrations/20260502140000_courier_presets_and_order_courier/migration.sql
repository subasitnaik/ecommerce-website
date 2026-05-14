-- AlterTable
ALTER TABLE "ShopSettings" ADD COLUMN "courierPresets" JSONB;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "courierPresetId" TEXT;

-- Copy existing per-order URLs is not automated; drop column after adding preset flow
ALTER TABLE "Order" DROP COLUMN IF EXISTS "courierTrackingUrl";
