-- AlterTable
ALTER TABLE "ShopSettings" ADD COLUMN "carouselSlides" JSONB;
ALTER TABLE "ShopSettings" ADD COLUMN "homeProductMode" TEXT NOT NULL DEFAULT 'featured';
ALTER TABLE "ShopSettings" ADD COLUMN "homeProductsPerPage" INTEGER NOT NULL DEFAULT 6;

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "showOnHome" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN "categoryId" TEXT;

ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
