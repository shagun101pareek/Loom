import Link from "next/link";
import { Fraunces } from "next/font/google";
import { ScreenPushTransition } from "@/components/screen-push-transition";

const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

function LandingCover() {
  return (
    <div className="relative flex h-full w-full flex-col justify-between bg-[#1c1916] px-6 py-7 text-[#f3efe7] sm:px-10 sm:py-9 lg:px-14 lg:py-12">
      <div className="pointer-events-none absolute inset-5 border border-[#f3efe7]/12 sm:inset-7 lg:inset-9" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_42%,rgba(0,0,0,0.38)_100%)]" />
      <header className="relative flex items-center justify-between text-[11px] uppercase tracking-[0.34em]">
        <span>Loom</span>
        <span className="text-[#c6b79a]">2026</span>
      </header>
      <div className="relative max-w-xl">
        <p className="text-[11px] uppercase tracking-[0.32em] text-[#c6b79a]">Volume 01</p>
        <p className="font-display mt-4 text-[clamp(3.4rem,7vw,6.75rem)] leading-[0.88] tracking-[-0.04em]">
          Portfolio
        </p>
      </div>
      <footer className="relative flex items-center justify-between text-[11px] uppercase tracking-[0.28em] text-[#f3efe7]/60">
        <span>Index</span>
        <span>01</span>
      </footer>
    </div>
  );
}

function NamePage() {
  return (
    <section className="flex min-h-[100dvh] flex-col bg-[#f3efe7] px-6 py-7 text-[#1c1916] sm:px-10 sm:py-9 lg:px-14 lg:py-12">
      <header className="flex items-center justify-between text-[11px] uppercase tracking-[0.34em] text-[#6f675e]">
        <span>Loom</span>
        <span>Portfolio</span>
      </header>
      <div className="flex flex-1 flex-col justify-center">
        <h1
          data-screen-push-name
          className="py-3 font-display text-[clamp(4.25rem,12vw,10rem)] leading-[0.84] tracking-[-0.045em]"
        >
          Shagun
          <br />
          Pareek
        </h1>
      </div>
      <footer className="flex items-center justify-between border-t border-[#1c1916]/10 pt-6 text-[11px] uppercase tracking-[0.28em] text-[#6f675e]">
        <span>Index</span>
        <Link href="/work/example" className="text-[#1c1916] transition-opacity hover:opacity-55">
          Work
        </Link>
      </footer>
    </section>
  );
}

export default function Home() {
  return (
    <div className={display.variable}>
      <ScreenPushTransition screen={<LandingCover />} next={<NamePage />} />
    </div>
  );
}
