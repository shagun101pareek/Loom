type LandingHeroProps = {
  /** The live intro settles these names. Decorative copies stay still. */
  settle?: boolean;
};

/** The page she pushes open. Both split halves paint this same frame. */
export function LandingHero({ settle = true }: LandingHeroProps) {
  return (
    <div className="landing-hero relative h-full min-h-full w-full bg-white text-[#171717]">
      <div className="flex h-full min-h-full w-full flex-col items-center justify-center px-6 text-center">
        <h1
          {...(settle ? { "data-intro-name": "" } : {})}
          className="landing-name text-foreground"
        >
          <span className="block">Shagun</span>
          <span className="block">Pareek</span>
        </h1>
      </div>
    </div>
  );
}
