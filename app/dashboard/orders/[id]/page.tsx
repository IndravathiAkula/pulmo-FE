import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCcw,
  BookOpen,
  Receipt,
  Hash,
  CreditCard,
  Calendar,
} from "lucide-react";
import { paymentsService } from "@/server/catalog/payments.service";
import { resolveFileUrl } from "@/lib/resolve-file-url";
import type { PaymentResponse, PaymentStatus } from "@/server/api/apiTypes";

/**
 * /dashboard/orders/[id] — line-item breakdown for a single payment.
 *
 * Backend-side ownership is enforced — `GET /payments/my/{id}` returns
 * 404 for payments that don't belong to the caller, so we just trust
 * the response and `notFound()` if the service can't find it.
 */

const STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; icon: typeof CheckCircle2; fg: string; bg: string; border: string }
> = {
  SUCCESS: {
    label: "Paid",
    icon: CheckCircle2,
    fg: "var(--color-accent-hover)",
    bg: "var(--color-accent-light)",
    border: "rgba(34, 197, 94, 0.30)",
  },
  PENDING: {
    label: "Pending",
    icon: Clock,
    fg: "var(--color-peach-deep)",
    bg: "var(--color-peach-light)",
    border: "rgba(249, 168, 88, 0.35)",
  },
  CREATED: {
    label: "Created",
    icon: Clock,
    fg: "var(--color-blue-500)",
    bg: "var(--color-sky-light)",
    border: "rgba(56, 189, 248, 0.35)",
  },
  FAILED: {
    label: "Failed",
    icon: XCircle,
    fg: "var(--color-error)",
    bg: "#FEE2E2",
    border: "rgba(220, 38, 38, 0.30)",
  },
  REFUNDED: {
    label: "Refunded",
    icon: RefreshCcw,
    fg: "var(--color-text-muted)",
    bg: "var(--color-surface-alt)",
    border: "var(--color-border)",
  },
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await paymentsService.getMy(id);

  if (!result.ok) {
    // 404, 403, or any other error — surface as not-found so we don't
    // disclose whether the payment exists for someone else.
    notFound();
  }

  const payment: PaymentResponse = result.data;
  const config = STATUS_CONFIG[payment.status];
  const StatusIcon = config.icon;
  const currencyPrefix =
    payment.currency === "USD" || !payment.currency ? "$" : "";

  // Compute discount total for the bottom-of-receipt summary.
  const subtotal = payment.items.reduce((acc, i) => acc + i.price, 0);
  const discountTotal = payment.items.reduce(
    (acc, i) => acc + (i.discount ?? 0),
    0
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back nav */}
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors mb-4"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
        All orders
      </Link>

      {/* Header card */}
      <section
        className="rounded-3xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden mb-5"
      >
        <div
          className="px-6 py-6 flex items-start justify-between gap-4 flex-wrap"
          style={{
            background:
              "linear-gradient(135deg, #FFF8F0 0%, #FFECD2 50%, #E8EFF8 100%)",
          }}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border"
                style={{
                  backgroundColor: config.bg,
                  color: config.fg,
                  borderColor: config.border,
                }}
              >
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[var(--color-text-main)] mt-2 tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[var(--color-primary)]" />
              Order Details
            </h1>
            {/* <p className="text-xs text-[var(--color-text-muted)] font-mono mt-1 truncate">
              #{payment.paymentId}
            </p> */}
          </div>

          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              Total Paid
            </p>
            <p className="text-2xl md:text-3xl font-black text-[var(--color-text-main)] tabular-nums">
              {currencyPrefix}
              {payment.amount.toFixed(2)}
              {payment.currency && payment.currency !== "USD" && (
                <span className="text-sm font-bold text-[var(--color-text-muted)] ml-1">
                  {payment.currency}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Meta grid */}
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-[var(--color-border)]">
          <MetaCell
            icon={<Calendar className="w-4 h-4" />}
            label="Placed"
            value={formatDateTime(payment.createdAt)}
          />
          {/* <MetaCell
            icon={<CheckCircle2 className="w-4 h-4" />}
            label={
              payment.status === "FAILED"
                ? "Failed at"
                : payment.status === "REFUNDED"
                  ? "Refunded at"
                  : "Approved"
            }
            value={formatDateTime(
              payment.status === "FAILED"
                ? payment.rejectedAt
                : payment.approvedAt
            )}
          /> */}
          <MetaCell
            icon={<CreditCard className="w-4 h-4" />}
            label="Method"
            value={payment.paymentMethod || "—"}
          />
        </div>

        {payment.rejectionReason && (
          <div className="mx-6 mb-5 px-4 py-3 rounded-xl bg-red-50/40 border border-red-200 text-xs text-[var(--color-error)] font-semibold leading-relaxed">
            <span className="font-black uppercase tracking-wider mr-1">
              Reason:
            </span>
            {payment.rejectionReason}
          </div>
        )}
      </section>

      {/* Line items */}
      <section className="rounded-3xl border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
        <header className="px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]/60 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-[var(--color-text-main)] flex items-center gap-2">
            <Hash className="w-4 h-4 text-[var(--color-primary)]" />
            Items ({payment.items.length})
          </h2>
        </header>

        <ul className="divide-y divide-[var(--color-border)]">
          {payment.items.map((item) => (
            <li key={item.bookId} className="p-4 sm:p-5">
              <div className="flex items-start gap-4 flex-wrap">
                <Link
                  href={`/books/${item.bookId}`}
                  aria-label={`Open ${item.title}`}
                  className="block relative w-16 h-20 rounded-lg overflow-hidden bg-[var(--color-surface-alt)] flex-shrink-0 shadow-sm"
                >
                  {resolveFileUrl(item.coverUrl) ? (
                    <Image
                      src={resolveFileUrl(item.coverUrl)!}
                      alt={`Cover of ${item.title}`}
                      width={64}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)]">
                      <BookOpen className="w-5 h-5" />
                    </div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/books/${item.bookId}`}
                    className="text-sm font-extrabold text-[var(--color-text-main)] hover:text-[var(--color-primary)] transition-colors line-clamp-2 leading-snug"
                  >
                    {item.title}
                  </Link>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    by {item.authorName}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  {item.discount && item.discount > 0 ? (
                    <>
                      <p className="text-sm font-black text-[var(--color-text-main)] tabular-nums">
                        {currencyPrefix}
                        {item.effectivePrice.toFixed(2)}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)] line-through tabular-nums">
                        {currencyPrefix}
                        {item.price.toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-black text-[var(--color-text-main)] tabular-nums">
                      {currencyPrefix}
                      {item.effectivePrice.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Totals */}
        <div className="px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]/60 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
            <span>Subtotal</span>
            <span className="tabular-nums font-semibold">
              {currencyPrefix}
              {subtotal.toFixed(2)}
            </span>
          </div>
          {discountTotal > 0 && (
            <div className="flex items-center justify-between text-xs text-[var(--color-accent-hover)]">
              <span>Discount</span>
              <span className="tabular-nums font-semibold">
                −{currencyPrefix}
                {discountTotal.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-base font-black text-[var(--color-text-main)] pt-2 border-t border-[var(--color-border)]">
            <span>Total</span>
            <span className="tabular-nums">
              {currencyPrefix}
              {payment.amount.toFixed(2)}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetaCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          {label}
        </p>
        <p className="text-sm font-bold text-[var(--color-text-body)] mt-0.5 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}
