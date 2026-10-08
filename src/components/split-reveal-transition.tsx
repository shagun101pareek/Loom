"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LandingHero } from "@/components/landing-hero";
import { WhereIWorkHero, WhereIWorkRest } from "@/components/where-i-work";

gsap.registerPlugin(ScrollTrigger);

/**
 * After the girl animation, scroll opens the landing page from the centre.
 * The extra viewport of the track is the scroll that drives the halves.
 * Once they have fully opened, scrolling back up leaves them open.
 */
export function SplitRevealTransition() {
  const trackRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const left = leftRef.current;
    const right = rightRef.current;
    if (!track || !left || !right) return;

    const syncViewport = () => {
      document.documentElement.style.setProperty("--split-vh", `${window.innerHeight}px`);
    };

    syncViewport();

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let ctx: gsap.Context | undefined;
    let settled = false;

    const applyOpen = (progress: number) => {
      const opened = Math.min(1, Math.max(0, progress));
      if (opened <= 0) {
        gsap.set([left, right], { clearProps: "transform" });
        return;
      }
      gsap.set(left, { xPercent: -100 * opened, force3D: true });
      gsap.set(right, { xPercent: 100 * opened, force3D: true });
    };

    const setup = () => {
      if (ctx) return;
      // Overflow unlocks with data-intro="done". Measure after that reflow.
      void document.documentElement.offsetHeight;
      syncViewport();
      window.scrollTo(0, 0);
      applyOpen(0);

      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: track,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            const travelled = Math.max(1, track.offsetHeight - window.innerHeight);
            if (!settled && window.scrollY >= travelled - 1) settled = true;
            if (settled) {
              applyOpen(1);
              return;
            }
            applyOpen(window.scrollY <= 0 ? 0 : self.progress);
          },
        });
      }, track);

      ScrollTrigger.refresh();
      applyOpen(0);
    };

    const onIntro = () => {
      syncViewport();
      if (document.documentElement.dataset.intro === "done") setup();
    };
    const introWatch = new MutationObserver(onIntro);
    introWatch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-intro"],
    });
    onIntro();

    const onResize = () => {
      syncViewport();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);

    return () => {
      introWatch.disconnect();
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      ctx?.revert();
    };
  }, []);

  return (
    <>
      <div className="landing-fallback">
        <LandingHero settle={false} />
      </div>

      <section className="split-section bg-[#f3f0ea]" aria-label="Where I Work">
        <div ref={trackRef} className="split-track">
          <div className="split-sticky">
            <div className="split-under">
              <WhereIWorkHero />
            </div>

            <div ref={leftRef} className="split-panel split-panel-left">
              <div className="split-panel-sheet">
                <LandingHero />
              </div>
            </div>

            <div ref={rightRef} className="split-panel split-panel-right" aria-hidden="true">
              <div className="split-panel-sheet">
                <LandingHero />
              </div>
            </div>
          </div>
        </div>

        <WhereIWorkRest />
      </section>

      <noscript>
        <style>
          {`.split-panel{display:none}.split-track{height:auto!important}.split-sticky{position:relative;height:auto;overflow:visible}.split-under{position:relative;inset:auto}.landing-fallback{display:flex}`}
        </style>
      </noscript>
    </>
  );
}
