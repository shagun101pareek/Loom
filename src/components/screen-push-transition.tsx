"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { poseWalker, WalkingFigure } from "@/components/walking-figure";

/**
 * One timeline drives the whole opening. The screen position is derived from
 * the character position, so the sheet reads as something she is pushing.
 *
 * duration — seconds for the whole opening. Shorter is faster.
 * character.fromVw / toVw — start and end translate.
 * character.pushStartVw — viewport position (vw) where the sheet starts to give.
 * screen.give — how much the sheet accelerates ahead of her hand once it yields.
 *   0 keeps the edge locked to her. screen.releaseVw is how far the contact
 *   point travels before the sheet has left.
 * screen.skew / rotateY / scale / bulge — deformation while she is braced.
 *   These are softened automatically below 1100px and 760px.
 * The struggle is pushPath / strainAt / heaveAt below: she pushes, the sheet
 * stalls, she heaves harder, then it gives.
 * name.at — when the name starts, as a fraction of the duration.
 * name.duration / name.rise — the opacity, rise, and clip reveal.
 *
 * Disable the sequence with `<ScreenPushTransition enabled={false} />`.
 * `prefers-reduced-motion: reduce` always skips it.
 * Add `?hold=0.44` to freeze a moment (0 start, 1 finished).
 * 0.44 is the stall, 0.62 is the harder shove.
 */
export const SCREEN_PUSH = {
  duration: 5.6,
  character: {
    fromVw: -120,
    toVw: 158,
    contactRatio: 0.9,
    pushStartVw: 2,
  },
  screen: {
    give: 0,
    releaseVw: 76,
    skew: -4.5,
    rotateY: -3.5,
    scale: 0.028,
    bulge: 2.8,
  },
  name: {
    at: 0.82,
    duration: 1.15,
    rise: 28,
  },
} as const;

type Deform = {
  skew: number;
  rotateY: number;
  scale: number;
  bulge: number;
  give: number;
};

function deformation(viewportWidth: number): Deform {
  const { screen } = SCREEN_PUSH;
  if (viewportWidth < 760) {
    return { skew: -1.1, rotateY: 0, scale: 0.01, bulge: 0, give: screen.give };
  }
  if (viewportWidth < 1100) {
    return {
      skew: -2.6,
      rotateY: -1.8,
      scale: 0.016,
      bulge: 1.2,
      give: screen.give,
    };
  }
  return {
    skew: screen.skew,
    rotateY: screen.rotateY,
    scale: screen.scale,
    bulge: screen.bulge,
    give: screen.give,
  };
}

function smoothstep(time: number) {
  const x = gsap.utils.clamp(0, 1, time);
  return x * x * (3 - 2 * x);
}

/**
 * Where she is along the travel, from clock time.
 * The flat stretch is the stall. The steep stretch after it is the harder shove.
 */
function pushPath(time: number) {
  const keys: Array<{ t: number; p: number; ease?: "smooth" | "shove" | "release" }> = [
    { t: 0, p: 0 },
    { t: 0.18, p: 0.2, ease: "smooth" },
    { t: 0.32, p: 0.38, ease: "smooth" },
    { t: 0.52, p: 0.42, ease: "smooth" },
    { t: 0.72, p: 0.78, ease: "shove" },
    { t: 1, p: 1, ease: "release" },
  ];
  const t = gsap.utils.clamp(0, 1, time);
  for (let index = 1; index < keys.length; index++) {
    const from = keys[index - 1];
    const to = keys[index];
    if (t > to.t) continue;
    const u = (t - from.t) / (to.t - from.t);
    return from.p + (to.p - from.p) * segmentEase(to.ease ?? "smooth", u);
  }
  return 1;
}

function segmentEase(kind: "smooth" | "shove" | "release", amount: number) {
  const u = gsap.utils.clamp(0, 1, amount);
  if (kind === "shove") return u ** 2.15;
  if (kind === "release") return 1 - (1 - u) ** 1.7;
  return u * u * (3 - 2 * u);
}

/** How hard she is bracing. Holds through the stall, then lets go as the sheet gives. */
function strainAt(time: number) {
  const t = gsap.utils.clamp(0, 1, time);
  if (t < 0.16) return 0;
  if (t < 0.32) return smoothstep((t - 0.16) / 0.16) * 0.42;
  if (t < 0.46) return 0.42 + smoothstep((t - 0.32) / 0.1) * 0.58;
  if (t < 0.7) return 1;
  if (t < 0.86) return 1 - smoothstep((t - 0.7) / 0.16) * 0.75;
  return Math.max(0, 0.25 * (1 - smoothstep((t - 0.86) / 0.1)));
}

