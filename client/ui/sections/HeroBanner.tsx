import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../Button';

/* ── Inline SVG medical illustrations ── */

const LungSvg = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 120 120" fill="none" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
    <rect x="55" y="10" width="10" height="30" rx="5" fill="currentColor" />
    <path d="M55 35 Q45 50 30 55" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M65 35 Q75 50 90 55" stroke="currentColor" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M15 50 Q10 55 12 75 Q15 100 35 105 Q50 107 52 85 Q53 65 45 50 Q38 42 25 45 Z" fill="currentColor" opacity="0.5" />
    <path d="M15 50 Q10 55 12 75 Q15 100 35 105 Q50 107 52 85 Q53 65 45 50 Q38 42 25 45 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M105 50 Q110 55 108 75 Q105 100 85 105 Q70 107 68 85 Q67 65 75 50 Q82 42 95 45 Z" fill="currentColor" opacity="0.5" />
    <path d="M105 50 Q110 55 108 75 Q105 100 85 105 Q70 107 68 85 Q67 65 75 50 Q82 42 95 45 Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M35 60 Q30 68 28 78" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
    <path d="M40 58 Q38 70 35 82" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4" />
    <path d="M85 60 Q90 68 92 78" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
    <path d="M80 58 Q82 70 85 82" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.4" />
  </svg>
);

const HeartbeatLine = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 800 40" fill="none" className={className} style={style} xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
    <polyline
      points="0,20 20,20 40,19.5 55,20 60,20 65,18 70,17 75,18 80,20 86,20 90,22 92,23 94,8 96,33 98,21 100,20 110,20 120,15 126,14 134,16 142,20 150,20 170,20.5 185,19.5 200,20 205,18 210,17 215,19 220,20 226,20 230,22 232,23 234,10 236,31 238,21 240,20 250,20 260,15.5 266,15 274,16 282,20 290,20 310,20.5 325,19.5 340,20 346,17 352,16 358,17 364,20 370,20 374,22 376,24 378,3 380,36 382,21 385,20 395,20 405,13 412,12 420,14 428,20 440,20 460,19.5 480,20.5 495,20 500,20 505,18 510,18 515,18 520,20 526,20 530,22 532,23 534,7 536,33 538,21 540,20 550,20 560,14 566,13 574,15 582,20 595,20 615,20.5 635,19.5 655,20 660,20 665,19 670,18 675,19 680,20 686,20 690,22 692,23 694,9 696,31 698,21 700,20 710,20 720,15 726,14 734,16 742,20 760,20 780,20 800,20"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

const OxygenBubble = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg viewBox="0 0 30 30" fill="none" className={className} style={style} xmlns="http://www.w3.org/2000/svg">
    <circle cx="15" cy="15" r="12" stroke="currentColor" strokeWidth="2" fill="currentColor" opacity="0.45" />
    <text x="15" y="19" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" opacity="0.9">O&#8322;</text>
  </svg>
);

/**
 * HeroBanner — fully dynamic. Receives author + platform data as props
 * from the homepage server component so nothing is hardcoded here.
 */
