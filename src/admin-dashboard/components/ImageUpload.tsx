"use client";

import { useId, useState, type ChangeEvent } from "react";

const MAX_BYTES = 4 * 1024 * 1024;

const btnClass =
  "inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-600 bg-white px-3 py-2 text-sm font-medium text-blackPrimary transition hover:border-gray-500 dark:border-gray-500 dark:bg-blackPrimary dark:text-whiteSecondary";

const dropClass =
  "flex flex-col items-center justify-center w-full min-h-48 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer dark:bg-blackPrimary bg-whiteSecondary dark:hover:border-gray-600 hover:border-gray-500 p-4";

const swatchDropClass =
  "flex w-full min-h-[5.5rem] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-600 bg-whiteSecondary px-3 py-2 text-center text-sm text-blackPrimary transition hover:border-gray-500 dark:border-gray-500 dark:bg-blackPrimary dark:text-whiteSecondary dark:hover:border-gray-400";

type ImageUploadProps = {
  /** Stored Cloudinary (HTTPS) URL after a successful upload. */
  value: string;
  onChange: (cloudinaryUrl: string) => void;
  /** Narrow layout for variant swatch on one grid cell. */
  compact?: boolean;
  /**
   * With `compact`: full-width dashed upload zone (e.g. variant row below name/price).
   */
  swatchBlock?: boolean;
};

