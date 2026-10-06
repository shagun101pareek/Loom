import { LandingCover } from "@/components/landing-cover";
import { PortfolioIntroTransition } from "@/components/portfolio-intro-transition";
import { SplitRevealTransition } from "@/components/split-reveal-transition";

export default function Home() {
  return (
    <PortfolioIntroTransition cover={<LandingCover />}>
      <SplitRevealTransition />
    </PortfolioIntroTransition>
  );
}
