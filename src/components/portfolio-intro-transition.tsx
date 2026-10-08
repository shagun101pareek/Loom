"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import pushTrack from "@/data/girl-push-track.json";

/**
 * Intro timing and travel.
 *
 * Speed is the crossing packed into `duration`: shorter is faster.
 * The tear stays on her outstretched hand, so the reveal follows her
 * unless `revealLead` opens the screen ahead of her palm.
 * One progress value also picks her sprite frame. This clip already
 * walks her across the frame, so the frame stays put and the page
 * edge follows her hand.
 */
export const INTRO_TUNING = {
  /** Seconds of the clip. Playback stays even so the page matches her. */
  duration: 3.5,
  tabletDuration: 3.5,
  mobileDuration: 3.5,
  /** The clip's own timing. No extra ease. */
  ease: "none",
  /** How far the remaining landing screen is shoved, in px. */
  screenPush: 22,
  /** Depth of the dent at her palm, in px. */
  bulge: 64,
  mobileBulge: 36,
  /** Extra px the tear opens ahead of her palm. 0 keeps it on her hand. */
  revealLead: 0,
  revealLeadMobile: 0,
  /** Name settle. It starts `nameLead` px before the tear reaches the name. */
  nameOffsetY: 28,
  nameDuration: 1.15,
  nameEase: "power3.out",
  nameLead: 72,
  mobileMaxWidth: 767,
  tabletMaxWidth: 1023,
} as const;

const FRAME_COUNT = pushTrack.frameCount;
const COLUMNS = pushTrack.columns;
const FRAME_WIDTH = pushTrack.frameWidth;
const FRAME_HEIGHT = pushTrack.frameHeight;
const PALMS = pushTrack.palms;

function frameIndex(progress: number) {
  return Math.round(clamp(progress, 0, 1) * (FRAME_COUNT - 1));
}

type Metrics = {
  vw: number;
  vh: number;
  imgW: number;
  imgH: number;
  startX: number;
  endX: number;
};

