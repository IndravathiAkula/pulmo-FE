import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AuthImageSlider, type SlideImage } from "./AuthImageSlider";

/**
 * AuthSplitLayout — two-column auth page shell.
 *
 * Desktop (≥lg): 50/50 split with the image slider on the left and the
 * form column on the right.
 * Mobile / tablet: image column is hidden entirely; the form centers
 * exactly as the old single-column auth pages did. Keeps mobile fast
 * and focused.
 *
 * The form column intentionally has NO card wrapper or shadow — the
 * split layout itself provides visual separation. Form fields keep
 * their own subtle borders (set by each form component, unchanged).
 */

const DEFAULT_IMAGES: SlideImage[] = [
  { src: "/assets/login.png", alt: "Medical literature" },
];

interface AuthSplitLayoutProps {
  children: React.ReactNode;
  /** Override the slider image set. Defaults to the single login hero. */
  images?: SlideImage[];
}

export function AuthSplitLayout({
  children,
  images = DEFAULT_IMAGES,
}: AuthSplitLayoutProps) {
  return (
    <main className="relative min-h-screen flex bg-[var(--color-surface)]">
      {/* Back-to-home — fixed top-left so it sits above both columns
          without pushing content. Subtle by default, darkens on hover. */}
      <Link
        href="/"
        aria-label="Back to home"
        className="absolute top-6 left-6 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[var(--color-text-muted)] bg-white/70 backdrop-blur border border-[var(--color-border)] hover:text-[var(--color-primary)] hover:border-[var(--color-border-hover)] transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to home
      </Link>

      {/* Image column — half the screen on desktop, centered content.
          The tile itself stays compact (square, max-w-sm) and centers
          within the larger half. `object-contain` on the slider means
          nothing is cropped; non-square images letterbox against the
          white tile background. */}
      <aside
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-10"
        aria-hidden="true"
      >
        <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden bg-white">
          <AuthImageSlider images={images} />
        </div>
      </aside>

      {/* Form column — other half, centered content. */}
      <section className="lg:w-1/2 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md animate-scale-in">{children}</div>
      </section>
    </main>
  );
}
