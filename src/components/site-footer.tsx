import Link from "next/link";
import { siteConfig } from "@/config";

const policies = [
  { label: "Privacy policy", href: "#" },
  { label: "Refund policy", href: "#" },
  { label: "Shipping policy", href: "#" },
  { label: "Contact us", href: `mailto:${siteConfig.contact.email}` },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-neutral-900/10">
      <div className="bg-black text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-sm font-bold tracking-tight">{siteConfig.name}</p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">{siteConfig.tagline}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">Policies</p>
              <ul className="mt-3 space-y-2 text-sm text-white/85">
                {policies.map((p) => (
                  <li key={p.label}>
                    {p.href.startsWith("mailto:") ? (
                      <a
                        href={p.href}
                        className="transition hover:text-white"
                      >
                        {p.label}
                      </a>
                    ) : (
                      <Link
                        href={p.href}
                        className="transition hover:text-white"
                      >
                        {p.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 bg-neutral-900 py-3 text-center text-xs text-white/50">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
