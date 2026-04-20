'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, Award, BookOpen, ArrowUpRight } from 'lucide-react';
import { Card } from '../Card';

interface DoctorCardProps {
  doctor: {
    id: string;
    name: string;
    specialization: string;
    avatarUrl?: string;
    bookCount: number;
    rating: number;
  };
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor }) => {
  const doctorSlug = doctor.name.toLowerCase().replace(/\s+/g, '-');

  return (
    <Link href={`/doctors/${doctorSlug}`} className="block h-full group">
      <Card className="flex flex-col items-center text-center bg-white group-hover:border-[var(--color-border-hover)] h-full p-6 transition-all duration-300">
        <div className="relative mb-5">
          <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-violet-500 p-0.5 group-hover:rotate-6 transition-transform duration-500 shadow-lg">
            <div className="h-full w-full rounded-full bg-white p-1 overflow-hidden relative">
              {doctor.avatarUrl ? (
                <Image
                  src={doctor.avatarUrl}
                  alt={doctor.name}
                  fill
                  className="object-cover rounded-full"
                  unoptimized
                />
              ) : (
                <div className="h-full w-full bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-primary)] rounded-full">
                  <User className="h-10 w-10" />
                </div>
              )}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[var(--color-primary)] p-1.5 rounded-full shadow-md border-2 border-white">
            <Award className="h-4 w-4 text-white" />
          </div>
        </div>

        <h3 className="font-bold text-lg text-[var(--color-text-main)] mb-1 group-hover:text-[var(--color-primary)] transition-colors leading-tight tracking-tight">
          {doctor.name}
        </h3>
        <p className="text-[10px] text-[var(--color-primary)] font-black mb-6 uppercase tracking-[0.2em] opacity-80">
          {doctor.specialization}
        </p>

        <div className="grid grid-cols-2 gap-4 w-full pt-5 border-t border-[var(--color-border)] mt-auto">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-[var(--color-text-muted)] mb-1 uppercase tracking-widest font-black">Resources</span>
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-[var(--color-primary)] opacity-60" />
              <span className="font-black text-sm text-[var(--color-text-main)] tabular-nums">{doctor.bookCount}</span>
            </div>
          </div>
          <div className="flex flex-col items-center border-l border-[var(--color-border)]">
            <span className="text-[9px] text-[var(--color-text-muted)] mb-1 uppercase tracking-widest font-black">Score</span>
            <div className="flex items-center gap-1.5 text-amber-500">
              <span className="font-black text-sm tabular-nums">{doctor.rating}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors py-3 rounded-xl group-hover:bg-[var(--color-surface)] border border-transparent group-hover:border-[var(--color-border)]">
          View Profile <ArrowUpRight className="h-3.5 w-3.5" />
        </div>
      </Card>
    </Link>
  );
};
