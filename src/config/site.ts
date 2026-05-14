/**
 * Brand & marketing copy — safe to commit. No secrets here.
 * For production, set NEXT_PUBLIC_SITE_URL on your host (e.g. Vercel).
 * Optional: `NEXT_PUBLIC_WHATSAPP_E164` for the floating WhatsApp button (digits only, e.g. 919876543210).
 */
const contactWhatsapp =
  process.env.NEXT_PUBLIC_WHATSAPP_E164?.replace(/\D/g, "") ?? "";

export const siteConfig = {
  name: "MOONSTACK",
  tagline: "Street & everyday wear — clothes only.",
  description:
    "Independent clothing label. Tees, hoodies, and essentials with bold graphics and a clean fit.",
  locale: "en-IN",
  currency: "INR" as const,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contact: {
    email: "hello@example.com",
    whatsapp: contactWhatsapp,
  },
  home: {
    aboutTitle: "About us",
    about: `We are a dedicated clothing brand — we sell apparel and nothing else. Every drop is cut and printed with the same care we put into the graphics you wear. Fit, fabric, and message come first. Shop small batches, own something that reads like you.`,
    faq: [
      {
        q: "What do you sell?",
        a: "Only clothing: tees, sweats, hoodies, and related apparel. We do not sell accessories or unrelated categories.",
      },
      {
        q: "How do I track my order?",
        a: "After checkout you will get a confirmation email. When the order ships, you will receive tracking details there as well. You can also write to us at the address in the footer.",
      },
      {
        q: "What is your return policy?",
        a: "Unworn items in original condition can be returned within the window listed in our Refund policy. We will issue a refund or store credit after inspection.",
      },
      {
        q: "How long does shipping take?",
        a: "Domestic orders usually ship within a few business days. Exact timelines depend on your location and the carrier — see Shipping policy for more.",
      },
    ] as const,
  },
  theme: {
    /** Neutral — storefront uses black/white/gray only */
    primary: "#171717",
    accent: "#525252",
  },
} as const;