/** 0 before her hands are on the sheet, 1 while she is pushing, then a release. */
function pushAt(time: number) {
  const t = gsap.utils.clamp(0, 1, time);
  const planted = smoothstep((t - 0.14) / 0.1);
  const finished = smoothstep((t - 0.84) / 0.1);
  return planted * (1 - finished);
}

/** Two grunts. The second is larger and lands as the stall breaks. */
function heaveAt(time: number) {
  const trying = grunt(time, 0.34, 0.12) * 0.7;
  const harder = grunt(time, 0.48, 0.14);
  return Math.min(1, trying + harder);
}

function grunt(time: number, start: number, length: number) {
  const u = (time - start) / length;
  if (u <= 0 || u >= 1) return 0;
  if (u < 0.28) return u / 0.28;
  return (1 - (u - 0.28) / 0.72) ** 1.4;
}

let introConsumed = false;
let consumeTimer: ReturnType<typeof setTimeout> | null = null;

type ScreenPushTransitionProps = {
  /** When false, the next page is shown immediately. */
  enabled?: boolean;
  /** Full-viewport surface the character pushes away. */
  screen: ReactNode;
  /**
   * Page revealed underneath.
   * Put `data-screen-push-name` on the name so it can ease in late.
   */
  next: ReactNode;
};

