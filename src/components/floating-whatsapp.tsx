import { SiWhatsapp } from "react-icons/si";
import { siteConfig } from "@/config";

export function FloatingWhatsapp() {
  const n = siteConfig.contact.whatsapp;
  if (!n) return null;

  const href = `https://wa.me/${n}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-[55] flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900 text-white shadow-lg transition hover:scale-105 hover:bg-neutral-800 hover:shadow-xl dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
      aria-label="Chat on WhatsApp"
    >
      <SiWhatsapp className="h-6 w-6" aria-hidden />
    </a>
  );
}
