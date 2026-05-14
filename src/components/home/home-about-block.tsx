import { siteConfig } from "@/config";

type Props = {
  title: string;
  body: string;
};

export function HomeAboutBlock({ title, body }: Props) {
  return (
    <section className="w-full border-b border-black/5 bg-white">
      <div className="mx-auto max-w-2xl px-4 py-10 text-justify sm:px-6 sm:py-12 lg:px-8">
        <h2 className="text-center text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
          {title}
        </h2>
        <p className="mt-5 text-sm leading-[1.75] text-neutral-700 sm:text-base">{body}</p>
        <p className="mt-4 text-sm leading-[1.75] text-neutral-700 sm:text-base">
          {siteConfig.description}
        </p>
      </div>
    </section>
  );
}
