import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | PulmoPrep",
  description:
    "How PulmoPrep collects, uses, stores, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto">
      <header className="border-b border-[var(--color-border)] pb-8 mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-text-main)] tracking-tight">
          Privacy Policy
        </h1>
        {/* <p className="text-sm text-[var(--color-text-muted)] mt-3">
          Effective date: April 2026 &middot; Last updated: April 2026
        </p> */}
      </header>

      <div className="text-[15px] text-[var(--color-text-body)] leading-[1.8] space-y-10">
        <section>
          <H2>1. Introduction</H2>
          <p>
            PulmoPrep operates a medical
            education platform that provides digital study materials, practice questions, and
            related services for pulmonary medicine professionals and students. This Privacy Policy
            explains how we collect, use, disclose, and safeguard your information when you use our
            website and services.
          </p>
        </section>

        <section>
          <H2>2. Information We Collect</H2>
          <H3>Personal Information</H3>
          <ul className="list-disc pl-6 space-y-1.5 mb-4">
            <li>Name, email address, and phone number provided during registration</li>
            <li>Professional designation, qualification, and institutional affiliation</li>
            <li>Profile photograph if voluntarily uploaded</li>
            <li>Payment information processed securely through our payment provider &mdash; we do not store card details</li>
          </ul>

          <H3>Usage Information</H3>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Pages viewed, books accessed, reading progress, and session duration</li>
            <li>Device type, browser, IP address, and approximate location</li>
            <li>Interactions with features such as the shopping cart, checkout, and search</li>
          </ul>
        </section>

        <section>
          <H2>3. How We Use Your Information</H2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>To create and manage your account</li>
            <li>To process purchases, grant book access, and deliver digital content</li>
            <li>To personalize your learning experience such as recently viewed items and reading progress</li>
            <li>To communicate important service updates and security notifications</li>
            <li>To improve our platform through aggregated, anonymized analytics</li>
            <li>To comply with legal obligations applicable to medical education platforms</li>
          </ul>
        </section>

        <section>
          <H2>4. Data Sharing &amp; Disclosure</H2>
          <p>
            We do <strong>not</strong> sell, rent, or trade your personal information to third
            parties. We may share data with:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 mt-3">
            <li><strong>Payment processors</strong> to complete transactions securely</li>
            <li><strong>Cloud infrastructure providers</strong> for hosting and storage</li>
            <li><strong>Legal authorities</strong> when required by law or to protect our rights</li>
          </ul>
        </section>

        <section>
          <H2>5. Data Retention</H2>
          <p>
            We retain your personal data for as long as your account is active or as needed to
            provide services. If you request account deletion, we will remove your personal data
            within 30 days, except where retention is required by law such as transaction records
            for tax compliance.
          </p>
        </section>

        <section>
          <H2>6. Data Security</H2>
          <p>
            We implement industry-standard security measures including encrypted data transmission
            (TLS/SSL), secure password hashing, token-based authentication with automatic rotation,
            and role-based access controls. However, no method of electronic transmission is 100%
            secure, and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <H2>7. Your Rights</H2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-1.5 mt-3">
            <li>Access, correct, or delete your personal data</li>
            <li>Object to or restrict certain processing activities</li>
            <li>Request a portable copy of your data</li>
            <li>Withdraw consent at any time where processing is consent-based</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, contact us at{" "}
            <A href="mailto:support@pulmoprep.com">support@pulmoprep.com</A>.
          </p>
        </section>

        <section>
          <H2>8. Cookies</H2>
          <p>
            We use essential cookies for authentication and session management. We do not use
            third-party tracking cookies. You can manage cookie preferences through your browser
            settings.
          </p>
        </section>

        <section>
          <H2>9. Changes to This Policy</H2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material
            changes via email or a prominent notice on our platform. Continued use of the service
            after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <H2>10. Contact Us</H2>
          <p>
            If you have questions about this Privacy Policy, contact our Data Protection team
            at <A href="mailto:support@pulmoprep.com">support@pulmoprep.com</A>.
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

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-[var(--color-text-main)] uppercase tracking-wider mb-2 mt-4">
      {children}
    </h3>
  );
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-[var(--color-primary)] font-semibold hover:underline">
      {children}
    </a>
  );
}
