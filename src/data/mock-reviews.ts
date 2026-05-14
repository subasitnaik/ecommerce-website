export type StoreReview = {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  imageUrls?: string[];
};

type MockReviewSeed = Omit<StoreReview, "createdAt"> & {
  createdAt: string;
  imageUrls?: string[];
};

/** Demo photos (Unsplash) — storefront review gallery & layout checks. */
const IMG = {
  flatlayHoodie:
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&w=960&q=80",
  streetwear:
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&w=960&q=80",
  teesStack:
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&w=960&q=80",
  hangerDetail:
    "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&w=960&q=80",
  denimFit:
    "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&w=960&q=80",
  soleDetail:
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&w=960&q=80",
} as const;

const essentialTee: MockReviewSeed[] = [
  {
    id: "rev-tee-1",
    authorName: "Aditi M.",
    rating: 5,
    comment:
      "Fabric feels dense and the collar keeps its shape after washing.\nDropped a fit pic so you can see the drape on a regular build.",
    createdAt: "2025-11-02T10:00:00.000Z",
    imageUrls: [IMG.flatlayHoodie, IMG.teesStack],
  },
  {
    id: "rev-tee-2",
    authorName: "Rahul K.",
    rating: 4,
    comment:
      "True to size; colour is a rich black. Sleeve length is slightly long on me (I’m 5’10) but cuffs sit clean folded once.",
    createdAt: "2025-11-15T14:30:00.000Z",
    imageUrls: [IMG.hangerDetail],
  },
  {
    id: "rev-tee-3-demo",
    authorName: "Mira L.",
    rating: 5,
    comment:
      "Second wash and no pilling yet. Packaging was minimal — appreciate that.",
    createdAt: "2025-11-18T16:00:00.000Z",
    imageUrls: [IMG.streetwear, IMG.denimFit],
  },
];

/** Per-slug demo reviews when the database has none (or is offline). */
const BY_SLUG: Record<string, MockReviewSeed[]> = {
  "essential-crew-tee": essentialTee,
  "graphic-street-tee": [
    {
      id: "rev-graph-1",
      authorName: "Sneha P.",
      rating: 5,
      comment:
        "Print is crisp and the shirt keeps its drape. New favourite. Close-up shot shows ink detail after wear.",
      createdAt: "2025-10-20T09:00:00.000Z",
      imageUrls: [IMG.streetwear, IMG.soleDetail, IMG.teesStack],
    },
    {
      id: "rev-graph-demo-2",
      authorName: "Arjun V.",
      rating: 4,
      comment: "Colours match the PDP. Roomy in shoulders, fitted at hem — exactly how I wanted.",
      createdAt: "2025-10-22T11:00:00.000Z",
      imageUrls: [IMG.hangerDetail],
    },
  ],
  "slim-chinos": [
    {
      id: "rev-chinos-1",
      authorName: "Vikram S.",
      rating: 5,
      comment:
        "Slim without feeling tight. Hem sits clean on trainers.\nPosting a cuff + shoe angle.",
      createdAt: "2025-12-01T11:00:00.000Z",
      imageUrls: [IMG.denimFit, IMG.soleDetail],
    },
  ],
};

export function getMockReviewsForSlug(slug: string): StoreReview[] {
  const list = BY_SLUG[slug];
  if (!list?.length) return [];
  return list.map((r) => ({
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    comment: r.comment,
    createdAt: new Date(r.createdAt),
    imageUrls: r.imageUrls,
  }));
}