export function ScreenPushTransition({
  enabled = true,
  screen,
  next,
}: ScreenPushTransitionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const characterRef = useRef<HTMLDivElement>(null);
  const distortionRef = useRef<HTMLDivElement>(null);
  const [settled, setSettled] = useState(false);

  useLayoutEffect(() => {
    if (consumeTimer) {
      clearTimeout(consumeTimer);
      consumeTimer = null;
    }

    const root = rootRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!root || !enabled || reduceMotion || introConsumed) {
      introConsumed = true;
      setSettled(true);
      return;
    }

    const screenEl = screenRef.current;
    const characterEl = characterRef.current;
    const distortionEl = distortionRef.current;
    if (!screenEl || !characterEl || !distortionEl) return;

    const nameEl = root.querySelector<HTMLElement>("[data-screen-push-name]");
    let charWidthVw = 32;
    let reachOffsetVw = 24;
    let palmLocked = false;
    let viewportWidth = window.innerWidth;
    let clipped = false;
    let started = false;
    let active = true;
    let ctx: gsap.Context | null = null;

    const measure = () => {
      viewportWidth = window.innerWidth;
      const width = characterEl.offsetWidth;
      if (width > 0) charWidthVw = (width / viewportWidth) * 100;
    };

    const paintName = (progress: number) => {
      if (!nameEl) return;
      if (progress >= SCREEN_PUSH.name.at) {
        gsap.set(nameEl, {
          opacity: 1,
          y: 0,
          clipPath: "inset(0% 0% 0% 0%)",
        });
        return;
      }
      gsap.set(nameEl, {
        opacity: 0,
        y: SCREEN_PUSH.name.rise,
        clipPath: "inset(100% 0% 0% 0%)",
      });
    };

    const apply = (time: number) => {
      const deform = deformation(viewportWidth);
      const { character, screen: sheet } = SCREEN_PUSH;
      const space = pushPath(time);
      const push = pushAt(time);
      const strain = strainAt(time);
      const heave = heaveAt(time);
      const charX = character.fromVw + (character.toVw - character.fromVw) * space;
      const creeping = space - pushPath(Math.max(0, time - 0.03)) < 0.012;

      gsap.set(characterEl, {
        x: `${charX}vw`,
        force3D: true,
      });
      poseWalker(characterEl, push, strain, heave);

      const hand = characterEl.querySelector("[data-walk='hand']");
      const handRect = hand?.getBoundingClientRect();
      if (handRect && push > 0.92 && handRect.width > 0 && (!creeping || !palmLocked)) {
        const palm = (handRect.left + handRect.width * 0.92) / viewportWidth * 100;
        reachOffsetVw = palm - charX;
        palmLocked = true;
      }
      const contact = charX + (reachOffsetVw || charWidthVw * character.contactRatio);
      const traveled = Math.max(0, contact - character.pushStartVw);
      const release = gsap.utils.clamp(0, 1, traveled / sheet.releaseVw);
      const visualLeft = traveled * (1 + deform.give * release);
      const wave = Math.sin(release * Math.PI);
      const flex = gsap.utils.clamp(0, 1.25, wave * (0.4 + 0.6 * strain) + heave * 0.45);

      gsap.set(screenEl, {
        x: `${visualLeft}vw`,
        skewX: deform.skew * flex,
        rotateY: deform.rotateY * flex,
        scaleX: 1 + deform.scale * flex,
        transformOrigin: "left center",
        force3D: true,
      });

      if (deform.bulge > 0 && flex > 0.02) {
        clipped = true;
        const dent = (deform.bulge * flex).toFixed(2);
        gsap.set(screenEl, {
          clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 66%, ${dent}% 50%, 0% 34%)`,
        });
      } else if (clipped) {
        clipped = false;
        gsap.set(screenEl, { clearProps: "clipPath" });
      }

      gsap.set(distortionEl, {
        x: `${visualLeft}vw`,
        y: handRect ? handRect.top - viewportWidth * 0.04 : 0,
        xPercent: -40,
        scaleX: 0.9 + flex * 0.45,
        opacity: flex * 0.55,
        force3D: true,
      });
    };

    const holdParam = new URLSearchParams(window.location.search).get("hold");
    if (holdParam != null) {
      const held = gsap.utils.clamp(0, 1, Number(holdParam));
      if (Number.isFinite(held)) {
        const paintHeld = () => {
          measure();
          apply(held);
          paintName(held);
        };
        paintHeld();
        return;
      }
    }

    const html = document.documentElement;
    html.classList.add("intro-lock");

    const onResize = () => measure();
    window.addEventListener("resize", onResize);

    const begin = () => {
      if (started || !active) return;
      started = true;
      window.clearTimeout(fallback);
      measure();
      apply(0);

      ctx = gsap.context(() => {
        paintName(0);

        const proxy = { p: 0 };
        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          onComplete: () => {
            introConsumed = true;
            html.classList.remove("intro-lock");
            if (active) setSettled(true);
          },
        });

        timeline.to(proxy, {
          p: 1,
          duration: SCREEN_PUSH.duration,
          ease: "none",
          onUpdate: () => apply(proxy.p),
        });

        if (nameEl) {
          timeline.to(
            nameEl,
            {
              opacity: 1,
              y: 0,
              clipPath: "inset(0% 0% 0% 0%)",
              duration: SCREEN_PUSH.name.duration,
              ease: "power3.out",
            },
            SCREEN_PUSH.duration * SCREEN_PUSH.name.at,
          );
        }
      }, root);
    };

    const fallback = window.setTimeout(begin, 800);
    begin();

    return () => {
      active = false;
      window.clearTimeout(fallback);
      window.removeEventListener("resize", onResize);
      html.classList.remove("intro-lock");
      ctx?.revert();
      consumeTimer = setTimeout(() => {
        introConsumed = true;
        consumeTimer = null;
      }, 0);
    };
  }, [enabled]);

  return (
    <div ref={rootRef} className="relative min-h-[100dvh] bg-[#f3efe7] text-[#1c1916]">
      {next}
      {settled ? null : (
        <>
          <div
            className="screen-push-overlay pointer-events-none fixed inset-0 z-20"
            style={{ perspective: "1500px" }}
          >
            <div
              ref={screenRef}
              className="pointer-events-auto absolute top-[-8dvh] left-0 h-[116dvh] w-[110vw] origin-left bg-[#1c1916] will-change-transform"
            >
              <div className="absolute top-[8dvh] left-0 h-[100dvh] w-screen">{screen}</div>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-[#f3efe7]/50" />
              <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/25 to-transparent" />
            </div>
          </div>

          <div
            ref={distortionRef}
            aria-hidden="true"
            className="screen-push-overlay pointer-events-none fixed left-0 z-30 h-[28dvh] w-[min(18vw,200px)] opacity-0 will-change-transform"
            style={{
              top: 0,
              background:
                "radial-gradient(closest-side at 28% 50%, rgba(243,239,231,0.72), rgba(243,239,231,0) 72%)",
            }}
          />

          <div
            ref={characterRef}
            aria-hidden="true"
            className="screen-push-character screen-push-overlay pointer-events-none fixed bottom-0 left-0 z-40 w-max will-change-transform"
            style={{ "--screen-push-from": `${SCREEN_PUSH.character.fromVw}vw` } as CSSProperties}
          >
            <WalkingFigure />
          </div>
        </>
      )}
    </div>
  );
}
