"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ImageUpload,
  InputWithLabel,
  Sidebar,
} from "../components";
import { AdminLink as Link } from "@/admin-dashboard/navigation/AdminLink";
import { HiOutlineChevronRight } from "react-icons/hi";

const inputClass =
  "mt-1 w-full rounded-lg border border-gray-600 bg-white px-3 py-2.5 text-sm text-blackPrimary outline-none dark:bg-blackPrimary dark:text-whiteSecondary";

export default function CreateCategory() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitErr(null);
    setSaving(true);
    const n = name.trim();
    if (!n) {
      setSubmitErr("Enter a category name.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: n,
          slug: slug.trim() || undefined,
          imageUrl: imageUrl.trim() || null,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        slug?: string;
      };
      if (!res.ok) {
        setSubmitErr(data.error ?? "Could not create category.");
        setSaving(false);
        return;
      }
      router.push("/admin/categories");
      router.refresh();
    } catch {
      setSubmitErr("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-auto min-w-0 border-t border-blackSecondary bg-whiteSecondary dark:border-blackSecondary dark:bg-blackPrimary">
      <Sidebar />
      <div className="w-full min-w-0">
        <div className="py-10">
          <div className="border-b border-gray-800 px-4 pb-8 sm:px-6 lg:px-8">
            <div className="flex min-w-0 flex-col gap-2 sm:gap-3">
              <h2 className="text-3xl font-bold text-blackPrimary dark:text-whiteSecondary">
                Add category
              </h2>
              <p className="flex flex-wrap items-center gap-1 text-base text-blackPrimary dark:text-whiteSecondary">
                <Link
                  to="/"
                  className="hover:underline"
                >
                  Dashboard
                </Link>
                <HiOutlineChevronRight className="inline shrink-0 text-lg" />
                <Link
                  to="/categories"
                  className="hover:underline"
                >
                  Categories
                </Link>
                <HiOutlineChevronRight className="inline shrink-0 text-lg" />
                <span>Add category</span>
              </p>
            </div>
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

            <div className="flex flex-col gap-6">
              <InputWithLabel label="Category name *">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Bags, Electronics"
                />
              </InputWithLabel>

              <InputWithLabel label="URL slug (optional)">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className={inputClass}
                  placeholder="Leave blank to auto-fill from name (e.g. bags-electronics)"
                  autoComplete="off"
                />
              </InputWithLabel>

              <div>
                <p className="text-sm font-semibold text-blackPrimary dark:text-whiteSecondary">
                  Image
                </p>
                <p className="mt-0.5 text-xs text-blackPrimary/75 dark:text-whiteSecondary/75">
                  Optional. Used in navigation and category browsing.
                </p>
                <div className="mt-2">
                  <ImageUpload value={imageUrl} onChange={setImageUrl} />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-blackPrimary px-6 py-2.5 text-sm font-semibold text-whiteSecondary disabled:opacity-50 dark:bg-whiteSecondary dark:text-blackPrimary"
              >
                {saving ? "Saving…" : "Add category"}
              </button>
              <Link
                to="/categories"
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
