"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InputWithLabel, Sidebar } from "../components";
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

const defaultSizeRows: SizeFormRow[] = ["S", "M", "L", "XL"].map((label) => ({
  label,
  priceRupees: "",
}));
const defaultVariant: VariantFormRow = {
  label: "Default",
  imageUrl: "",
  imageUrl2: "",
  imageUrl3: "",
  imageFile1: null,
  imageFile2: null,
  imageFile3: null,
  priceRupees: "",
};

export default function CreateProduct() {
  const router = useRouter();
  const [categories, setCategories] = useState<Cat[]>([]);
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
  const [sizeRows, setSizeRows] = useState<SizeFormRow[]>([...defaultSizeRows]);
  const [variantRows, setVariantRows] = useState<VariantFormRow[]>([
    { ...defaultVariant },
  ]);
  const [stockMatrix, setStockMatrix] = useState<number[][]>(() =>
    ensureMatrix(1, defaultSizeRows.length, []),
  );
  const [unavailablePairs, setUnavailablePairs] = useState<UnavailablePairForm[]>(
    [],
  );

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

  const loadCategories = useCallback(async () => {
    setLoadErr(null);
    try {
      const res = await fetch("/api/admin/categories");
      const data = (await res.json()) as { categories?: Cat[]; error?: string };
      if (!res.ok) {
        setLoadErr(data.error ?? "Could not load categories.");
        return;
      }
      setCategories(data.categories ?? []);
    } catch {
      setLoadErr("Could not load categories.");
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const categoryOptions = [
    { value: "", label: "No category" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitErr(null);
    setSaving(true);
    const price = parseFloat(priceRupees.replace(/,/g, ""));
    if (Number.isNaN(price) || price <= 0) {
      setSubmitErr("Enter a valid price in rupees.");
      setSaving(false);
      return;
    }

    const mrpTrim = mrpRupees.trim();
    let mrpPayload: number | null = null;
    if (mrpTrim !== "") {
      const m = parseFloat(mrpTrim.replace(/,/g, ""));
      if (Number.isNaN(m) || m < 0) {
        setSubmitErr("MRP must be a valid number ≥ 0, or leave blank.");
        setSaving(false);
        return;
      }
      mrpPayload = m;
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
      setSubmitErr("Add at least one variant row (one row is enough for a single option).");
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
      const res = await fetch("/api/admin/products", {
        method: "POST",
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
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: { fieldErrors?: Record<string, string[]> };
        slug?: string;
      };
      if (!res.ok) {
        const z =
          data.details?.fieldErrors &&
          Object.values(data.details.fieldErrors).flat()[0];
        setSubmitErr(z ?? data.error ?? "Could not create product.");
        setSaving(false);
        return;
      }
      if (data.slug) {
        router.push(`/admin/products/${encodeURIComponent(data.slug)}`);
      } else {
        router.push("/admin/products");
      }
      router.refresh();
    } catch {
      setSubmitErr("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-auto border-t border-blackSecondary bg-whiteSecondary dark:border-blackSecondary dark:bg-blackPrimary">
      <Sidebar />
      <div className="w-full">
        <div className="py-10">
          <div className="border-b border-gray-800 px-4 pb-8 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-blackPrimary dark:text-whiteSecondary">
              Add product
            </h2>
          </div>

          <form
            onSubmit={onSubmit}
            className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8"
          >
            {loadErr ? (
              <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
                {loadErr} You can still create a product without a category.
              </p>
            ) : null}
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
                  placeholder="e.g. Cotton tote bag"
                />
              </InputWithLabel>

              <InputWithLabel label="Description *">
                <TextAreaInput
                  required
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What it is, size, or how to use it — shown on the product page."
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
                    placeholder="e.g. 499 or 199.50"
                  />
                </InputWithLabel>
                <InputWithLabel label="MRP (₹)">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={mrpRupees}
                    onChange={(e) => setMrpRupees(e.target.value)}
                    className={inputClass}
                    placeholder="Optional"
                  />
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
                hideSectionHelpText
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
                Visible in the shop (turn off to hide)
              </label>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-blackPrimary px-6 py-2.5 text-sm font-semibold text-whiteSecondary dark:bg-whiteSecondary dark:text-blackPrimary disabled:opacity-50"
              >
                {saving ? "Saving…" : "Add product"}
              </button>
              <Link
                to="/products"
                className="text-sm font-medium text-blackPrimary/70 underline dark:text-whiteSecondary/80"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
