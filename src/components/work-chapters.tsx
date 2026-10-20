"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { WhereIUsedToWork, WhereIWorkHero } from "@/components/where-i-work";

/**
 * Two full-viewport chapters stacked in one stage.
 * After the name doors open, wheel/touch slides the present page up
 * to reveal the past — no extra document height, no scrollbar.
 */
export function WorkChapters() {
  const stageRef = useRef<HTMLDivElement>(null);
  const presentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const present = presentRef.current;
    if (!stage || !present) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state = { p: 0 };
    let enabled = document.documentElement.dataset.split === "open";
    let touchY: number | null = null;
    let tween: gsap.core.Tween | undefined;
    let wheelLock = false;

    const apply = (progress: number, immediate = false) => {
      const next = Math.min(1, Math.max(0, progress));
      state.p = next;
      document.documentElement.dataset.work = next > 0.5 ? "past" : "present";
      present.setAttribute("aria-hidden", next > 0.5 ? "true" : "false");
      stage
        .querySelector(".work-chapter-past")
        ?.setAttribute("aria-hidden", next <= 0.5 ? "true" : "false");

      if (reduce) {
        gsap.set(present, { yPercent: next >= 0.5 ? -100 : 0 });
        return;
      }

      tween?.kill();
      if (immediate) {
        gsap.set(present, { yPercent: -100 * next, force3D: true });
        return;
      }

      wheelLock = true;
      tween = gsap.to(present, {
        yPercent: -100 * next,
        duration: 0.7,
        ease: "power3.inOut",
        force3D: true,
        overwrite: true,
        onComplete: () => {
          wheelLock = false;
        },
      });
    };

    apply(0, true);

    const onWheel = (event: WheelEvent) => {
      if (!enabled || wheelLock) return;
      if (Math.abs(event.deltaY) < 4) return;
      event.preventDefault();

      const goingDown = event.deltaY > 0;
      if (goingDown && state.p >= 1) return;
      if (!goingDown && state.p <= 0) return;
      apply(goingDown ? 1 : 0);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (!enabled) return;
      touchY = event.touches[0]?.clientY ?? null;
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!enabled || wheelLock || touchY == null) return;
      const y = event.changedTouches[0]?.clientY;
      if (y == null) return;
      const delta = touchY - y;
      touchY = null;
      if (Math.abs(delta) < 48) return;
      if (delta > 0 && state.p < 1) apply(1);
      if (delta < 0 && state.p > 0) apply(0);
    };

    const syncEnabled = () => {
      enabled = document.documentElement.dataset.split === "open";
      if (!enabled) {
        wheelLock = false;
        apply(0, true);
      }
    };

    const watch = new MutationObserver(syncEnabled);
    watch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-split"],
    });
    syncEnabled();

    window.addEventListener("wheel", onWheel, { passive: false });
    stage.addEventListener("touchstart", onTouchStart, { passive: true });
    stage.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      watch.disconnect();
      tween?.kill();
      window.removeEventListener("wheel", onWheel);
      stage.removeEventListener("touchstart", onTouchStart);
      stage.removeEventListener("touchend", onTouchEnd);
      delete document.documentElement.dataset.work;
    };
  }, []);

  return (
    <div ref={stageRef} className="work-stage">
      <div className="work-chapter-layer work-chapter-past" aria-hidden="true">
        <WhereIUsedToWork />
      </div>
      <div ref={presentRef} className="work-chapter-layer work-chapter-present">
        <WhereIWorkHero />
      </div>
    </div>
  );
}
