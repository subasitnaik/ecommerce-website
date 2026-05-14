"use client";

import { useId, useState } from "react";

type Item = { q: string; a: string };

export function HomeFaqAccordion({ items, title = "FAQ" }: { items: readonly Item[]; title?: string }) {
  const baseId = useId();
  const [open, setOpen] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <section className="w-full border-t border-white/10 bg-black text-white">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <h2 className="text-center text-lg font-bold tracking-tight sm:text-xl">{title}</h2>
        <ul className="mt-8 space-y-0">
          {items.map((item, i) => {
            const isOpen = open === i;
            const id = `${baseId}-panel-${i}`;
            const hId = `${baseId}-h-${i}`;
            return (
              <li key={i} className="border-b border-white/10 last:border-0">
                <button
                  type="button"
                  id={hId}
                  aria-controls={id}
                  aria-expanded={isOpen}
                  onClick={() => setOpen((o) => (o === i ? null : i))}
                  className="flex w-full items-center justify-between gap-3 py-4 text-left text-sm font-medium leading-snug text-white/95 sm:text-base"
                >
                  <span>{item.q}</span>
                  <span
                    className="shrink-0 text-lg leading-none text-white/50 transition"
                    aria-hidden
                  >
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                <div
                  id={id}
                  role="region"
                  aria-labelledby={hId}
                  className={isOpen ? "block" : "hidden"}
                >
                  <p className="pb-4 text-sm leading-relaxed text-white/70 sm:text-[0.95rem]">{item.a}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
