import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | PulmoPrep",
  description:
    "Terms governing the use of PulmoPrep's medical education platform and digital content.",
};

export default function TermsOfServicePage() {
  return (
    <article className="w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto">
      <header className="border-b border-[var(--color-border)] pb-8 mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-text-main)] tracking-tight">
          Terms of Service
        </h1>
        {/* <p className="text-sm text-[var(--color-text-muted)] mt-3">
          Effective date: April 2026 &middot; Last updated: April 2026
        </p> */}
      </header>

      <div className="text-[15px] text-[var(--color-text-body)] leading-[1.8] space-y-10">
        <section>
          <H2>1. Acceptance of Terms</H2>
          <p>
            By creating an account or using PulmoPrep, you agree to be
            bound by these Terms of Service. If you do not agree, do not use the Platform.
          </p>
        </section>

          <H2>2. Account Registration</H2>
        <section>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>You must provide accurate and complete information during registration.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You must notify us immediately of any unauthorized access to your account.</li>
            <li>You may not share, transfer, or sell your account to another person.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
          </ul>
        </section>

        <section>
          <H2>3. Content Licensing &amp; Intellectual Property</H2>
          <p>
            All study materials, books, images, and other content available on the Platform are
            protected by copyright and intellectual property laws.
          </p>
          <ul className="list-disc pl-6 space-y-1.5 mt-3">
            <li>Purchased books grant you a <strong>personal, non-transferable, non-exclusive license</strong> to access the content through our secure reader.</li>
            <li>You may <strong>not</strong> copy, reproduce, distribute, modify, publicly display, or create derivative works from any content.</li>
            <li>Screenshotting, screen-recording, printing, or circumventing DRM protections is strictly prohibited.</li>
            <li>Your license is perpetual for the lifetime of your account, subject to compliance with these terms.</li>
          </ul>
        </section>

        <section>
          <H2>4. Purchases &amp; Payments</H2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>All prices are displayed in the applicable currency and include applicable taxes unless stated otherwise.</li>
            <li>Payment is processed at the time of checkout. You receive instant access to purchased content upon successful payment.</li>
            <li>We use industry-standard payment processors and do not store your payment card details.</li>
            <li>Refunds are governed by our <Link href="/refund-policy" target="_blank" className="text-[var(--color-primary)] font-semibold hover:underline">Refund Policy</Link>.</li>
          </ul>
        </section>

        <section>
          <H2>5. Prohibited Conduct</H2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1.5 mt-3">
            <li>Use the Platform for any unlawful purpose</li>
            <li>Share account credentials or purchased content with others</li>
            <li>Attempt to bypass, disable, or circumvent any security or DRM measures</li>
            <li>Upload malicious files, viruses, or harmful code</li>
            <li>Scrape, crawl, or data-mine the Platform</li>
            <li>Impersonate another user, author, or administrator</li>
          </ul>
        </section>

        <section>
          <H2>6. Author Accounts</H2>
          <p>
            Author accounts are created by administrators. As an author, you represent that you have
            the right to publish the content you submit. By uploading content, you grant PulmoPrep a
            non-exclusive license to host, display, and distribute the content through the Platform.
            You retain ownership of your original work.
          </p>
        </section>

        <section>
          <H2>7. Limitation of Liability</H2>
          <p>
            To the maximum extent permitted by law, PulmoPrep and its officers, directors, employees,
            and agents shall not be liable for any indirect, incidental, special, consequential, or
            punitive damages arising from your use of the Platform, including but not limited to loss
            of data, revenue, or professional opportunity.
          </p>
          <p className="mt-3">
            Our total liability for any claim arising from these terms shall not exceed the amount
            you paid to us in the 12 months preceding the claim.
          </p>
        </section>

        <section>
          <H2>8. Disclaimer of Warranties</H2>
          <p>
            The Platform is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
            warranties of any kind, whether express or implied, including but not limited to
            warranties of merchantability, fitness for a particular purpose, and non-infringement.
          </p>
        </section>

        <section>
          <H2>9. Modifications</H2>
          <p>
            We reserve the right to modify these terms at any time. Material changes will be
            communicated via email or a prominent in-platform notice at least 30 days before they
            take effect. Your continued use of the Platform after the effective date constitutes
            acceptance.
          </p>
        </section>

        <section>
          <H2>10. Governing Law</H2>
          <p>
            These terms are governed by the laws of India. Any disputes shall be subject to the
            exclusive jurisdiction of the courts in Hyderabad, Telangana, India.
          </p>
        </section>

        <section>
          <H2>11. Contact</H2>
          <p>
            For questions about these Terms of Service, contact us at{" "}
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
