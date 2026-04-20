import Link from "next/link";
import {
  Receipt,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCcw,
  Package,
  Calendar,
} from "lucide-react";
import { paymentsService } from "@/server/catalog/payments.service";
import type {
  PagedResponse,
  PaymentResponse,
  PaymentStatus,
} from "@/server/api/apiTypes";
import { EmptyState } from "@/client/ui/feedback/EmptyState";

/**
 * /dashboard/orders — transaction history for the current user.
 *
 * Wired to `GET /payments/my` (paged by default, `createdAt,desc`).
 * Each row links to `/dashboard/orders/{paymentId}` for a line-item
 * breakdown. Lives under /dashboard so the sidebar nav persists.
 */

const PAGE_SIZE = 12;

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

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: rawPage } = await searchParams;
  const page = parsePage(rawPage);

  const result = await paymentsService.listMy({
    page,
    size: PAGE_SIZE,
    sort: "createdAt,desc",
  });

  const paged: PagedResponse<PaymentResponse> = result.ok
    ? result.data
    : { content: [], page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 0 };

  const isEmpty = paged.content.length === 0;
  const totalPages = Math.max(paged.totalPages, 1);
  const currentPage = paged.page;

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
     
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text-main)] tracking-tight">
            Order History
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {isEmpty
              ? "You haven't placed any orders yet."
              : `${paged.totalElements} ${paged.totalElements === 1 ? "order" : "orders"}`}
          </p>
        </div>

        {/* <Link
          href="/dashboard/library"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[var(--color-primary)] bg-[var(--color-primary-light)] hover:bg-[var(--color-primary)] hover:text-white transition-colors self-start"
        >
          <Package className="w-4 h-4" />
          View library
        </Link> */}
      </header>

      {isEmpty ? (
        <EmptyState
          icon={Receipt}
          title="No orders yet"
          description="Your purchase history will show up here after your first checkout."
          action={{
            label: "Browse catalog",
            href: "/departments/all-departments",
            icon: ArrowRight,
          }}
        />
      ) : (
        <>
          <ul className="space-y-3">
            {paged.content.map((payment) => (
              <OrderRow key={payment.paymentId} payment={payment} />
            ))}
          </ul>

          {totalPages > 1 && (
            <nav
              aria-label="Orders pagination"
              className="mt-8 flex items-center justify-between gap-4 flex-wrap"
            >
              <p className="text-xs text-[var(--color-text-muted)] font-semibold">
                Page{" "}
                <span className="font-black text-[var(--color-text-main)]">
                  {currentPage + 1}
                </span>{" "}
                of{" "}
                <span className="font-black text-[var(--color-text-main)]">
                  {totalPages}
                </span>
                <span className="mx-2">·</span>
                {paged.totalElements} total
              </p>
              <div className="flex items-center gap-2">
                <PageLink
                  disabled={currentPage <= 0}
                  page={currentPage - 1}
                  label="Previous"
                  icon="left"
                />
                <PageLink
                  disabled={currentPage + 1 >= totalPages}
                  page={currentPage + 1}
                  label="Next"
                  icon="right"
                />
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function OrderRow({ payment }: { payment: PaymentResponse }) {
  const config = STATUS_CONFIG[payment.status];
  const Icon = config.icon;
  const itemCount = payment.items.length;

  return (
    <li>
      <Link
        href={`/dashboard/orders/${payment.paymentId}`}
        className="group block rounded-2xl border border-[var(--color-border)] bg-white shadow-sm hover:border-[var(--color-border-hover)] hover:shadow-md transition-all p-4 sm:p-5"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border"
                style={{
                  backgroundColor: config.bg,
                  color: config.fg,
                  borderColor: config.border,
                }}
              >
                <Icon className="w-3 h-3" />
                {config.label}
              </span>
              <p className="text-[11px] text-[var(--color-text-muted)] font-mono truncate">
                #{payment.paymentId.slice(0, 8)}
              </p>
            </div>

            <p className="text-sm font-bold text-[var(--color-text-main)] mt-2 group-hover:text-[var(--color-primary)] transition-colors">
              {itemCount} {itemCount === 1 ? "book" : "books"}
              {payment.items[0] && (
                <span className="font-semibold text-[var(--color-text-muted)]">
                  {" — "}
                  {payment.items[0].title}
                  {itemCount > 1 && ` +${itemCount - 1} more`}
                </span>
              )}
            </p>

            <p className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {formatDate(payment.createdAt)}
              {payment.paymentMethod && (
                <>
                  <span>·</span>
                  <span className="uppercase tracking-wider font-semibold">
                    {payment.paymentMethod}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-lg font-black text-[var(--color-text-main)] tabular-nums">
              {payment.currency === "USD" || !payment.currency ? "$" : ""}
              {payment.amount.toFixed(2)}
              {payment.currency && payment.currency !== "USD" && (
                <span className="text-xs font-bold text-[var(--color-text-muted)] ml-1">
                  {payment.currency}
                </span>
              )}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-primary)] mt-1 group-hover:translate-x-0.5 transition-transform">
              View details
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function PageLink({
  page,
  label,
  icon,
  disabled,
}: {
  page: number;
  label: string;
  icon: "left" | "right";
  disabled: boolean;
}) {
  const className = `inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
    disabled
      ? "text-[var(--color-text-light)] bg-[var(--color-surface-alt)] border border-[var(--color-border)] cursor-not-allowed"
      : "text-[var(--color-text-body)] bg-white border border-[var(--color-border)] hover:bg-[var(--color-surface)] hover:border-[var(--color-border-hover)]"
  }`;

  if (disabled) {
    return (
      <span aria-disabled="true" className={className}>
        {icon === "left" && <ChevronLeft className="w-3.5 h-3.5" />}
        {label}
        {icon === "right" && <ChevronRight className="w-3.5 h-3.5" />}
      </span>
    );
  }

  return (
    <Link href={`/dashboard/orders?page=${page}`} className={className}>
      {icon === "left" && <ChevronLeft className="w-3.5 h-3.5" />}
      {label}
      {icon === "right" && <ChevronRight className="w-3.5 h-3.5" />}
    </Link>
  );
}
