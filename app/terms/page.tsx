import Link from "next/link";
import { FiFileText, FiArrowLeft } from "react-icons/fi";

export const metadata = {
  title: "Terms & Conditions | SAASIO",
  description:
    "Read the Terms and Conditions governing your use of SAASIO, the AI-powered resume builder.",
};

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-10">
      <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-violet-100">
        {title}
      </h2>
      <div className="space-y-3 text-slate-600 leading-relaxed">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-violet-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-emerald-500 to-violet-500 flex items-center justify-center">
              <FiFileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-extrabold bg-linear-to-r from-emerald-500 to-violet-600 bg-clip-text text-transparent">
              SAASIO
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-violet-600 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title block */}
        <div className="mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold uppercase tracking-widest mb-3">
            Legal
          </span>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3">
            Terms &amp; Conditions
          </h1>
          <p className="text-slate-500 text-sm">
            Last updated: <strong>April 1, 2025</strong> &nbsp;·&nbsp; Effective
            date: <strong>April 1, 2025</strong>
          </p>
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <strong>Please read carefully.</strong> By accessing or using SAASIO,
            you agree to be bound by these Terms. If you do not agree, please do
            not use our service.
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-violet-100/60 p-8 md:p-12">
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using SAASIO (&ldquo;Service&rdquo;, &ldquo;we&rdquo;,
              &ldquo;our&rdquo;, or &ldquo;us&rdquo;), you (&ldquo;User&rdquo;,
              &ldquo;you&rdquo;) confirm that you have read, understood, and agree to
              be bound by these Terms and Conditions (&ldquo;Terms&rdquo;) and our{" "}
              <Link href="/privacy" className="text-violet-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
            <p>
              These Terms constitute a legally binding agreement between you and
              SAASIO. We reserve the right to modify these Terms at any time.
              Continued use of the Service after changes constitutes acceptance of
              the updated Terms.
            </p>
          </Section>

          <Section title="2. About SAASIO">
            <p>
              SAASIO is an AI-powered resume building platform that helps job
              seekers create ATS-optimized, professionally formatted resumes
              tailored to specific job descriptions. The Service is operated from
              India and is primarily intended for Indian job seekers, though it is
              accessible globally.
            </p>
            <p>
              <strong>Business Name:</strong> SAASIO
              <br />
              <strong>Contact Email:</strong> support@saasio.in
              <br />
              <strong>Country of Operation:</strong> India
            </p>
          </Section>

          <Section title="3. Eligibility">
            <p>
              You must be at least 18 years old to use SAASIO. By using the
              Service, you represent and warrant that you meet this age requirement
              and have the legal capacity to enter into a binding agreement.
            </p>
          </Section>

          <Section title="4. User Accounts">
            <p>
              To access certain features of SAASIO, you must create an account.
              You agree to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide accurate, current, and complete registration information</li>
              <li>Maintain the security and confidentiality of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate
              these Terms, engage in fraudulent activity, or cause harm to other
              users or the platform.
            </p>
          </Section>

          <Section title="5. Services and Usage">
            <p>
              SAASIO provides AI-generated resume content based on the job
              description and profile information you supply. You acknowledge that:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                AI-generated content is provided as a starting point and may
                require your review and editing
              </li>
              <li>
                You are solely responsible for the accuracy of information in your
                resume
              </li>
              <li>
                SAASIO does not guarantee employment, interviews, or any specific
                outcomes from the use of our Service
              </li>
              <li>
                You must not use the Service for any unlawful, fraudulent, or
                deceptive purpose
              </li>
            </ul>
          </Section>

          <Section id="payment" title="6. Payment Terms">
            <p>
              SAASIO offers one-time payment plans for resume credits. All prices
              are displayed in Indian Rupees (INR) and are inclusive of applicable
              Goods and Services Tax (GST).
            </p>
            <p>
              <strong>Current Pricing:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Starter Plan: ₹9 for 1 resume</li>
              <li>Growth Plan: ₹39 for 5 resumes</li>
              <li>Pro Plan: ₹69 for 10 resumes</li>
            </ul>
            <p>
              Payments are processed securely through{" "}
              <strong>Razorpay Payment Solutions Pvt. Ltd.</strong>, a PCI-DSS
              Level 1 compliant payment gateway. We do not store your card details
              on our servers. By initiating a payment, you also agree to Razorpay&apos;s
              terms of service.
            </p>
            <p>
              All transactions are final once a payment is successfully processed.
              Resume credits are added to your account immediately upon payment
              confirmation.
            </p>
          </Section>

          <Section id="refund" title="7. Refund Policy">
            <p>
              Due to the digital and immediate nature of our Service, all
              purchases are generally <strong>non-refundable</strong> once resume
              credits have been consumed (i.e., a resume has been generated).
            </p>
            <p>
              However, we offer refunds in the following circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Technical failure:</strong> If you were charged but did not
                receive credits due to a technical error, we will issue a full
                refund or credit upon verification.
              </li>
              <li>
                <strong>Duplicate payment:</strong> If you were charged twice for
                the same order, the duplicate charge will be fully refunded.
              </li>
              <li>
                <strong>Unused credits:</strong> If you have purchased credits and
                none have been used, you may request a refund within 7 days of
                purchase by contacting support@saasio.in.
              </li>
            </ul>
            <p>
              To request a refund, email us at <strong>support@saasio.in</strong>{" "}
              with your registered email address, transaction ID, and reason for
              the refund request. Approved refunds will be processed within 5–7
              business days to the original payment method.
            </p>
          </Section>

          <Section id="shipping" title="8. Delivery Policy">
            <p>
              SAASIO is a digital service. There is no physical delivery of goods.
              All deliverables — AI-generated resume content, PDF downloads, and
              account credits — are made available digitally within your SAASIO
              account immediately upon successful payment, or within a reasonable
              time in the event of a processing delay.
            </p>
          </Section>

          <Section title="9. Intellectual Property">
            <p>
              All content, software, technology, trademarks, and materials
              available through SAASIO are the intellectual property of SAASIO or
              its licensors. You may not copy, reproduce, distribute, or create
              derivative works without express written permission.
            </p>
            <p>
              You retain full ownership of the resume content you generate using
              our platform. By using the Service, you grant SAASIO a limited,
              non-exclusive license to process your input data solely for the
              purpose of providing the Service.
            </p>
          </Section>

          <Section title="10. Prohibited Activities">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                Use the Service to create false, misleading, or fraudulent resumes
              </li>
              <li>Attempt to reverse-engineer, scrape, or exploit our AI systems</li>
              <li>Violate any applicable laws or regulations</li>
              <li>
                Use automated tools or bots to interact with the Service without
                our prior written consent
              </li>
              <li>Share your account credentials with others</li>
              <li>Engage in any activity that could harm other users or our systems</li>
            </ul>
          </Section>

          <Section title="11. Disclaimer of Warranties">
            <p>
              The Service is provided &ldquo;AS IS&rdquo; and &ldquo;AS
              AVAILABLE&rdquo; without warranties of any kind, express or implied,
              including but not limited to warranties of merchantability, fitness
              for a particular purpose, or non-infringement.
            </p>
            <p>
              We do not warrant that the Service will be uninterrupted, error-free,
              or that the AI-generated content will be accurate, complete, or
              suitable for any particular purpose.
            </p>
          </Section>

          <Section title="12. Limitation of Liability">
            <p>
              To the maximum extent permitted by applicable law, SAASIO and its
              affiliates, officers, employees, and agents shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages
              arising from your use of or inability to use the Service.
            </p>
            <p>
              Our total liability to you for any claim arising from these Terms or
              the Service shall not exceed the amount you paid to SAASIO in the
              three months preceding the claim.
            </p>
          </Section>

          <Section title="13. Indemnification">
            <p>
              You agree to indemnify and hold harmless SAASIO, its affiliates,
              and their respective officers, directors, employees, and agents from
              any claims, damages, losses, or expenses (including reasonable legal
              fees) arising from your use of the Service, violation of these Terms,
              or infringement of any third-party rights.
            </p>
          </Section>

          <Section title="14. Governing Law and Dispute Resolution">
            <p>
              These Terms are governed by and construed in accordance with the laws
              of India. Any disputes arising from these Terms or the use of SAASIO
              shall be subject to the exclusive jurisdiction of the courts located
              in India.
            </p>
            <p>
              We encourage you to contact us first at{" "}
              <strong>support@saasio.in</strong> to resolve any disputes
              informally before initiating legal proceedings.
            </p>
          </Section>

          <Section title="15. Changes to These Terms">
            <p>
              We reserve the right to update or modify these Terms at any time.
              We will notify registered users of material changes via email or a
              prominent notice on our website at least 7 days before the changes
              take effect. Your continued use of the Service after the effective
              date constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="16. Contact Us">
            <p>
              If you have any questions, concerns, or requests regarding these
              Terms, please contact us:
            </p>
            <div className="bg-violet-50 rounded-xl p-4 border border-violet-100 text-sm">
              <p>
                <strong>SAASIO Support</strong>
                <br />
                Email:{" "}
                <a
                  href="mailto:support@saasio.in"
                  className="text-violet-600 hover:underline"
                >
                  support@saasio.in
                </a>
                <br />
                Country: India
              </p>
            </div>
          </Section>
        </div>

        {/* Quick nav */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Also read our{" "}
            <Link href="/privacy" className="text-violet-600 font-semibold hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-16 py-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} SAASIO · All rights reserved ·{" "}
        <Link href="/" className="hover:text-violet-500 transition-colors">
          Back to Home
        </Link>
      </footer>
    </div>
  );
}
