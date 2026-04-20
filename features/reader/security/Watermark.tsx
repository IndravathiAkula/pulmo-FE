"use client";

import { useMemo, memo } from "react";

interface WatermarkProps {
  userEmail: string;
  userName: string;
}

export const Watermark = memo(function Watermark({ userEmail, userName: _userName }: WatermarkProps) {
  const text = `• PulmoPrep - ${userEmail}`;
  const timestamp = new Date().toLocaleDateString();

  const svgDataUri = useMemo(() => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="380" height="200">
        <text
          x="50%" y="45%"
          font-family="Inter, Arial, sans-serif"
          font-size="14"
          fill="rgba(100,100,100,0.15)"
          text-anchor="middle"
          dominant-baseline="middle"
          transform="rotate(-30, 190, 100)"
        >${text}</text>
        <text
          x="50%" y="65%"
          font-family="Inter, Arial, sans-serif"
          font-size="12"
          fill="rgba(100,100,100,0.15)"
          text-anchor="middle"
          dominant-baseline="middle"
          transform="rotate(-30, 190, 100)"
        >${timestamp}</text>
      </svg>
    `.trim();

    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }, [text, timestamp]);

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      aria-hidden="true"
      style={{
        backgroundImage: svgDataUri,
        backgroundRepeat: "repeat",
        backgroundSize: "380px 200px",

        /**
         * mixBlendMode: 'multiply' ensures the watermark is visible on white
         * backgrounds (light-gray on white becomes light-gray) but blends into
         * darker regions without being overly distracting.
         */
        mixBlendMode: "multiply",

        // subtle global strength control
        opacity: 0.9,
      }}
    />
  );
});
