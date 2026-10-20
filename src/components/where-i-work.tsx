import Image from "next/image";

type WorkChapterProps = {
  eyebrow?: string;
  title: [string, string];
  place: string;
  role: string;
  blurb: string;
  imageSrc: string;
  imageAlt: string;
  /** Soft cue that the next chapter slides up on scroll. */
  hint?: string;
  priority?: boolean;
};

/** One full-viewport chapter: type bottom-left, workplace image on the right. */
export function WorkChapter({
  eyebrow,
  title,
  place,
  role,
  blurb,
  imageSrc,
  imageAlt,
  hint,
  priority = false,
}: WorkChapterProps) {
  return (
    <article className="work-chapter">
      <div className="work-chapter-copy">
        {eyebrow ? <p className="work-chapter-eyebrow">{eyebrow}</p> : null}
        <h2 className="work-chapter-title">
          <span className="block font-light">{title[0]}</span>
          <span className="block font-medium">{title[1]}</span>
        </h2>
        <p className="work-chapter-meta">
          <span>{place}</span>
          <span className="work-chapter-dot" aria-hidden="true">
            ·
          </span>
          <span>{role}</span>
        </p>
        <p className="work-chapter-blurb">{blurb}</p>
        {hint ? <p className="work-chapter-hint">{hint}</p> : null}
      </div>

      <div className="work-chapter-media">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes="(max-width: 767px) 100vw, 52vw"
          className="object-cover"
          priority={priority}
        />
      </div>
    </article>
  );
}

/** Present workplace — shown first behind the opening name doors. */
export function WhereIWorkHero() {
  return (
    <WorkChapter
      title={["Where", "I Work"]}
      place="Independent"
      role="Product designer"
      blurb="The desk I keep now — remote days, quiet light, work that still feels close to the hand."
      imageSrc="/work/present.jpg"
      imageAlt="Current studio workspace with desk and window light"
      hint="Scroll"
      priority
    />
  );
}

/** Past workplaces — revealed when the present chapter slides up. */
export function WhereIUsedToWork() {
  return (
    <WorkChapter
      eyebrow="Before"
      title={["Where I", "Used to Work"]}
      place="Studio years"
      role="2019 — 2024"
      blurb="Earlier rooms and teams — the places that shaped how I still make things."
      imageSrc="/work/past.jpg"
      imageAlt="Earlier studio archive with sketches and soft light"
    />
  );
}
