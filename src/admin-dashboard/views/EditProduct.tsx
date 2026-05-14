"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, InputWithLabel } from "../components";
import TextAreaInput from "../components/TextAreaInput";
import SelectInput from "../components/SelectInput";
import { AdminLink as Link } from "@/admin-dashboard/navigation/AdminLink";
import {
  ProductInventoryFields,
  type SizeFormRow,
  type VariantFormRow,
} from "../components/ProductInventoryFields";
import {
  buildSizesPayload,
  ensureMatrix,
  ensureUnavailablePairs,
  type UnavailablePairForm,
} from "../product-inventory-helpers";
import { resolveVariantImageUrlsForSave } from "@/lib/admin-upload-image-client";

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-600 bg-white px-3 py-2.5 text-sm text-blackPrimary outline-none dark:bg-blackPrimary dark:text-whiteSecondary";

type Cat = { id: string; name: string };

type ProductLoad = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  /** From API (rupees); optional MRP for strikethrough on shop. */
  mrpRupees?: number | null;
  currency: string;
  imageUrl: string | null;
  active: boolean;
  featured: boolean;
  categoryId: string | null;
  sizes: { label: string; priceRupees: number | null }[];
  variants: {
    id: string;
    label: string;
    imageUrl: string | null;
    imageUrl2: string | null;
    imageUrl3: string | null;
    priceRupees: number | null;
  }[];
  stock: number[][];
  unavailablePairs?: UnavailablePairForm[];
  error?: string;
};

function useProductSlugFromPath(): string | null {
  const path = usePathname();
  return useMemo(() => {
    const parts = (path || "").split("/").filter(Boolean);
    const i = parts.indexOf("products");
    if (i < 0) return null;
    const seg = parts[i + 1];
    if (!seg || seg === "create-product") return null;
    return decodeURIComponent(seg);
  }, [path]);
}

