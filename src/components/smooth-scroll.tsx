"use client";

import { useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const lenis = new Lenis({
      autoRaf: false,
      anchors: true,
    });

    const onScroll = () => {
      ScrollTrigger.update();
    };

    lenis.on("scroll", onScroll);

    // The intro sets data-intro="playing" and needs the page locked underneath.
    const syncIntroLock = () => {
      if (document.documentElement.dataset.intro === "playing") {
        lenis.stop();
        return;
      }
      window.scrollTo(0, 0);
      lenis.scrollTo(0, { immediate: true, force: true });
      lenis.start();
    };
    syncIntroLock();

    const introLock = new MutationObserver(syncIntroLock);
    introLock.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-intro"],
    });

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      introLock.disconnect();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return children;
}
