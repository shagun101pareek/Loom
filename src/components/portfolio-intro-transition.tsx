"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import pushTrack from "@/data/girl-push-track.json";

/**
 * Intro timing and travel.
 *
 * One continuous progress value drives the sprite, the curtain edge on
 * her palm, and the short exit that carries her off after the sheet is
 * open. No second timeline beat — the push keeps flowing until the name
 * page is left alone.
 */
export const INTRO_TUNING = {
  /** Seconds for the full push + exit. Shorter is faster. */
  duration: 2.2,
  tabletDuration: 2.2,
  mobileDuration: 2.2,
  /** Even playback so the curtain stays locked to her hand. */
  ease: "none",
  /** How far the remaining landing screen is shoved, in px. */
  screenPush: 36,
  /** Depth of the dent at her palm, in px. */
  bulge: 78,
  mobileBulge: 44,
  /**
   * Tear tip vs drawn palm. 0 = boundary on the tracked palm.
   * Negative pulls the wall back onto the hand if markers sit past the contact.
   */
  handAlign: 0,
  handAlignMobile: 0,
  /** Name rises as her hand reaches it — same continuous motion. */
  nameOffsetY: 22,
  nameDuration: 0.95,
  nameEase: "power2.out",
  nameLead: 64,
  mobileMaxWidth: 767,
  tabletMaxWidth: 1023,
} as const;

const FRAME_COUNT = pushTrack.frameCount;
const COLUMNS = pushTrack.columns;
const FRAME_WIDTH = pushTrack.frameWidth;
const FRAME_HEIGHT = pushTrack.frameHeight;
const TRAIL_RATIO = pushTrack.trailRatio;

/** Raw palm markers from the sheet — must match the drawn frame exactly. */
const PALMS: Array<[number, number]> = pushTrack.palms.map(([x, y]) => [x, y]);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isMobile(width: number) {
  return width <= INTRO_TUNING.mobileMaxWidth;
}

/** Sprite frame for drawing — discrete sheet cells. */
function frameIndex(clipProgress: number) {
  return Math.round(clamp(clipProgress, 0, 1) * (FRAME_COUNT - 1));
}

/**
 * Palm for the curtain edge — always the same cell the canvas is drawing.
 * Interpolating here used to open the wall ahead of (or behind) the sprite
 * hand between frames; locking to the drawn frame keeps them aligned.
 */
function palmAt(clipProgress: number): [number, number] {
  return PALMS[frameIndex(clipProgress)];
}

type Metrics = {
  vw: number;
  vh: number;
  imgW: number;
  imgH: number;
  originX: number;
};

type Tear = {
  x: number;
  y: number;
  tip: number;
  base: number;
  handY: number;
  span: number;
  notch: number;
  seamOpacity: number;
};

/**
 * Map timeline progress → clip + exit without a pause.
 * Clip runs through `trailRatio`; the rest continues her rightward push
 * off-screen while the curtain stays fully open.
 */
function phases(progress: number) {
  const p = clamp(progress, 0, 1);
  const trail = clamp(TRAIL_RATIO, 0.85, 0.98);
  if (p <= trail) {
    return { clip: p / trail, exit: 0 };
  }
  return { clip: 1, exit: (p - trail) / (1 - trail) };
}

function measure(character: HTMLElement): Metrics | null {
  const imgW = character.offsetWidth;
  const imgH = character.offsetHeight;
  if (imgW < 2 || imgH < 2) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  return {
    vw,
    vh,
    imgW,
    imgH,
    originX: (vw - imgW) / 2,
  };
}

