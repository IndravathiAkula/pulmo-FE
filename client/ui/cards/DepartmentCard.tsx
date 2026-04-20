import Link from 'next/link';
import { Card } from '../Card';
import { ChevronRight, Stethoscope, HeartPulse, Brain, Microscope, FlaskConical } from 'lucide-react';

interface DepartmentCardProps {
  department: {
    id: string;
    name: string;
    iconName?: string;
    bookCount: number;
    color?: string;
  };
}

const iconMap: Record<string, any> = {
  internal: Stethoscope,
  cardiology: HeartPulse,
  neurology: Brain,
  radiology: Microscope,
  orthopedics: Microscope,
  surgery: Stethoscope,
  pediatrics: Stethoscope,
  pathology: FlaskConical,
};

export const DepartmentCard: React.FC<DepartmentCardProps> = ({ department }) => {
  const Icon = iconMap[department.id] || Stethoscope;

  return (
    <Link href={`/departments/${department.id}`} className="block group h-full">
      <Card className="relative bg-white group-hover:border-[var(--color-border-hover)] h-full flex flex-col overflow-hidden p-6 transition-all duration-300">
        {/* Background patterns */}
        <div className="absolute -top-12 -right-12 h-32 w-32 bg-[var(--color-primary)]/5 rounded-full blur-3xl group-hover:bg-[var(--color-primary)]/10 transition-colors" />

        <div className="relative flex flex-col h-full">
          <div className="h-12 w-12 rounded-2xl bg-[var(--color-primary-light)] border border-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] mb-5 group-hover:bg-[var(--color-primary)] group-hover:text-white group-hover:border-[var(--color-primary)] transition-all transform group-hover:scale-110 group-hover:rotate-3 duration-500 shadow-sm">
            <Icon className="h-6 w-6" />
          </div>

          <h3 className="font-bold text-lg text-[var(--color-text-main)] mb-1 group-hover:text-[var(--color-primary)] transition-colors tracking-tight">
            {department.name}
          </h3>

          <p className="text-[10px] text-[var(--color-text-muted)] mb-8 flex items-center gap-1.5 font-black uppercase tracking-widest opacity-80">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
            {department.bookCount} Specialized Resources
          </p>

          <div className="mt-auto flex items-center gap-2 text-[var(--color-primary)] text-[10px] font-black uppercase tracking-[0.2em] group-hover:gap-3 transition-all duration-300">
            Explore Specialty <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </Card>
    </Link>
  );
};
