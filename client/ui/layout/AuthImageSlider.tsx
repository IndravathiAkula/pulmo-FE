"use client";

/**
 * AuthImageSlider — image column for the auth split layout.
 *
 * Single image → renders the image alone (no dots, no auto-advance, no
 * fade cost). Two or more → auto-advances every `intervalMs` with a
 * cross-fade, shows clickable dots, and exposes a pause-on-hover affordance.
 *
 * The slider is purely visual and non-interactive beyond the dots so
 * the user's attention stays on the form. No arrows, no drag.
 *
 * Adding more images later is a data change — just append to the
 * `images` prop. No code change required to "unlock" the slider UX.
 */

import { useEffect, useState } from "react";
import Image from "next/image";

export interface SlideImage {
  src: string;
  alt: string;
}

interface AuthImageSliderProps {
  images: SlideImage[];
  /** Auto-advance interval in ms. Defaults to 5000. Ignored for 1 image. */
  intervalMs?: number;
}

export function AuthImageSlider({
  images,
  intervalMs = 5000,
}: AuthImageSliderProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const multiple = images.length > 1;

  useEffect(() => {
    if (!multiple || paused) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [multiple, paused, intervalMs, images.length]);

  if (images.length === 0) return null;

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription={multiple ? "carousel" : undefined}
    >
      {images.map((img, i) => (
        <div
          key={img.src}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === index ? 1 : 0 }}
          aria-hidden={i !== index}
        >
          <Image
            src={img.src}
            alt={img.alt}
            fill
            priority={i === 0}
            sizes="(min-width: 1024px) 33vw, 0px"
            className="object-contain"
          />
        </div>
      ))}

      {multiple && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2"
          role="tablist"
          aria-label="Slide navigation"
        >
          {images.map((img, i) => {
            const active = i === index;
            return (
              <button
                key={img.src}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Show slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  active
                    ? "w-8 bg-white"
                    : "w-2 bg-white/50 hover:bg-white/75"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
