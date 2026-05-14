-- Distinct from OOS: this size × variant combination is not sold on the storefront.
ALTER TABLE "ProductStock" ADD COLUMN "notOffered" BOOLEAN NOT NULL DEFAULT false;
