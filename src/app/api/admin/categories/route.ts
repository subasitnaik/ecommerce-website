import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugFromName } from "@/lib/slug-from-name";

const postSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().max(160).optional(),
  imageUrl: z.union([z.string().max(2000), z.null()]).optional(),
});

/** Categories for admin product forms (id + name for selects). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    });
    return NextResponse.json({ categories });
  } catch {
    return NextResponse.json(
      { error: "Database not available." },
      { status: 503 },
    );
  }
}

/** Create a category (admin). */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const name = parsed.data.name.trim();
  let slug = (parsed.data.slug ?? "").trim().toLowerCase();
  if (!slug) {
    slug = slugFromName(name);
  }
  const img = parsed.data.imageUrl;
  const imageUrl =
    img == null || (typeof img === "string" && img.trim() === "")
      ? null
      : img.trim();

  try {
    const created = await prisma.category.create({
      data: {
        name,
        slug,
        imageUrl,
      },
      select: { id: true, slug: true, name: true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const dup =
      e && typeof e === "object" && "code" in e && e.code === "P2002";
    return NextResponse.json(
      {
        error: dup
          ? "That URL slug is already used. Change the slug and try again."
          : "Could not create category.",
      },
      { status: dup ? 409 : 400 },
    );
  }
}
