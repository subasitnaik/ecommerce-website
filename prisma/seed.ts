import "dotenv/config";
import bcrypt from "bcryptjs";
import { HOME_CATEGORY_DEFINITIONS } from "../src/data/mock-categories";
import { MOCK_PRODUCTS, type StoreSizeOption } from "../src/data/mock-products";
import { prisma } from "../src/lib/prisma";

/** Source of truth: `src/data/mock-products.ts` — run `npm run db:seed` after migrations. */

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "changeme";
  const hash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Store owner",
      passwordHash: hash,
      role: "admin",
    },
    update: {
      passwordHash: hash,
    },
  });

  await prisma.shopSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      codEnabled: true,
      homeProductMode: "bestsellers",
      homeHighlightRails: ["bestsellers"],
      homeProductsPerPage: 6,
      carouselSlides: [
        {
          imageUrl:
            "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1600&q=80",
          alt: "Wear your philosophy",
          href: "/products",
        },
      ],
    },
    update: {},
  });

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    create: {
      code: "WELCOME10",
      type: "percent",
      value: 10,
      active: true,
    },
    update: {},
  });

  const categoryIdBySlug = new Map<string, string>();
  for (const c of HOME_CATEGORY_DEFINITIONS) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      create: {
        name: c.name,
        slug: c.slug,
        sortOrder: c.sortOrder,
        showOnHome: true,
        imageUrl: c.imageUrl,
      },
      update: {
        name: c.name,
        sortOrder: c.sortOrder,
        showOnHome: true,
        imageUrl: c.imageUrl,
      },
    });
    categoryIdBySlug.set(c.slug, row.id);
  }

  const featuredSlugs = new Set(MOCK_PRODUCTS.slice(0, 6).map((p) => p.slug));

  for (const p of MOCK_PRODUCTS) {
    const catSlug = p.categorySlug;
    const categoryId = catSlug ? categoryIdBySlug.get(catSlug) : undefined;
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        priceCents: p.priceCents,
        mrpCents: p.mrpCents ?? null,
        currency: p.currency,
        imageUrl: p.imageUrl,
        active: true,
        featured: featuredSlugs.has(p.slug),
        categoryId: categoryId ?? undefined,
      },
      update: {
        name: p.name,
        description: p.description,
        priceCents: p.priceCents,
        mrpCents: p.mrpCents ?? null,
        imageUrl: p.imageUrl,
        featured: featuredSlugs.has(p.slug),
        categoryId: categoryId ?? null,
      },
    });
    const pid = product.id;
    await prisma.productStock.deleteMany({ where: { productId: pid } });
    await prisma.productVariant.deleteMany({ where: { productId: pid } });
    await prisma.productSize.deleteMany({ where: { productId: pid } });

    const sizeOptions = p.sizeOptions ?? [];
    const variants = p.variants ?? [];
    const sizeIdMap = new Map<string, string>();
    for (let i = 0; i < sizeOptions.length; i++) {
      const so = sizeOptions[i]! as StoreSizeOption;
      const row = await prisma.productSize.create({
        data: {
          productId: pid,
          label: so.label,
          sortOrder: i,
          priceCents: so.priceCents,
        },
      });
      sizeIdMap.set(so.id, row.id);
    }
    const variantIdMap = new Map<string, string>();
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i]!;
      const row = await prisma.productVariant.create({
        data: {
          productId: pid,
          label: v.label,
          imageUrl: v.imageUrl,
          priceCents: v.priceCents,
          sortOrder: i,
        },
      });
      variantIdMap.set(v.id, row.id);
    }
    if (p.stockByPair) {
      for (const [key, qty] of Object.entries(p.stockByPair)) {
        const idx = key.indexOf("::");
        if (idx < 0) continue;
        const vOld = key.slice(0, idx);
        const sOld = key.slice(idx + 2);
        const newVid = variantIdMap.get(vOld);
        const newSid = sizeIdMap.get(sOld);
        if (newVid && newSid) {
          await prisma.productStock.create({
            data: {
              productId: pid,
              variantId: newVid,
              sizeId: newSid,
              quantity: qty,
            },
          });
        }
      }
    }
  }

  const reviewSeeds: {
    slug: string;
    reviews: {
      authorName: string;
      rating: number;
      comment: string;
      imageUrls?: string[];
    }[];
  }[] = [
    {
      slug: "essential-crew-tee",
      reviews: [
        {
          authorName: "Aditi M.",
          rating: 5,
          comment:
            "Fabric feels dense and the collar holds its shape after washing. Fit pic in the gallery.",
          imageUrls: [
            "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&w=960&q=80",
            "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&w=960&q=80",
          ],
        },
        {
          authorName: "Rahul K.",
          rating: 4,
          comment: "True to size; colour is a rich black.",
          imageUrls: [
            "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&w=960&q=80",
          ],
        },
      ],
    },
    {
      slug: "graphic-street-tee",
      reviews: [
        {
          authorName: "Sneha P.",
          rating: 5,
          comment: "Print is crisp and the shirt keeps its drape. New favourite.",
          imageUrls: [
            "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&w=960&q=80",
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&w=960&q=80",
            "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&w=960&q=80",
          ],
        },
      ],
    },
    {
      slug: "slim-chinos",
      reviews: [
        {
          authorName: "Vikram S.",
          rating: 5,
          comment: "Slim without feeling tight. Hem sits clean on trainers.",
          imageUrls: [
            "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&w=960&q=80",
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&w=960&q=80",
          ],
        },
      ],
    },
  ];

  for (const { slug, reviews } of reviewSeeds) {
    const prod = await prisma.product.findUnique({ where: { slug } });
    if (!prod) continue;
    await prisma.review.deleteMany({ where: { productId: prod.id } });
    await prisma.review.createMany({
      data: reviews.map((r) => ({
        productId: prod.id,
        authorName: r.authorName,
        rating: r.rating,
        comment: r.comment,
        imageUrls: r.imageUrls ?? [],
      })),
    });
  }

  console.log(`Seeded ${MOCK_PRODUCTS.length} mock products (trousers, t-shirts, hoodies) + sample reviews.`);
  console.log("Sample bag coupon: WELCOME10 (10% off) — or create your own in Website settings.");
  console.log(`Admin: ${email} (password from ADMIN_PASSWORD or 'changeme').`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
