/**
 * Picture-book character in a push.
 * Scale: the height classes on the svg.
 * The push itself is the small joint motion in poseWalker.
 * Each limb group rotates around its joint, so the drawing at 0° is this pose.
 */
export function WalkingFigure() {
  const ink = "#3D322C";
  return (
    <svg
      data-walk-root
      viewBox="0 0 680 760"
      overflow="visible"
      className="block h-[70dvh] w-auto overflow-visible md:h-[76dvh] lg:h-[80dvh]"
      aria-hidden="true"
    >
      <g data-walk="bob">
        <g data-walk="thigh-back">
          <path
            d="M268 455 C210 500 150 560 108 640"
            fill="none"
            stroke="#243049"
            strokeWidth="46"
            strokeLinecap="round"
          />
          <g transform="translate(78 648) rotate(-18)">
            <rect x="0" y="0" width="78" height="36" rx="16" fill="#F3EDE3" stroke={ink} strokeWidth="3" />
            <rect x="4" y="28" width="78" height="14" rx="7" fill="#3A342E" />
          </g>
        </g>

        <g data-walk="thigh-front">
          <path
            d="M292 468 C340 530 372 590 390 650"
            fill="none"
            stroke="#2E3A5C"
            strokeWidth="50"
            strokeLinecap="round"
          />
          <g transform="translate(352 656) rotate(8)">
            <rect x="0" y="0" width="86" height="38" rx="16" fill="#F3EDE3" stroke={ink} strokeWidth="3" />
            <rect x="6" y="30" width="84" height="14" rx="7" fill="#3A342E" />
            <path d="M22 12 H40 M24 20 H36" stroke="#C9BBA8" strokeWidth="2" strokeLinecap="round" />
          </g>
        </g>

        <g data-walk="arm-back">
          <path
            d="M300 360 C230 390 188 430 210 455"
            fill="none"
            stroke="#3A3A36"
            strokeWidth="36"
            strokeLinecap="round"
          />
          <ellipse cx="196" cy="468" rx="16" ry="18" fill="#F6C9A8" stroke={ink} strokeWidth="3" />
        </g>

        <path
          d="M248 430
             C210 360 230 300 300 278
             C360 258 430 270 456 310
             C478 346 470 410 430 448
             C380 490 270 490 248 430 Z"
          fill="#4A4A46"
          stroke={ink}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M328 292
             C318 318 322 358 348 368
             C378 376 408 348 400 300
             C384 284 348 280 328 292 Z"
          fill="#E8A0B0"
          stroke={ink}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M300 292 H250" fill="none" stroke="#3A3A36" strokeWidth="8" strokeLinecap="round" />

        <ellipse cx="455" cy="186" rx="74" ry="70" fill="#F6C9A8" stroke={ink} strokeWidth="3.5" />
        <ellipse cx="398" cy="196" rx="14" ry="18" fill="#F0B898" stroke={ink} strokeWidth="3" />

        <ellipse cx="478" cy="176" rx="13" ry="15" fill="#fff" stroke={ink} strokeWidth="2.5" />
        <ellipse cx="516" cy="172" rx="13" ry="15" fill="#fff" stroke={ink} strokeWidth="2.5" />
        <circle cx="484" cy="178" r="6" fill="#3D322C" />
        <circle cx="522" cy="174" r="6" fill="#3D322C" />
        <circle cx="486" cy="175" r="2.2" fill="#fff" />
        <circle cx="524" cy="171" r="2.2" fill="#fff" />
        <path d="M462 156 Q476 150 490 158" fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M506 152 Q522 146 536 156" fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M508 186 Q514 192 512 198" fill="none" stroke="#E0A888" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M492 210 Q508 222 526 208" fill="none" stroke="#C4786A" strokeWidth="2.6" strokeLinecap="round" />
        <ellipse cx="462" cy="200" rx="11" ry="7" fill="#F4A8B4" opacity="0.85" />
        <ellipse cx="538" cy="196" rx="10" ry="6" fill="#F4A8B4" opacity="0.7" />

        <g data-walk="hair">
          <path
            d="M420 150
               C340 110 250 140 220 220
               C190 300 230 390 290 370
               C250 300 280 210 370 190
               C390 170 410 160 420 150 Z"
            fill="#6B3E2E"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M400 160
               C330 180 260 240 250 320
               C270 280 320 230 390 210 Z"
            fill="#4E2C22"
          />
          <path
            d="M400 145
               C360 90 470 72 530 112
               C500 88 440 96 412 140 Z"
            fill="#6B3E2E"
            stroke={ink}
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </g>

        <g data-walk="arm-lead">
          <path
            d="M430 300 C480 282 508 272 526 262"
            fill="none"
            stroke="#4A4A46"
            strokeWidth="34"
            strokeLinecap="round"
          />
          <g data-walk="fore-lead">
            <path
              d="M526 262 C560 250 590 240 612 232"
              fill="none"
              stroke="#4A4A46"
              strokeWidth="32"
              strokeLinecap="round"
            />
            <g data-walk="hand">
              <ellipse cx="628" cy="228" rx="22" ry="28" fill="#F6C9A8" stroke={ink} strokeWidth="3" />
              <ellipse cx="652" cy="200" rx="8" ry="16" fill="#F6C9A8" stroke={ink} strokeWidth="3" />
              <ellipse cx="656" cy="218" rx="8" ry="16" fill="#F6C9A8" stroke={ink} strokeWidth="3" />
              <ellipse cx="654" cy="238" rx="8" ry="15" fill="#F6C9A8" stroke={ink} strokeWidth="3" />
              <ellipse cx="646" cy="254" rx="8" ry="13" fill="#F6C9A8" stroke={ink} strokeWidth="3" />
              <ellipse cx="618" cy="206" rx="10" ry="12" fill="#E8B08C" stroke={ink} strokeWidth="3" />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

function pivot(root: ParentNode, name: string, degrees: number, origin: string) {
  root
    .querySelector<SVGGElement>(`[data-walk='${name}']`)
    ?.setAttribute("transform", `rotate(${degrees.toFixed(2)} ${origin})`);
}

/**
 * Strain while she pushes. Angles are degrees on top of the drawn pose.
 * push — 0 relaxed, 1 planted on the cover.
 * strain — how hard she is bracing. This holds; it does not wave.
 * heave — a short grunt. The second one is bigger, when she pushes harder.
 * The leading arm stays put so her palm does not shove the cover around.
 */
export function poseWalker(root: ParentNode, push: number, strain: number, heave: number) {
  const dig = strain * 9 + heave * 8;
  const lean = -3 * push - strain * 2.2 - heave * 1.6;

  root
    .querySelector<SVGGElement>("[data-walk='bob']")
    ?.setAttribute(
      "transform",
      `translate(0 ${dig.toFixed(2)}) rotate(${lean.toFixed(2)} 500 300)`,
    );

  pivot(root, "thigh-back", 5 * push + strain * 7 + heave * 4, "268 455");
  pivot(root, "thigh-front", -6 * push - strain * 5 - heave * 3, "292 468");
  pivot(root, "arm-back", 6 * push + strain * 16 + heave * 12, "300 360");
  pivot(root, "arm-lead", -6 * push, "430 300");
  pivot(root, "fore-lead", -8 * push, "526 262");
  pivot(root, "hair", -strain * 11 - heave * 8, "430 170");
}