export default function EditProduct() {
  const router = useRouter();
  const slug = useProductSlugFromPath();
  const [categories, setCategories] = useState<Cat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceRupees, setPriceRupees] = useState("");
  const [mrpRupees, setMrpRupees] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);
  const [sizeRows, setSizeRows] = useState<SizeFormRow[]>([]);
  const [variantRows, setVariantRows] = useState<VariantFormRow[]>([]);
  const [stockMatrix, setStockMatrix] = useState<number[][]>([]);
  const [unavailablePairs, setUnavailablePairs] = useState<UnavailablePairForm[]>(
    [],
  );

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = (await res.json()) as { categories?: Cat[] };
      if (res.ok) setCategories(data.categories ?? []);
    } catch {
      /* optional */
    }
  }, []);

  const loadProduct = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setLoadErr(null);
    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(slug)}`,
      );
      const data = (await res.json()) as ProductLoad;
      if (!res.ok) {
        setLoadErr(data.error ?? "Product not found.");
        setLoading(false);
        return;
      }
      setName(data.name);
      setDescription(data.description);
      setPriceRupees(
        (data.priceCents / 100) % 1 === 0
          ? String(data.priceCents / 100)
          : (data.priceCents / 100).toFixed(2),
      );
      setMrpRupees(
        data.mrpRupees == null || data.mrpRupees === undefined
          ? ""
          : +data.mrpRupees % 1 === 0
            ? String(data.mrpRupees)
            : data.mrpRupees.toFixed(2),
      );
      setCategoryId(data.categoryId ?? "");
      setFeatured(data.featured);
      setActive(data.active);
      setSizeRows(
        data.sizes?.length
          ? data.sizes.map((s) => ({
              label: s.label,
              priceRupees:
                s.priceRupees == null ? "" : String(s.priceRupees),
            }))
          : ["S", "M", "L", "XL"].map((label) => ({
              label,
              priceRupees: "",
            })),
      );
      setVariantRows(
        data.variants?.length
          ? data.variants.map((v) => ({
              label: v.label,
              imageUrl: v.imageUrl ?? "",
              imageUrl2: v.imageUrl2 ?? "",
              imageUrl3: v.imageUrl3 ?? "",
              imageFile1: null,
              imageFile2: null,
              imageFile3: null,
              priceRupees:
                v.priceRupees == null ? "" : String(v.priceRupees),
            }))
          : [
              {
                label: "Default",
                imageUrl: "",
                imageUrl2: "",
                imageUrl3: "",
                imageFile1: null,
                imageFile2: null,
                imageFile3: null,
                priceRupees: "",
              },
            ],
      );
      setStockMatrix(
        data.stock?.length
          ? data.stock
          : ensureMatrix(
              data.variants?.length || 1,
              data.sizes?.length || 4,
              [],
            ),
      );
      setUnavailablePairs(data.unavailablePairs ?? []);
    } catch {
      setLoadErr("Could not load product.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  useEffect(() => {
    setStockMatrix((prev) =>
      ensureMatrix(variantRows.length, sizeRows.length, prev),
    );
  }, [variantRows.length, sizeRows.length]);

  useEffect(() => {
    setUnavailablePairs((prev) =>
      ensureUnavailablePairs(prev, sizeRows.length, variantRows.length),
    );
  }, [sizeRows.length, variantRows.length]);

  const categoryOptions = [
    { value: "", label: "No category" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slug) return;
    setSubmitErr(null);
    setSaving(true);
    const price = parseFloat(priceRupees.replace(/,/g, ""));
    if (Number.isNaN(price) || price <= 0) {
      setSubmitErr("Enter a valid default list price in rupees.");
      setSaving(false);
      return;
    }

    const mrpTrim = mrpRupees.trim();
    let mrpPayload: number | null | undefined = undefined;
    if (mrpTrim !== "") {
      const m = parseFloat(mrpTrim.replace(/,/g, ""));
      if (Number.isNaN(m) || m < 0) {
        setSubmitErr("MRP must be a valid number ≥ 0, or leave blank.");
        setSaving(false);
        return;
      }
      mrpPayload = m;
    } else {
      mrpPayload = null;
    }

    const sizesResult = buildSizesPayload(sizeRows);
    if (!sizesResult.ok) {
      setSubmitErr(sizesResult.error);
      setSaving(false);
      return;
    }
    const sizesPayload = sizesResult.sizes;

    const variantsPayload = variantRows.map((v) => {
      const label = v.label.trim();
      const pr = v.priceRupees.trim();
      return {
        label,
        imageUrl: v.imageUrl.trim(),
        imageUrl2: v.imageUrl2.trim(),
        imageUrl3: v.imageUrl3.trim(),
        priceRupees: pr === "" ? null : parseFloat(pr),
      };
    });
    for (const v of variantsPayload) {
      if (!v.label) {
        setSubmitErr("Each variant needs a label.");
        setSaving(false);
        return;
      }
      if (v.priceRupees != null && (Number.isNaN(v.priceRupees) || v.priceRupees < 0)) {
        setSubmitErr(
          "Variant prices must be valid numbers ≥ 0, or left blank to use the base price.",
        );
        setSaving(false);
        return;
      }
    }
    if (variantsPayload.length < 1) {
      setSubmitErr(
        "Add at least one variant row (one row is enough for a single option).",
      );
      setSaving(false);
      return;
    }

    const resolvedVariantImages: {
      imageUrl: string;
      imageUrl2: string;
      imageUrl3: string;
    }[] = [];
    for (const v of variantRows) {
      try {
        const imgs = await resolveVariantImageUrlsForSave(v);
        resolvedVariantImages.push(imgs);
      } catch (e) {
        setSubmitErr(
          e instanceof Error
            ? e.message
            : "Could not upload product images. Check Cloudinary in .env and try again.",
        );
        setSaving(false);
        return;
      }
    }

    const variantsPayloadWithImages = variantRows.map((v, idx) => {
      const pr = v.priceRupees.trim();
      const resolved = resolvedVariantImages[idx]!;
      return {
        label: v.label.trim(),
        imageUrl: resolved.imageUrl,
        imageUrl2: resolved.imageUrl2,
        imageUrl3: resolved.imageUrl3,
        priceRupees: pr === "" ? null : parseFloat(pr),
      };
    });

    if (stockMatrix.length !== variantsPayloadWithImages.length) {
      setSubmitErr("Stock matrix does not match variant count.");
      setSaving(false);
      return;
    }
    for (const row of stockMatrix) {
      if (row.length !== sizesPayload.length) {
        setSubmitErr("Stock matrix must have one column per size.");
        setSaving(false);
        return;
      }
    }

    try {
      const res = await fetch(
        `/api/admin/products/${encodeURIComponent(slug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            priceRupees: price,
            mrpRupees: mrpPayload,
            categoryId: categoryId || null,
            featured,
            active,
            inventory: {
              sizes: sizesPayload,
              variants: variantsPayloadWithImages.map((v) => ({
                label: v.label,
                imageUrl: v.imageUrl || undefined,
                imageUrl2: v.imageUrl2 || undefined,
                imageUrl3: v.imageUrl3 || undefined,
                priceRupees: v.priceRupees,
              })),
              stock: stockMatrix,
              unavailablePairs: ensureUnavailablePairs(
                unavailablePairs,
                sizesPayload.length,
                variantsPayloadWithImages.length,
              ),
            },
          }),
        },
      );
      const data = (await res.json().catch(() => ({}))) as ProductLoad & {
        mrpRupees?: number | null;
        error?: string;
        details?: { fieldErrors?: Record<string, string[]> };
      };
      if (!res.ok) {
        const z =
          data.details?.fieldErrors &&
          Object.values(data.details.fieldErrors).flat()[0];
        setSubmitErr(z ?? data.error ?? "Could not save.");
        setSaving(false);
        return;
      }
      if (data.slug && data.slug !== slug) {
        router.replace(`/admin/products/${encodeURIComponent(data.slug)}`);
      }
      if (data.sizes) {
        setSizeRows(
          data.sizes.map((s) => ({
            label: s.label,
            priceRupees: s.priceRupees == null ? "" : String(s.priceRupees),
          })),
        );
        setVariantRows(
          (data.variants ?? []).map((v) => ({
            label: v.label,
            imageUrl: v.imageUrl ?? "",
            imageUrl2: v.imageUrl2 ?? "",
            imageUrl3: v.imageUrl3 ?? "",
            imageFile1: null,
            imageFile2: null,
            imageFile3: null,
            priceRupees:
              v.priceRupees == null ? "" : String(v.priceRupees),
          })),
        );
        setStockMatrix(data.stock ?? []);
        setUnavailablePairs(data.unavailablePairs ?? []);
      }
      if (data.mrpRupees !== undefined) {
        setMrpRupees(
          data.mrpRupees == null
            ? ""
            : data.mrpRupees % 1 === 0
              ? String(data.mrpRupees)
              : data.mrpRupees.toFixed(2),
        );
      }
      router.refresh();
    } catch {
      setSubmitErr("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!slug) {
    return (
      <div className="flex border-t border-blackSecondary dark:bg-blackPrimary">
        <Sidebar />
        <p className="p-8 text-blackPrimary dark:text-whiteSecondary">
          Invalid product URL.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex border-t border-blackSecondary dark:bg-blackPrimary">
        <Sidebar />
        <p className="p-8 text-blackPrimary dark:text-whiteSecondary">
          Loading…
        </p>
      </div>
    );
  }

  if (loadErr) {
    return (
      <div className="flex border-t border-blackSecondary dark:bg-blackPrimary">
        <Sidebar />
        <div className="p-8">
          <p className="text-red-600 dark:text-red-400">{loadErr}</p>
          <Link to="/products" className="mt-4 inline-block text-sm underline">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-auto border-t border-blackSecondary bg-whiteSecondary dark:border-blackSecondary dark:bg-blackPrimary">
      <Sidebar />
      <div className="w-full">
        <div className="py-10">
          <div className="border-b border-gray-800 px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-blackPrimary dark:text-whiteSecondary">
              Edit product
            </h2>
            <p className="mt-2 pb-8 text-sm text-blackPrimary/80 dark:text-whiteSecondary/80">
              Base price plus optional per-size and per-variant list prices: final
              = base + (size list − base) + (variant list − base). Add stock for
              each combination.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8"
          >
            {submitErr ? (
              <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                {submitErr}
              </p>
            ) : null}

            <div className="flex flex-col gap-5">
              <InputWithLabel label="Product name *">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </InputWithLabel>

              <InputWithLabel label="Description *">
                <TextAreaInput
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </InputWithLabel>

              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                <InputWithLabel label="Default list price (₹) *">
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={priceRupees}
                    onChange={(e) => setPriceRupees(e.target.value)}
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-blackPrimary/60 dark:text-whiteSecondary/60">
                    Reference for add-on pricing; size and variant list prices
                    default to this when left blank in the rows below.
                  </p>
                </InputWithLabel>
                <InputWithLabel label="MRP (₹)">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={mrpRupees}
                    onChange={(e) => setMrpRupees(e.target.value)}
                    className={inputClass}
                    placeholder="Optional — shown struck through in shop"
                  />
                  <p className="mt-1 text-xs text-blackPrimary/60 dark:text-whiteSecondary/60">
                    Shown crossed out when above the selling price.
                  </p>
                </InputWithLabel>
              </div>

              <InputWithLabel label="Category">
                <SelectInput
                  selectList={categoryOptions}
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                />
              </InputWithLabel>

              <ProductInventoryFields
                sizeRows={sizeRows}
                setSizeRows={setSizeRows}
                variantRows={variantRows}
                setVariantRows={setVariantRows}
                stockMatrix={stockMatrix}
                setStockMatrix={setStockMatrix}
                unavailablePairs={unavailablePairs}
                setUnavailablePairs={setUnavailablePairs}
              />

              <label className="flex cursor-pointer items-center gap-3 text-sm text-blackPrimary dark:text-whiteSecondary">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="rounded border-gray-600"
                />
                Show in “Best sellers” rail on the homepage
              </label>

              <label className="flex cursor-pointer items-center gap-3 text-sm text-blackPrimary dark:text-whiteSecondary">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-gray-600"
                />
                Visible in the shop
              </label>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-blackPrimary px-6 py-2.5 text-sm font-semibold text-whiteSecondary dark:bg-whiteSecondary dark:text-blackPrimary disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <Link
                to="/products"
                className="text-sm font-medium text-blackPrimary/70 underline dark:text-whiteSecondary/80"
              >
                Back to products
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