export interface HeroBannerProps {
  /** Author name displayed in the byline. */
  authorName: string;
  /** Author title/designation (e.g. "Pulmonologist & Author"). */
  authorTitle: string;
  /** Platform tagline shown under the headline. */
  tagline: string;
  /** Short list of offering labels shown as checkmark chips. */
  offerings?: string[];
  /** Resolved absolute URL for the doctor image from the API. Falls back to the default asset when null. */
  doctorImageUrl?: string | null;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  authorName,
  authorTitle,
  tagline,
  offerings = ["Study Materials", "Practice Questions", "Expert Guidance"],
  doctorImageUrl,
}) => {
  const imageSrc = doctorImageUrl ?? '/assets/Doctor_v3.png';
  return (
    <section
      className="relative w-full overflow-hidden rounded-2xl mb-8"
      style={{ background: 'linear-gradient(135deg, #FFF8F0 0%, #FFECD2 25%, #FCE4D4 50%, #F0E6F0 75%, #E8EFF8 100%)' }}
    >
      {/* ── Animated Background Medical Elements ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl animate-pulse-soft" style={{ backgroundColor: 'rgba(255, 219, 181, 0.30)' }} />
        <div className="absolute top-1/2 right-0 w-96 h-96 rounded-full blur-3xl animate-pulse-soft" style={{ backgroundColor: 'rgba(212, 229, 247, 0.25)', animationDelay: '3s' }} />
        <div className="absolute -bottom-10 left-1/3 w-64 h-64 rounded-full blur-3xl animate-pulse-soft" style={{ backgroundColor: 'rgba(245, 213, 224, 0.20)', animationDelay: '1.5s' }} />

        {/* <LungSvg
          className="absolute w-32 h-32 animate-float-slow"
          style={{ color: 'rgba(249, 168, 88, 0.48)', top: '0%', left: '0%' }}
        /> */}

        {/* <div className="absolute bottom-2 left-0 w-full lg:w-[70%] overflow-hidden h-10">
          <div className="flex w-[200%] h-full animate-pulse-scroll">
            <HeartbeatLine className="w-1/2 h-full flex-shrink-0" style={{ color: 'rgba(30, 58, 95, 0.20)' }} />
            <HeartbeatLine className="w-1/2 h-full flex-shrink-0" style={{ color: 'rgba(30, 58, 95, 0.20)' }} />
          </div>
        </div> */}

        <OxygenBubble className="absolute w-5 h-5 animate-bubble-rise"   style={{ color: 'rgba(56, 189, 248, 0.60)', bottom: '2%', left: '8%',  animationDelay: '0s'   }} />
        <OxygenBubble className="absolute w-4 h-4 animate-bubble-rise"   style={{ color: 'rgba(34, 197, 94, 0.55)',  bottom: '2%', left: '20%', animationDelay: '3.2s' }} />
        <OxygenBubble className="absolute w-7 h-7 animate-bubble-rise"   style={{ color: 'rgba(56, 189, 248, 0.75)', bottom: '2%', left: '42%', animationDelay: '0.8s' }} />
        <OxygenBubble className="absolute w-9 h-9 animate-bubble-rise"   style={{ color: 'rgba(30, 58, 95, 0.60)',   bottom: '2%', left: '48%', animationDelay: '2.4s' }} />
        <OxygenBubble className="absolute w-5 h-5 animate-bubble-rise"   style={{ color: 'rgba(34, 197, 94, 0.70)',  bottom: '2%', left: '54%', animationDelay: '4.0s' }} />
        <OxygenBubble className="absolute w-10 h-10 animate-bubble-rise" style={{ color: 'rgba(249, 168, 88, 0.65)', bottom: '2%', left: '60%', animationDelay: '1.6s' }} />
        <OxygenBubble className="absolute w-6 h-6 animate-bubble-rise"   style={{ color: 'rgba(56, 189, 248, 0.70)', bottom: '2%', left: '66%', animationDelay: '3.6s' }} />
        <OxygenBubble className="absolute w-5 h-5 animate-bubble-rise"   style={{ color: 'rgba(34, 197, 94, 0.60)',  bottom: '2%', left: '38%', animationDelay: '0.4s' }} />
        <OxygenBubble className="absolute w-7 h-7 animate-bubble-rise"   style={{ color: 'rgba(249, 168, 88, 0.70)', bottom: '2%', left: '68%', animationDelay: '2.8s' }} />
        <OxygenBubble className="absolute w-4 h-4 animate-bubble-rise"   style={{ color: 'rgba(30, 58, 95, 0.55)',   bottom: '2%', left: '54%', animationDelay: '5.0s' }} />

        {/* <LungSvg
          className="absolute w-24 h-24 rotate-12 animate-float-slower"
          style={{ color: 'rgba(30, 58, 95, 0.13)', top: '10%', left: '60%' }}
        /> */}
      </div>

      {/* ── Main Content ── */}
      <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch">

        {/* ── Left: Text Content ── */}
        <div className="flex-1 flex flex-col justify-center text-center lg:text-left px-8 md:px-12 lg:pl-14 2xl:pl-20 py-12 lg:py-16 z-10">

          <h1 className="text-3xl md:text-4xl lg:text-[42px] font-extrabold text-[var(--color-text-main)] leading-[1.15] mb-4 tracking-tight">
            Master Pulmonology with <br className="hidden sm:block" />
             <span className="text-[var(--color-primary)]">Confidence</span>
          </h1>

          <p className="text-base text-[var(--color-text-muted)] mb-3 max-w-md leading-relaxed mx-auto lg:mx-0">
            {tagline}. Structured notes, practice questions, and expert guidance — everything you need in one place.
          </p>

          {/* Author byline */}
          <p className="text-sm mb-8 mx-auto lg:mx-0">
            <span className="text-[var(--color-text-muted)]">By </span>
            <span className="font-semibold text-[var(--color-primary)]">{authorName}</span>
            <span className="text-[var(--color-text-muted)]"> — {authorTitle}</span>
          </p>

          {/* Offerings */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 mb-8 text-sm text-[var(--color-text-body)]">
            {offerings.map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[var(--color-accent)]" />
                {item}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <Link href="/departments/all-departments">
              <Button size="lg" className="bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                Start Learning <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Right: Doctor Image ── */}
        <div className="relative flex-shrink-0 w-full lg:w-[420px] 2xl:w-[480px] flex flex-col items-center justify-end lg:items-end mt-6 lg:mt-0">
          <div className="absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(30,58,95,0.06) 0%, rgba(249,168,88,0.08) 50%, transparent 100%)' }} />
          <div className="hidden lg:flex items-end justify-center flex-shrink-0 w-[380px] relative -mt-8">
            <Image
              src={imageSrc}
              alt={`${authorName} — ${authorTitle}`}
              width={380}
              height={520}
              className="relative z-10 w-full object-contain object-bottom select-none mix-blend-multiply"
              priority
              unoptimized={Boolean(doctorImageUrl)}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
