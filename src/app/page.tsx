import { LandingCover } from "@/components/landing-cover";
import { PortfolioIntroTransition } from "@/components/portfolio-intro-transition";

export default function Home() {
  return (
    <PortfolioIntroTransition cover={<LandingCover />}>
      <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center text-[#171717]">
        <h1
          data-intro-name=""
          className="text-[clamp(3.75rem,10vw,8.5rem)] leading-[0.88] tracking-[-0.055em] text-foreground"
        >
          <span className="block font-medium">Shagun</span>
          <span className="block font-light">Pareek</span>
        </h1>
      </main>
    </PortfolioIntroTransition>
  );
}