export default function ImageUpload({
  value,
  onChange,
  compact = false,
  swatchBlock = false,
}: ImageUploadProps) {
  const baseId = useId();
  const fileInputId = `${baseId}-file`;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is too large (max 4MB).");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error || "Upload failed.");
        return;
      }
      if (data.url) onChange(data.url);
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  if (compact && swatchBlock) {
    return (
      <div className="w-full min-w-0">
        {value ? (
          <div className="mb-2 flex w-full min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <img
                src={value}
                alt=""
                className="h-12 w-12 flex-shrink-0 rounded border border-gray-500 object-cover"
              />
              <span className="min-w-0 truncate text-xs text-blackPrimary/70 dark:text-whiteSecondary/60">
                Swatch image set
              </span>
            </div>
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-red-500 underline"
              onClick={() => onChange("")}
            >
              Clear
            </button>
          </div>
        ) : null}
        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFile}
          disabled={uploading}
          aria-label="Upload swatch image"
        />
        <label htmlFor={fileInputId} className={swatchDropClass}>
          <span className="font-medium">
            {uploading ? "Uploading…" : "Click to upload swatch"}
          </span>
          <span className="mt-0.5 block text-xs text-blackPrimary/70 dark:text-whiteSecondary/50">
            JPEG, PNG, WebP, GIF (max. 4MB) — stored on Cloudinary
          </span>
        </label>
        {error ? (
          <p className="mt-1 text-xs text-red-500" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="w-full min-w-0">
        <div className="mt-0 flex flex-wrap items-center gap-2">
          {value ? (
            <img
              src={value}
              alt=""
              className="h-10 w-10 flex-shrink-0 rounded border border-gray-500 object-cover"
            />
          ) : null}
          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFile}
            disabled={uploading}
            aria-label="Upload image"
          />
          <label htmlFor={fileInputId} className={btnClass}>
            {uploading ? "Uploading…" : "Upload"}
          </label>
          {value ? (
            <button
              type="button"
              className="text-xs font-medium text-red-500 underline"
              onClick={() => onChange("")}
            >
              Clear
            </button>
          ) : null}
        </div>
        {error ? (
          <p className="mt-1 text-xs text-red-500" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-2 w-full">
      {value ? (
        <div className="mb-3 flex items-start gap-3">
          <img
            src={value}
            alt=""
            className="h-32 max-w-full rounded-lg border border-gray-500 object-contain"
          />
          <button
            type="button"
            className="text-sm font-medium text-red-500 underline"
            onClick={() => onChange("")}
          >
            Remove
          </button>
        </div>
      ) : null}

      <label htmlFor={fileInputId} className={dropClass}>
        <div className="flex flex-col items-center justify-center py-2">
          <p className="mb-1 text-sm text-blackPrimary dark:text-whiteSecondary">
            <span className="font-semibold">Click to upload</span> an image
          </p>
          <p className="text-xs text-blackPrimary/80 dark:text-whiteSecondary/80">
            JPEG, PNG, WebP, GIF (max. 4MB) — stored on Cloudinary
          </p>
        </div>
        <input
          id={fileInputId}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFile}
          disabled={uploading}
        />
      </label>

      <p className="mt-2 text-center text-sm text-blackPrimary/80 dark:text-whiteSecondary/80">
        {uploading ? "Uploading…" : null}
      </p>

      {error ? (
        <p className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Part of variant form: URLs can be `https://…` (saved) or `blob:…` (local preview). */
export type VariantImageState = {
  imageUrl: string;
  imageUrl2: string;
  imageUrl3: string;
  imageFile1: File | null;
  imageFile2: File | null;
  imageFile3: File | null;
};

const thumbRemoveClass =
  "absolute -right-1.5 -top-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-base font-semibold leading-none text-black shadow transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400/80";

function shiftRemoveVariantImageState(
  v: VariantImageState,
  slot: 0 | 1 | 2,
): VariantImageState {
  const maybeRevoke = (url: string) => {
    if (url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  };
  if (slot === 0) {
    maybeRevoke(v.imageUrl);
    return {
      imageUrl: v.imageUrl2,
      imageUrl2: v.imageUrl3,
      imageUrl3: "",
      imageFile1: v.imageFile2,
      imageFile2: v.imageFile3,
      imageFile3: null,
    };
  }
  if (slot === 1) {
    maybeRevoke(v.imageUrl2);
    return {
      ...v,
      imageUrl2: v.imageUrl3,
      imageUrl3: "",
      imageFile2: v.imageFile3,
      imageFile3: null,
    };
  }
  maybeRevoke(v.imageUrl3);
  return { ...v, imageUrl3: "", imageFile3: null };
}

function addFileToNextSlot(v: VariantImageState, file: File): VariantImageState {
  const u = URL.createObjectURL(file);
  if (!v.imageUrl.trim()) {
    return { ...v, imageUrl: u, imageFile1: file };
  }
  if (!v.imageUrl2.trim()) {
    return { ...v, imageUrl2: u, imageFile2: file };
  }
  if (!v.imageUrl3.trim()) {
    return { ...v, imageUrl3: u, imageFile3: file };
  }
  return v;
}

/**
 * Up to 3 images: local previews (no Cloudinary) until the product is saved.
 * Thumbnail row (with red circular remove) above the same full-size dashed
 * upload square as the main ImageUpload (non-compact).
 */
export function VariantMultiImageUpload({
  value,
  onChange,
}: {
  value: VariantImageState;
  onChange: (next: VariantImageState) => void;
}) {
  const baseId = useId();
  const fileInputId = `${baseId}-variant-multi`;
  const [error, setError] = useState<string | null>(null);

  const ordered = [value.imageUrl, value.imageUrl2, value.imageUrl3].map(
    (url, i) => ({ url: url.trim(), slot: i as 0 | 1 | 2 }),
  );
  const filled = ordered.filter((o) => o.url);

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (filled.length >= 3) return;
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File is too large (max 4MB).");
      return;
    }
    const next = addFileToNextSlot(value, file);
    if (next === value) return;
    onChange(next);
  }

  return (
    <div className="w-full min-w-0">
      {filled.length > 0 ? (
        <ul className="mb-3 flex flex-wrap items-start gap-3">
          {filled.map(({ url, slot }) => (
            <li key={`${slot}-${url}`} className="relative flex-shrink-0">
              <img
                src={url}
                alt=""
                className="h-24 w-24 rounded-lg border border-gray-500 object-cover sm:h-28 sm:w-28"
              />
              <button
                type="button"
                className={thumbRemoveClass}
                onClick={() => onChange(shiftRemoveVariantImageState(value, slot))}
                aria-label="Remove this image"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {filled.length < 3 ? (
        <>
          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFile}
            aria-label="Add option image"
          />
          <label htmlFor={fileInputId} className={dropClass}>
            <div className="flex flex-col items-center justify-center py-2">
              <p className="mb-1 text-sm text-blackPrimary dark:text-whiteSecondary">
                <span className="font-semibold">Choose</span> an image
              </p>
              <p className="text-xs text-blackPrimary/80 dark:text-whiteSecondary/80">
                JPEG, PNG, WebP, GIF (max. 4MB) — shown above; they upload to
                Cloudinary when you save the product
              </p>
            </div>
          </label>
        </>
      ) : null}

      {error ? (
        <p className="mt-2 text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
