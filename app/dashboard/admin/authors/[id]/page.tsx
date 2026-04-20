import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  FileText,
  ShieldCheck,
  ShieldOff,
  CheckCircle2,
  Calendar,
  User,
} from "lucide-react";
import { authorsService } from "@/server/catalog/authors.service";
import { resolveFileUrl } from "@/lib/resolve-file-url";

export default async function AdminAuthorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await authorsService.adminGet(id);
  if (!result.ok) notFound();

  const raw = result.data;
  const author = {
    ...raw,
    profileUrl: resolveFileUrl(raw.profileUrl),
  };

  const fullName = `${author.firstName} ${author.lastName}`.trim();
  const initials =
    (author.firstName.charAt(0) + author.lastName.charAt(0)).toUpperCase() ||
    "?";

  return (
    <div className="max-w-4xl">
      <Link
        href="/dashboard/admin/authors"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-4 transition-colors"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        Back to authors
      </Link>

      <section className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm p-6 md:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white flex-shrink-0 overflow-hidden shadow-md"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary-start) 0%, var(--color-primary-end) 100%)",
            }}
          >
            {author.profileUrl ? (
              <Image
                src={author.profileUrl}
                alt={fullName}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              initials || <User className="w-10 h-10" />
            )}
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <h1 className="text-2xl font-extrabold text-[var(--color-text-main)] truncate">
              {fullName || "Unnamed author"}
            </h1>
            {author.designation && (
              <p className="text-sm text-[var(--color-primary)] font-semibold mt-0.5 truncate">
                {author.designation}
              </p>
            )}
            <p className="text-sm text-[var(--color-text-muted)] mt-1 truncate flex items-center gap-1.5 justify-center sm:justify-start">
              <Mail className="w-3.5 h-3.5" />
              {author.email}
            </p>

            <div className="flex items-center gap-2 flex-wrap mt-3 justify-center sm:justify-start">
              <Badge
                tone={author.active ? "accent" : "muted"}
                icon={
                  author.active ? (
                    <ShieldCheck className="w-3 h-3" />
                  ) : (
                    <ShieldOff className="w-3 h-3" />
                  )
                }
              >
                {author.active ? "Active" : "Inactive"}
              </Badge>
              <Badge
                tone={author.emailVerified ? "primary" : "peach"}
                icon={<CheckCircle2 className="w-3 h-3" />}
              >
                {author.emailVerified ? "Email verified" : "Unverified"}
              </Badge>
              {/* <Badge tone="muted" icon={<ShieldCheck className="w-3 h-3" />}>
                {author.status}
              </Badge> */}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-[var(--color-border)] shadow-sm p-6 md:p-8">
        <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-5">
          Profile Details
        </h2>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoRow
            label="Phone"
            icon={<Phone className="w-3.5 h-3.5" />}
            value={author.phone}
          />
          <InfoRow
            label="Designation"
            icon={<Briefcase className="w-3.5 h-3.5" />}
            value={author.designation}
          />
          <InfoRow
            label="Qualification"
            icon={<GraduationCap className="w-3.5 h-3.5" />}
            value={author.qualification}
          />
          <InfoRow
            label="Invited"
            icon={<Calendar className="w-3.5 h-3.5" />}
            value={formatDate(author.createdAt)}
          />
        </dl>

        {author.description && (
          <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)] mb-2 flex items-center gap-1.5">
              <FileText className="w-3 h-3" />
              Bio
            </p>
            <p className="text-sm text-[var(--color-text-body)] leading-relaxed whitespace-pre-line">
              {author.description}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon: React.ReactNode;
}) {
  const display = value?.trim() || "—";
  const isEmpty = !value?.trim();

  return (
    <div>
      <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)] flex items-center gap-1.5 mb-1">
        {icon}
        {label}
      </dt>
      <dd
        className={`text-sm font-semibold ${
          isEmpty
            ? "text-[var(--color-text-light)] italic"
            : "text-[var(--color-text-main)]"
        }`}
      >
        {display}
      </dd>
    </div>
  );
}

function Badge({
  children,
  icon,
  tone,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  tone: "primary" | "accent" | "peach" | "muted";
}) {
  const toneMap = {
    primary: {
      bg: "var(--color-primary-light)",
      fg: "var(--color-primary)",
      border: "rgba(30, 58, 95, 0.20)",
    },
    accent: {
      bg: "var(--color-accent-light)",
      fg: "var(--color-accent-hover)",
      border: "rgba(34, 197, 94, 0.30)",
    },
    peach: {
      bg: "var(--color-peach-light)",
      fg: "var(--color-peach-deep)",
      border: "rgba(249, 168, 88, 0.35)",
    },
    muted: {
      bg: "var(--color-surface-alt)",
      fg: "var(--color-text-muted)",
      border: "var(--color-border)",
    },
  } as const;
  const styles = toneMap[tone];

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
      style={{
        backgroundColor: styles.bg,
        color: styles.fg,
        borderColor: styles.border,
      }}
    >
      {icon}
      {children}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