type Tear = {
  x: number;
  y: number;
  tip: number;
  base: number;
  handY: number;
  span: number;
  notch: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isMobile(width: number) {
  return width <= INTRO_TUNING.mobileMaxWidth;
}

function measure(character: HTMLElement): Metrics | null {
  const imgW = character.offsetWidth;
  const imgH = character.offsetHeight;
  if (imgW < 2 || imgH < 2) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const originX = (vw - imgW) / 2;

  return {
    vw,
    vh,
    imgW,
    imgH,
    startX: originX,
    endX: originX,
  };
}

function tearAt(progress: number, metrics: Metrics): Tear {
  const mobile = isMobile(metrics.vw);
  const x = metrics.startX + (metrics.endX - metrics.startX) * progress;
  const y = (metrics.vh - metrics.imgH) / 2;
  const palm = PALMS[frameIndex(progress)];
  const handScreenX = x + palm[0] * metrics.imgW;
  const handScreenY = y + palm[1] * metrics.imgH;
  const lead = mobile ? INTRO_TUNING.revealLeadMobile : INTRO_TUNING.revealLead;
  const tip = clamp(handScreenX + lead, 0, metrics.vw);
  const bulge = mobile ? INTRO_TUNING.mobileBulge : INTRO_TUNING.bulge;
  const opening = tip > 0 && tip < metrics.vw ? tip / metrics.vw : 0;
  const span = Math.max(110, metrics.vh * 0.22);

  return {
    x,
    y,
    tip,
    base: Math.max(0, tip - bulge * Math.sin(Math.PI * opening)),
    handY: clamp(handScreenY, span, metrics.vh - span),
    span,
    notch: bulge * Math.sin(Math.PI * opening),
  };
}

/** Smooth dent centered on her palm, shared by the clip and the seam. */
function edgePoints(tear: Tear, metrics: Metrics) {
  const { base, tip, handY, span } = tear;
  const depth = tip - base;
  const steps = 14;
  const points: Array<[number, number]> = [[base, 0]];

  for (let i = 0; i <= steps; i++) {
    const t = -1 + (2 * i) / steps;
    const falloff = (1 - t * t) ** 2;
    points.push([base + depth * falloff, handY + t * span]);
  }

  points.push([base, metrics.vh]);
  return points;
}

/** Landing screen stays visible to the right of the tear. */
function coverClip(tear: Tear, metrics: Metrics) {
  if (tear.tip <= 0) return "none";
  if (tear.tip >= metrics.vw - 0.5) return "inset(0px 0px 0px 100%)";

  const boundary = edgePoints(tear, metrics)
    .map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`)
    .join(", ");
  return `polygon(${boundary}, ${metrics.vw}px ${metrics.vh}px, ${metrics.vw}px 0px)`;
}

function seamPath(tear: Tear, metrics: Metrics) {
  if (tear.tip <= 0 || tear.tip >= metrics.vw) return "";
  return edgePoints(tear, metrics)
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
}

function durationFor(width: number) {
  if (isMobile(width)) return INTRO_TUNING.mobileDuration;
  if (width <= INTRO_TUNING.tabletMaxWidth) return INTRO_TUNING.tabletDuration;
  return INTRO_TUNING.duration;
}

/** Progress (0–1) when her palm, plus any lead, reaches targetX. */
function progressWhenHandReaches(targetX: number, metrics: Metrics) {
  const lead = isMobile(metrics.vw)
    ? INTRO_TUNING.revealLeadMobile
    : INTRO_TUNING.revealLead;
  const last = FRAME_COUNT - 1;

  for (let i = 0; i <= last; i++) {
    const progress = i / last;
    const x = metrics.startX + (metrics.endX - metrics.startX) * progress;
    const hand = x + PALMS[i][0] * metrics.imgW + lead;
    if (hand >= targetX) return progress;
  }

  return 1;
}

function drawFrame(
  canvas: HTMLCanvasElement,
  sheet: HTMLImageElement,
  progress: number,
) {
  if (!sheet.complete || sheet.naturalWidth < 2) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (cssW < 2 || cssH < 2) return;

  const bw = Math.round(cssW * dpr);
  const bh = Math.round(cssH * dpr);
  if (canvas.width !== bw || canvas.height !== bh) {
    canvas.width = bw;
    canvas.height = bh;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const index = frameIndex(progress);
  const col = index % COLUMNS;
  const row = Math.floor(index / COLUMNS);
  ctx.clearRect(0, 0, bw, bh);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    sheet,
    col * FRAME_WIDTH,
    row * FRAME_HEIGHT,
    FRAME_WIDTH,
    FRAME_HEIGHT,
    0,
    0,
    bw,
    bh,
  );
}

export function PortfolioIntroTransition({
  cover,
  children,
}: {
  cover: ReactNode;
  children: ReactNode;
}) {
  const [active, setActive] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const characterRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const shiftRef = useRef<HTMLDivElement>(null);
  const seamRef = useRef<SVGSVGElement>(null);
  const glowRef = useRef<SVGPathElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const pressureRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // CSS hides the overlay when reduced motion is requested, so the name page
    // is what they land on. Skipping the timeline avoids a second render here.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      document.documentElement.dataset.intro = "reduced";
      return () => {
        delete document.documentElement.dataset.intro;
      };
    }

    const root = rootRef.current;
    const character = characterRef.current;
    const canvas = canvasRef.current;
    const coverEl = coverRef.current;
    const shiftEl = shiftRef.current;
    const seam = seamRef.current;
    const glow = glowRef.current;
    const line = lineRef.current;
    const pressure = pressureRef.current;
    if (!root || !character || !canvas || !coverEl || !shiftEl || !seam || !glow || !line || !pressure) {
      return;
    }

    document.documentElement.dataset.intro = "playing";

    const gate = { cancelled: false, started: false };
    let context: gsap.Context | undefined;
    let frame = 0;
    let removeResize = () => {};

    const sheet = new Image();
    sheet.decoding = "async";
    sheet.src = "/intro/girl-artwork-2.png";

    const apply = (progress: number, metrics: Metrics) => {
      const tear = tearAt(progress, metrics);
      gsap.set(character, {
        x: tear.x,
        y: tear.y,
        force3D: true,
      });
      drawFrame(canvas, sheet, progress);
      coverEl.style.clipPath = coverClip(tear, metrics);
      gsap.set(shiftEl, {
        x: (tear.tip / metrics.vw) * INTRO_TUNING.screenPush,
        force3D: true,
      });

      const d = seamPath(tear, metrics);
      seam.setAttribute("viewBox", `0 0 ${metrics.vw} ${metrics.vh}`);
      glow.setAttribute("d", d);
      line.setAttribute("d", d);
      seam.style.opacity = d ? "1" : "0";

      gsap.set(pressure, {
        x: tear.tip - 110,
        y: tear.handY - 110,
        force3D: true,
      });
      pressure.style.opacity = tear.notch > 8 ? "1" : "0";
    };

    const start = () => {
      if (gate.cancelled || gate.started) return;
      const metrics = measure(character);
      if (!metrics) {
        frame = requestAnimationFrame(start);
        return;
      }
      gate.started = true;

      const metricsRef = { current: metrics };
      const onResize = () => {
        const next = measure(character);
        if (next) metricsRef.current = next;
      };
      window.addEventListener("resize", onResize);
      removeResize = () => window.removeEventListener("resize", onResize);

      context = gsap.context(() => {
        const state = { p: 0 };
        const duration = durationFor(metrics.vw);
        apply(0, metrics);

        // The clip plays straight through. The frame stays put and the
        // page edge follows her hand. She then steps the rest of the way
        // off the right, so the landing that remains is only the name.
        const timeline = gsap.timeline({
          onComplete: () => {
            removeResize();
            if (gate.cancelled) return;
            document.documentElement.dataset.intro = "done";
            setActive(false);
          },
        });

        timeline.to(
          state,
          {
            p: 1,
            duration,
            ease: INTRO_TUNING.ease,
            onUpdate: () => apply(state.p, metricsRef.current),
          },
          0,
        );

        const names = [...root.querySelectorAll<HTMLElement>("[data-intro-name]")];
        const name = names[0];
        if (name) {
          gsap.set(names, { y: INTRO_TUNING.nameOffsetY, force3D: true });
          const nameLeft = name.getBoundingClientRect().left;
          const nameAt =
            progressWhenHandReaches(nameLeft - INTRO_TUNING.nameLead, metrics) *
            duration;
          timeline.to(
            names,
            {
              y: 0,
              duration: INTRO_TUNING.nameDuration,
              ease: INTRO_TUNING.nameEase,
              force3D: true,
              clearProps: "transform",
            },
            nameAt,
          );
        }

        // Continue the same rightward speed until she has left the screen.
        // A plain object is tweened so this cannot touch her until the clip ends.
        const exit = { t: 0, from: 0, to: 0, y: 0 };
        timeline.call(
          () => {
            seam.style.opacity = "0";
            pressure.style.opacity = "0";
          },
          undefined,
          ">",
        );
        timeline.to(
          exit,
          {
            t: 1,
            ease: "none",
            immediateRender: false,
            duration: 0.32,
            onStart: () => {
              const width = character.offsetWidth || window.innerWidth;
              const currentX = Number(gsap.getProperty(character, "x")) || 0;
              const palmScreen = currentX + PALMS[FRAME_COUNT - 1][0] * width;
              const clearance = Math.max(56, width * 0.08);
              exit.from = currentX;
              exit.to = currentX + Math.max(clearance, window.innerWidth + clearance - palmScreen);
              exit.y = Number(gsap.getProperty(character, "y")) || 0;
            },
            onUpdate: () => {
              gsap.set(character, {
                x: exit.from + (exit.to - exit.from) * exit.t,
                y: exit.y,
                force3D: true,
              });
            },
          },
          "<",
        );
      }, root);
    };

    const kick = () => {
      frame = requestAnimationFrame(start);
    };

    const giveUp = window.setTimeout(kick, 2500);
    if (sheet.complete && sheet.naturalWidth > 0) kick();
    else {
      sheet.addEventListener("load", kick, { once: true });
      sheet.addEventListener("error", kick, { once: true });
    }

    return () => {
      gate.cancelled = true;
      window.clearTimeout(giveUp);
      cancelAnimationFrame(frame);
      sheet.removeEventListener("load", kick);
      sheet.removeEventListener("error", kick);
      removeResize();
      context?.revert();
      delete document.documentElement.dataset.intro;
    };
  }, []);

  return (
    <div ref={rootRef}>
      {/* Layer 1: the page underneath. It remains after the overlay unmounts. */}
      {children}

      {active ? (
        <div className="intro-overlay" inert aria-hidden="true">
          <noscript>
            <style>{`.intro-overlay{display:none}`}</style>
          </noscript>

          {/* Layer 2: landing screen, clipped away in sync with her hand. */}
          <div ref={coverRef} className="intro-cover">
            <div ref={shiftRef} className="intro-cover-shift">
              {cover}
            </div>
          </div>

          {/* Layer 4: torn edge and palm light, kept behind her so the line does not slice her body. */}
          <svg ref={seamRef} className="intro-seam" aria-hidden="true">
            <path ref={glowRef} className="intro-seam-glow" />
            <path ref={lineRef} className="intro-seam-line" />
          </svg>
          <div ref={pressureRef} className="intro-pressure" />

          {/* Layer 3: character, above the landing screen. */}
          <div
            ref={characterRef}
            className="intro-character"
            style={{
              width: "100%",
              height: "auto",
              aspectRatio: `${FRAME_WIDTH} / ${FRAME_HEIGHT}`,
            }}
          >
            <canvas ref={canvasRef} width={FRAME_WIDTH} height={FRAME_HEIGHT} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
