import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

type PageBandProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  /** Page content; it starts on the band and overlaps its lower edge. */
  children: ReactNode;
  className?: string;
};

/** Page opening of direction A: a navy band with the title, then content raised over its edge. */
export function PageBand({ title, description, eyebrow, children, className }: PageBandProps) {
  return (
    <>
      <section className="bg-navy-grid text-white">
        <Container className="flex flex-col gap-3 pt-14 pb-28">
          {eyebrow ? <p className="text-sm font-medium text-gold-soft">{eyebrow}</p> : null}
          <h1 className="text-4xl font-bold sm:text-5xl">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-lg text-on-navy-muted">{description}</p>
          ) : null}
        </Container>
      </section>
      <Container className={cn("-mt-18 flex flex-col gap-8 pb-20", className)}>
        {children}
      </Container>
    </>
  );
}
