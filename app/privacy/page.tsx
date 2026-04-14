import { LegalPageShell } from "@/components/landing/legal-shell";

export const metadata = {
  title: "Privacy Policy | SAASIO",
  description:
    "Learn how SAASIO collects, uses, and protects your personal data.",
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
    <section id={id} className="mb-10 scroll-mt-28">
      <h2 className="mb-4 border-b border-[#f1e5d7] pb-2 font-heading text-xl font-bold text-slate-900">
        {title}
      </h2>
      <div className="space-y-3 leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy Policy"
      description="How SAASIO collects, uses, protects, and retains your information while you build and manage resumes on the platform."
      updated="April 1, 2025"
      effective="April 1, 2025"
      navLinks={[
        { label: "Overview", href: "#top" },
        { label: "Collection", href: "#collection" },
        { label: "Payments", href: "#payments" },
        { label: "Retention", href: "#retention" },
      ]}
      highlights={[
        {
          title: "No card storage",
          copy: "Payments run through Razorpay and SAASIO does not store your full card details.",
        },
        {
          title: "Protected data",
          copy: "We use encrypted connections, hashed passwords, and restricted data access practices.",
        },
        {
          title: "User rights",
          copy: "You can request access, correction, deletion, portability, or withdrawal of consent.",
        },
        {
          title: "Support contact",
          copy: "Privacy questions can be sent to support@saasio.in.",
        },
      ]}
      alternateHref="/terms"
      alternateLabel="Terms & Conditions"
    >
      <div className="mb-10 rounded-[1.5rem] border border-[#d5eadf] bg-[#f2fbf7] p-4 text-sm text-[#16624d]">
        Your privacy matters to us. This policy explains clearly what data we
        collect, how we use it, and your rights regarding your information.
      </div>

      <Section title="1. Introduction">
        <p>
          SAASIO (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;)
          is committed to protecting your privacy. This Privacy Policy explains
          how we collect, use, disclose, and safeguard your personal information
          when you use our AI-powered resume building platform (the
          &ldquo;Service&rdquo;).
        </p>
        <p>
          By using SAASIO, you consent to the data practices described in this
          Privacy Policy. If you do not agree, please do not use our Service.
        </p>
      </Section>

      <Section id="collection" title="2. Information We Collect">
        <p>
          We collect information you provide directly to us and information
          automatically collected when you use the Service.
        </p>
        <p>
          <strong>Information you provide:</strong>
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Account information:</strong> Name, email address, mobile
            number, and password when you register
          </li>
          <li>
            <strong>Profile information:</strong> Professional background,
            skills, work experience, and education details you enter to build
            your resume
          </li>
          <li>
            <strong>Job description data:</strong> Job descriptions you paste
            or type into the platform for AI matching
          </li>
          <li>
            <strong>Payment information:</strong> Billing details submitted
            during checkout (processed by Razorpay - we do not store card
            numbers or CVV)
          </li>
          <li>
            <strong>Communications:</strong> Messages you send to our support
            team
          </li>
        </ul>
        <p>
          <strong>Information collected automatically:</strong>
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Usage data:</strong> Pages visited, features used, time
            spent, actions taken within the platform
          </li>
          <li>
            <strong>Device information:</strong> Browser type, operating
            system, device type, screen resolution
          </li>
          <li>
            <strong>IP address and location:</strong> Approximate geographic
            location derived from your IP address
          </li>
          <li>
            <strong>Cookies and similar technologies:</strong> Session tokens,
            authentication cookies, analytics cookies
          </li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Information">
        <p>We use the information collected to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Create and manage your account</li>
          <li>
            Generate AI-powered, tailored resume content based on your input
          </li>
          <li>Process payments and manage your resume credits</li>
          <li>
            Send transactional emails (OTP, payment confirmation, receipts)
          </li>
          <li>
            Provide customer support and respond to your inquiries
          </li>
          <li>
            Improve our AI models and Service quality (using anonymized,
            aggregated data)
          </li>
          <li>Detect and prevent fraud, abuse, and security incidents</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p>
          We do <strong>not</strong> sell, rent, or trade your personal
          information to third parties for marketing purposes.
        </p>
      </Section>

      <Section id="payments" title="4. Payment Processing (Razorpay)">
        <p>
          All payments on SAASIO are processed by{" "}
          <strong>Razorpay Payment Solutions Pvt. Ltd.</strong>, a
          Reserve Bank of India (RBI)-authorised payment aggregator and
          PCI-DSS Level 1 certified payment processor.
        </p>
        <p>
          When you make a payment:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Your card number, CVV, and banking credentials are entered directly
            into Razorpay&apos;s secure checkout and are{" "}
            <strong>never transmitted to or stored by SAASIO</strong>
          </li>
          <li>
            Razorpay may collect and retain your payment information in
            accordance with their own{" "}
            <a
              href="https://razorpay.com/privacy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d9481f] hover:underline"
            >
              Privacy Policy
            </a>
          </li>
          <li>
            We receive a transaction ID, payment status, and masked payment
            details (last 4 digits of card) from Razorpay for record-keeping
          </li>
        </ul>
        <p>
          All payment data is transmitted over encrypted HTTPS connections.
        </p>
      </Section>

      <Section title="5. Data Sharing and Disclosure">
        <p>We share your information only in the following limited circumstances:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Service providers:</strong> Trusted third-party vendors
            who help us operate the Service (e.g., Razorpay for payments,
            email service providers for transactional emails, cloud hosting
            providers). These parties are bound by confidentiality obligations.
          </li>
          <li>
            <strong>Legal compliance:</strong> When required by law, court
            order, or government authority, or to protect the rights, property,
            or safety of SAASIO, our users, or the public.
          </li>
          <li>
            <strong>Business transfers:</strong> In connection with a merger,
            acquisition, or sale of assets, your information may be
            transferred. We will notify you before your data is subject to a
            different privacy policy.
          </li>
          <li>
            <strong>With your consent:</strong> In any other circumstances
            with your explicit consent.
          </li>
        </ul>
      </Section>

      <Section title="6. Data Security">
        <p>
          We implement industry-standard security measures to protect your
          personal information:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            All data in transit is encrypted using TLS (Transport Layer
            Security) / HTTPS
          </li>
          <li>Passwords are hashed using bcrypt before storage</li>
          <li>
            Authentication uses JWT (JSON Web Tokens) with short expiry windows
          </li>
          <li>
            Our payment integration with Razorpay is PCI-DSS compliant
          </li>
          <li>
            Access to user data is restricted to authorized personnel only
          </li>
          <li>Regular security audits and vulnerability assessments</li>
        </ul>
        <p>
          While we take every precaution, no method of transmission over the
          internet is 100% secure. We cannot guarantee absolute security of
          your data.
        </p>
      </Section>

      <Section title="7. Cookies and Tracking Technologies">
        <p>We use the following types of cookies and similar technologies:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Essential cookies:</strong> Required for the Service to
            function (session management, authentication)
          </li>
          <li>
            <strong>Preference cookies:</strong> Remember your settings and
            preferences
          </li>
          <li>
            <strong>Analytics cookies:</strong> Help us understand how users
            interact with our platform to improve the Service (anonymized data
            only)
          </li>
        </ul>
        <p>
          You can control or disable cookies through your browser settings.
          Note that disabling essential cookies may affect the functionality
          of the Service.
        </p>
      </Section>

      <Section id="retention" title="8. Data Retention">
        <p>
          We retain your personal data for as long as your account is active or
          as needed to provide you the Service. Specifically:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Account data:</strong> Retained until you request account
            deletion
          </li>
          <li>
            <strong>Resume content:</strong> Retained as long as you maintain
            an active account
          </li>
          <li>
            <strong>Payment records:</strong> Retained for 7 years as required
            by Indian tax and financial regulations
          </li>
          <li>
            <strong>Support communications:</strong> Retained for 2 years after
            resolution
          </li>
        </ul>
        <p>
          Upon account deletion, we will delete your personal data within 30
          days, except where retention is required by law.
        </p>
      </Section>

      <Section title="9. Your Rights">
        <p>
          As a user, you have the following rights regarding your personal data:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Access:</strong> Request a copy of the personal data we
            hold about you
          </li>
          <li>
            <strong>Correction:</strong> Request correction of inaccurate or
            incomplete data
          </li>
          <li>
            <strong>Deletion:</strong> Request deletion of your personal data
            (&ldquo;right to be forgotten&rdquo;), subject to legal retention
            requirements
          </li>
          <li>
            <strong>Portability:</strong> Request your data in a
            machine-readable format
          </li>
          <li>
            <strong>Objection:</strong> Object to processing of your data for
            specific purposes
          </li>
          <li>
            <strong>Withdraw consent:</strong> Withdraw consent at any time
            where processing is based on consent
          </li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{" "}
          <strong>support@saasio.in</strong>. We will respond within 30 days.
        </p>
      </Section>

      <Section title="10. Children's Privacy">
        <p>
          SAASIO is not directed to children under 18 years of age. We do not
          knowingly collect personal information from minors. If you believe we
          have inadvertently collected data from a child, please contact us
          immediately and we will delete it promptly.
        </p>
      </Section>

      <Section title="11. Third-Party Links">
        <p>
          Our Service may contain links to third-party websites (e.g., job
          portals, company websites). We are not responsible for the privacy
          practices of these external sites and encourage you to review their
          respective privacy policies.
        </p>
      </Section>

      <Section title="12. Changes to This Privacy Policy">
        <p>
          We may update this Privacy Policy periodically to reflect changes in
          our practices or for legal, operational, or regulatory reasons. We
          will notify you of material changes by:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Sending an email notification to your registered address</li>
          <li>Displaying a prominent notice on our website</li>
        </ul>
        <p>
          The &ldquo;Last updated&rdquo; date at the top of this page indicates
          when the policy was last revised. Continued use of SAASIO after the
          effective date constitutes acceptance of the revised policy.
        </p>
      </Section>

      <Section title="13. Contact Us">
        <p>
          If you have any questions, concerns, or requests regarding this
          Privacy Policy or our data practices, please contact our Privacy team:
        </p>
        <div className="rounded-xl border border-[#d5eadf] bg-[#f2fbf7] p-4 text-sm">
          <p>
            <strong>SAASIO Privacy Team</strong>
            <br />
            Email:{" "}
            <a
              href="mailto:support@saasio.in"
              className="text-[#0f766e] hover:underline"
            >
              support@saasio.in
            </a>
            <br />
            Country: India
          </p>
        </div>
      </Section>
    </LegalPageShell>
  );
}
