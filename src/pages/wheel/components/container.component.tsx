import type { JSX, RefObject } from "react";

export default function Container({
  containerRef,
  renderedItems,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  renderedItems: JSX.Element | null;
}) {
  return (
    <section className="max-w-full w-2xl flex items-center justify-center mx-auto">
      <div className="relative w-full h-48 border-2 border-primary rounded overflow-hidden bg-card/50">
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-primary z-10" />
        <div
          ref={containerRef}
          className="flex items-center h-full will-change-transform"
        >
          {renderedItems}
        </div>
      </div>
    </section>
  );
}
