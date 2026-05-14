/**
 * Client-side helpers for admin image uploads. Photos picked in the form use
 * blob previews first; we upload to Cloudinary on product save, not on pick.
 */

export async function uploadImageToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || "Image upload failed.");
  }
  if (!data.url) {
    throw new Error("No image URL returned from server.");
  }
  return data.url;
}

export function revokeVariantImagePreviewUrls(s: {
  imageUrl: string;
  imageUrl2: string;
  imageUrl3: string;
}): void {
  for (const u of [s.imageUrl, s.imageUrl2, s.imageUrl3]) {
    if (u.startsWith("blob:")) {
      URL.revokeObjectURL(u);
    }
  }
}

export type VariantImageForSave = {
  imageUrl: string;
  imageUrl2: string;
  imageUrl3: string;
  imageFile1: File | null;
  imageFile2: File | null;
  imageFile3: File | null;
};

/**
 * Replaces any locally picked files with Cloudinary URLs. Revokes blob URLs
 * when replacing. Keeps existing https URLs when no new file for that slot.
 */
export async function resolveVariantImageUrlsForSave(
  v: VariantImageForSave,
): Promise<{ imageUrl: string; imageUrl2: string; imageUrl3: string }> {
  const pairs = [
    { u: "imageUrl" as const, f: "imageFile1" as const },
    { u: "imageUrl2" as const, f: "imageFile2" as const },
    { u: "imageUrl3" as const, f: "imageFile3" as const },
  ] as const;

  const out: { imageUrl: string; imageUrl2: string; imageUrl3: string } = {
    imageUrl: "",
    imageUrl2: "",
    imageUrl3: "",
  };

  for (const { u, f } of pairs) {
    const raw = v[u].trim();
    const file = v[f];
    if (file) {
      if (raw.startsWith("blob:")) {
        URL.revokeObjectURL(raw);
      }
      out[u] = await uploadImageToCloudinary(file);
    } else {
      if (raw.startsWith("blob:")) {
        throw new Error(
          "A photo is still in preview mode; try removing it and adding again, or save after configuring Cloudinary.",
        );
      }
      out[u] = raw;
    }
  }

  return out;
}
