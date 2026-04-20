import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medical Disclaimer | PulmoPrep",
  description:
    "Important disclaimer regarding the educational nature of PulmoPrep's content.",
};

export default function DisclaimerPage() {
  return (
    <article className="w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto">
      <header className="border-b border-[var(--color-border)] pb-8 mb-10">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">
          Legal
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--color-text-main)] tracking-tight">
          Medical Disclaimer
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-3">
          Effective date: April 2026 &middot; Last updated: April 2026
        </p>
      </header>

      <div className="text-[15px] text-[var(--color-text-body)] leading-[1.8] space-y-10">
        {/* Prominent warning */}
        <div className="border-l-4 border-[var(--color-peach-deep)] bg-[var(--color-peach-light)] rounded-r-xl px-6 py-5">
          <p className="text-[15px] font-semibold text-[var(--color-text-main)] leading-relaxed">
            The content provided on PulmoPrep is for <strong>educational and informational
            purposes only</strong>. It is not intended to be a substitute for professional
            medical advice, diagnosis, or treatment. Always seek the advice of a qualified
            healthcare provider with any questions you may have regarding a medical condition.
          </p>
        </div>

        <section>
          <H2>1. Educational Purpose</H2>
          <p>
            PulmoPrep is a medical education platform designed to assist medical students,
            residents, and practicing physicians in their exam preparation and continuing
            professional development in pulmonary medicine. All books, study notes, practice
            questions, and other materials are created for academic learning.
          </p>
        </section>

        <section>
          <H2>2. Not Medical Advice</H2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              The materials on this platform do <strong>not</strong> constitute medical advice
              and should not be relied upon for clinical decision-making in patient care.
            </li>
            <li>
              No doctor&ndash;patient or provider&ndash;patient relationship is created by
              using this platform or purchasing its content.
            </li>
            <li>
              Treatment protocols, drug dosages, and clinical guidelines referenced in study
              materials may not reflect the most current evidence or local practice variations.
              Always verify with primary sources and current guidelines before clinical
              application.
            </li>
          </ul>
        </section>

        <section>
          <H2>3. Accuracy &amp; Currency</H2>
          <p>
            While we strive to ensure that all content is accurate, up-to-date, and evidence-based:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-3">
            <li>
              Medical knowledge evolves rapidly. Information that was current at the time of
              publication may become outdated. We recommend cross-referencing with the latest
              editions of standard textbooks and published clinical guidelines.
            </li>
            <li>
              We make no guarantees regarding exam outcomes. Success in medical examinations
              depends on multiple factors beyond the scope of any single study resource.
            </li>
            <li>
              Errors and omissions, while rare, may occur. If you identify an inaccuracy,
              please report it to{" "}
              <a href="mailto:support@pulmoprep.com" className="text-[var(--color-primary)] font-semibold hover:underline">
                support@pulmoprep.com
              </a>{" "}
              so we can review and correct it promptly.
            </li>
          </ul>
        </section>

        <section>
          <H2>4. Drug Information</H2>
          <p>
            Any drug names, dosages, indications, or contraindications mentioned in study
            materials are for educational reference only. Before prescribing or administering
            any medication:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 mt-3">
            <li>Consult the official prescribing information and approved drug label</li>
            <li>Verify dosages against current pharmacological references</li>
            <li>Consider patient-specific factors such as allergies, renal/hepatic function, and drug interactions</li>
            <li>Follow your institution&rsquo;s formulary and protocols</li>
          </ul>
        </section>

        <section>
          <H2>5. Third-Party Content</H2>
          <p>
            Some materials may reference external resources, clinical studies, or third-party
            publications. PulmoPrep does not endorse, guarantee, or assume responsibility for
            the accuracy or reliability of any third-party content. Links to external sites
            are provided for convenience and do not constitute an endorsement.
          </p>
        </section>

        <section>
          <H2>6. Limitation of Liability</H2>
          <p>
            PulmoPrep, its authors, editors, and affiliates shall not be held liable for any
            adverse outcomes, injuries, or damages arising from the use or misuse of information
            provided on this platform. By using our services, you acknowledge and accept this
            limitation.
          </p>
        </section>

        <section>
          <H2>7. Regulatory Compliance</H2>
          <p>
            PulmoPrep operates as an educational content platform, not a healthcare provider
            or medical device. We comply with applicable information technology and data
            protection regulations. Our platform is not subject to medical device regulations
            as it does not provide diagnostic, therapeutic, or clinical-decision-support
            functionality.
          </p>
        </section>

        <section>
          <H2>8. Contact</H2>
          <p>
            If you have concerns about any content on PulmoPrep, please contact us at{" "}
            <a href="mailto:support@pulmoprep.com" className="text-[var(--color-primary)] font-semibold hover:underline">
              support@pulmoprep.com
            </a>.
            We take content accuracy seriously and will review all reported concerns promptly.
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
