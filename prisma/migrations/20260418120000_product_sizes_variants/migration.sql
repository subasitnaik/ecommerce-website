-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "sizes" JSONB,
ADD COLUMN     "variants" JSONB;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "size" TEXT,
ADD COLUMN     "variantId" TEXT,
ADD COLUMN     "variantLabel" TEXT;
