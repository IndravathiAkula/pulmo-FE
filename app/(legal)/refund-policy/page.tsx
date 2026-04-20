import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | PulmoPrep",
  description:
    "PulmoPrep's refund and cancellation policy for digital study materials.",
};

export default function RefundPolicyPage() {
  return (
    <article className="w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto">
      <header className="border-b border-[var(--color-border)] pb-8 mb-10">
 
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-text-main)] tracking-tight">
          Refund Policy
        </h1>
        {/* <p className="text-sm text-[var(--color-text-muted)] mt-3">
          Effective date: April 2026 &middot; Last updated: April 2026
        </p> */}
      </header>

      <div className="text-[15px] text-[var(--color-text-body)] leading-[1.8] space-y-10">
        <section>
          <H2>Overview</H2>
          <p>
            PulmoPrep sells digital educational content that is delivered instantly upon
            purchase. Because digital goods cannot be returned in the traditional sense, our
            refund policy is designed to be fair while protecting the intellectual property of
            our authors.
          </p>
        </section>

        <section>
          <H2>Eligibility for Refund</H2>
          <ul className="list-disc pl-6 space-y-3">
            <li>
              <strong>Within 7 days of purchase</strong> &mdash; You may request a full refund
              if you have not accessed or downloaded the content beyond the free preview. Once
              you open the full book in the secure reader, the refund window closes for that title.
            </li>
            <li>
              <strong>Technical issues</strong> &mdash; If you experience a persistent technical
              problem that prevents you from accessing purchased content and our support team
              is unable to resolve it within a reasonable timeframe, you are entitled to a full
              refund regardless of the 7-day window.
            </li>
            <li>
              <strong>Duplicate purchases</strong> &mdash; If you are charged twice for the same
              book due to a system error, the duplicate charge will be refunded automatically or
              upon request.
            </li>
          </ul>
        </section>

        <section>
          <H2>Non-Refundable Scenarios</H2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Content that has been accessed in the secure reader beyond the free preview page</li>
            <li>Requests made more than 7 days after purchase unless a technical issue applies</li>
            <li>Dissatisfaction with content quality after accessing the material &mdash; we recommend reviewing the free preview before purchasing</li>
            <li>Accounts suspended or terminated for violations of our Terms of Service</li>
          </ul>
        </section>

        <section>
          <H2>How to Request a Refund</H2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Email{" "}
              <a href="mailto:support@pulmoprep.com" className="text-[var(--color-primary)] font-semibold hover:underline">
                support@pulmoprep.com
              </a>{" "}
              with the subject line <strong>&ldquo;Refund Request&rdquo;</strong>.
            </li>
            <li>
              Include your registered email address, the title of the book, and the approximate
              date of purchase.
            </li>
            <li>Briefly describe the reason for your request.</li>
          </ol>
        </section>

        <section>
          <H2>Processing Time</H2>
          <p>
            Approved refunds are processed within <strong>5&ndash;10 business days</strong>. The
            refund will be credited to the original payment method. Once a refund is issued,
            access to the associated book will be revoked from your library.
          </p>
        </section>

        <section>
          <H2>Contact</H2>
          <p>
            If you have questions about this policy, contact us at{" "}
            <a href="mailto:support@pulmoprep.com" className="text-[var(--color-primary)] font-semibold hover:underline">
              support@pulmoprep.com
            </a>.
          </p>
        </section>
      </div>
    </article>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-extrabold text-[var(--color-text-main)] tracking-tight mb-3 mt-0">
      {children}
    </h2>
  );
}
