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

    // Lock while the girl plays or Where I Work is open; unlock on the name page.
    const syncScrollLock = () => {
      const intro = document.documentElement.dataset.intro;
      const split = document.documentElement.dataset.split;
      if (intro === "playing" || split === "open") {
        lenis.stop();
        return;
      }
      if (intro === "done" || intro === "reduced") {
        window.scrollTo(0, 0);
        lenis.scrollTo(0, { immediate: true, force: true });
      }
      lenis.start();
    };
    syncScrollLock();

    const scrollLock = new MutationObserver(syncScrollLock);
    scrollLock.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-intro", "data-split"],
    });

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      scrollLock.disconnect();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return children;
}
