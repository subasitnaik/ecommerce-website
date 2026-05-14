-- Per-size optional list price (null = use product base for the size add-on in combined pricing)
ALTER TABLE "ProductSize" ADD COLUMN "priceCents" INTEGER;
