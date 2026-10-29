import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function FeatureSection({
  eyebrow,
  title,
  body,
  demo,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  demo: ReactNode;
  reverse?: boolean;
}) {
  return (
    <section className="px-6 py-14 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <div className={cn(reverse && "md:order-2")}>
            <p className="text-sm font-medium tracking-[0.2em] text-amber-700 uppercase dark:text-amber-300">
              {eyebrow}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance text-foreground md:text-4xl">
              {title}
            </h2>
            <p className="mt-5 text-base leading-relaxed text-pretty text-muted-foreground md:text-lg">
              {body}
            </p>
          </div>
          <div className={cn(reverse && "md:order-1")}>{demo}</div>
        </div>
      </div>
    </section>
  );
}
