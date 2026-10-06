/** First screen, held still behind the splitting page. */
export function WhereIWorkHero() {
  return (
    <div className="where-hero flex h-full w-full flex-col items-center justify-center bg-[#f3f0ea] px-6 text-center text-[#171717]">
      <h2 className="text-[clamp(3.75rem,10vw,8.5rem)] leading-[0.88] tracking-[-0.055em]">
        <span className="block font-light">Where</span>
        <span className="block font-medium">I Work</span>
      </h2>
    </div>
  );
}

/** Continues in normal document flow once the doors have opened. */
export function WhereIWorkRest() {
  return (
    <div className="bg-[#f3f0ea] px-6 pb-32 text-[#171717] md:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 border-t border-[#171717]/10 pt-16 md:pt-24">
        <p className="max-w-md text-lg font-light leading-relaxed tracking-[-0.02em] text-[#171717]/75">
          The work, kept with the places it was made.
        </p>
        <a
          href="/work/example"
          className="w-fit text-sm uppercase tracking-[0.22em] underline decoration-[#171717]/25 underline-offset-8"
        >
          Example project
        </a>
      </div>
    </div>
  );
}