function tearAt(progress: number, metrics: Metrics): Tear {
  const mobile = isMobile(metrics.vw);
  const { clip, exit } = phases(progress);
  const y = (metrics.vh - metrics.imgH) / 2;
  const palm = palmAt(clip);
  const clearance = Math.max(56, metrics.imgW * 0.08);
  const palmAtEnd = PALMS[FRAME_COUNT - 1][0] * metrics.imgW;
  const exitTravel = Math.max(
    clearance,
    metrics.vw + clearance - (metrics.originX + palmAtEnd),
  );
  const x = metrics.originX + exit * exitTravel;

  const align = mobile ? INTRO_TUNING.handAlignMobile : INTRO_TUNING.handAlign;
  const handScreenX = x + palm[0] * metrics.imgW;
  const handScreenY = y + palm[1] * metrics.imgH;
  // Once she is exiting, keep the sheet fully open — she has already pushed through.
  // Tip is the drawn palm so the wall boundary and her hand stay locked together.
  const tip = exit > 0 ? metrics.vw : clamp(handScreenX + align, 0, metrics.vw);
  const bulge = mobile ? INTRO_TUNING.mobileBulge : INTRO_TUNING.bulge;
  const opening = tip > 0 && tip < metrics.vw ? tip / metrics.vw : tip >= metrics.vw ? 1 : 0;
  const span = Math.max(130, metrics.vh * 0.26);
  // Soften the seam as the opening finishes so it dissolves into the reveal.
  const edgeFade = tip >= metrics.vw - 1 ? 0 : clamp(1 - opening * opening, 0, 1);

  return {
    x,
    y,
    tip,
    base: Math.max(0, tip - bulge * Math.sin(Math.PI * opening)),
    handY: clamp(handScreenY, span, metrics.vh - span),
    span,
    notch: bulge * Math.sin(Math.PI * opening),
    seamOpacity: edgeFade,
  };
}

/** Soft fabric dent whose peak sits exactly on her palm — shared by clip and seam. */
function edgePoints(tear: Tear, metrics: Metrics) {
  const { base, tip, handY, span } = tear;
  const depth = tip - base;
  const steps = 20;
  const points: Array<[number, number]> = [[base, 0]];

  for (let i = 0; i <= steps; i++) {
    const t = -1 + (2 * i) / steps;
    // Peak must hit 1 at t=0 so the wall meets her hand, not sit behind it.
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

/** Timeline progress when her palm reaches targetX. */
function progressWhenHandReaches(targetX: number, metrics: Metrics) {
  const align = isMobile(metrics.vw)
    ? INTRO_TUNING.handAlignMobile
    : INTRO_TUNING.handAlign;
  const last = FRAME_COUNT - 1;
  const trail = clamp(TRAIL_RATIO, 0.85, 0.98);

  for (let i = 0; i <= last; i++) {
    const clip = i / last;
    const hand = metrics.originX + PALMS[i][0] * metrics.imgW + align;
    if (hand >= targetX) return clip * trail;
  }

  return trail;
}

function drawFrame(
  canvas: HTMLCanvasElement,
  sheet: HTMLImageElement,
  clipProgress: number,
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

  const index = frameIndex(clipProgress);
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
      const { clip } = phases(progress);

      gsap.set(character, {
        x: tear.x,
        y: tear.y,
        force3D: true,
      });
      drawFrame(canvas, sheet, clip);
      coverEl.style.clipPath = coverClip(tear, metrics);
      gsap.set(shiftEl, {
        x: (tear.tip / metrics.vw) * INTRO_TUNING.screenPush,
        force3D: true,
      });

      const d = seamPath(tear, metrics);
      seam.setAttribute("viewBox", `0 0 ${metrics.vw} ${metrics.vh}`);
      glow.setAttribute("d", d);
      line.setAttribute("d", d);
      seam.style.opacity = d ? String(tear.seamOpacity) : "0";

      gsap.set(pressure, {
        x: tear.tip - 110,
        y: tear.handY - 110,
        force3D: true,
      });
      pressure.style.opacity =
        tear.notch > 8 ? String(Math.min(1, tear.notch / 40) * tear.seamOpacity) : "0";
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

        // One tween for the whole push: sprite, curtain, and exit.
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
