import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

import { CONTAINER } from "./data";
import { Footer } from "./faq-footer";
import { Navbar } from "./shared";

type LegalNavLink = {
  label: string;
  href: string;
};

type LegalHighlight = {
  title: string;
  copy: string;
};

export function LegalPageShell({
  title,
  description,
  updated,
  effective,
  highlights,
  navLinks,
  alternateHref,
  alternateLabel,
  children,
}: {
  title: string;
  description: string;
  updated: string;
  effective: string;
  highlights: LegalHighlight[];
  navLinks: LegalNavLink[];
  alternateHref: string;
  alternateLabel: string;
  children: React.ReactNode;
}) {
  return (
    <main className="overflow-x-hidden bg-[#fffaf4] text-[#102033]">
      <Navbar
        links={navLinks}
        secondaryAction={{ label: "Back Home", href: "/" }}
        primaryAction={{ label: "Build Resume", href: "/login" }}
      />

      <div id="top" className="pb-20 pt-24 sm:pb-24 sm:pt-28">
        <section className={CONTAINER}>
          <div className="overflow-hidden rounded-[2rem] border border-[#eadfce] bg-[#fffdf9] p-5 shadow-[0_35px_80px_-55px_rgba(15,23,42,0.28)] sm:rounded-[2.75rem] sm:p-8 lg:p-10">
            <div className="grid gap-6 border-b border-[#efe3d6] pb-7 sm:gap-8 sm:pb-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
              <div className="max-w-2xl">
                <span className="inline-flex rounded-full border border-[#e8d8c8] bg-[#fff7f0] px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#8c6d54]">
                  Legal
                </span>
                <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-[#102033] sm:mt-5 sm:text-5xl">
                  {title}
                </h1>
                <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-600 sm:mt-5 sm:text-lg">
                  {description}
                </p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-500">
                  <span className="rounded-full border border-[#eadfce] bg-white px-3 py-1.5">
                    Updated: <strong className="text-[#102033]">{updated}</strong>
                  </span>
                  <span className="rounded-full border border-[#eadfce] bg-white px-3 py-1.5">
                    Effective: <strong className="text-[#102033]">{effective}</strong>
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {highlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.35rem] border border-[#eee2d5] bg-[#fffaf4] p-4 sm:rounded-[1.5rem]"
                  >
                    <p className="text-sm font-bold text-[#102033]">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {item.copy}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-[#efe3d6] bg-white p-5 shadow-[0_24px_60px_-45px_rgba(15,23,42,0.22)] sm:rounded-[2rem] sm:p-8 lg:p-10">
              {children}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Looking for another policy?
                {" "}
                <Link
                  href={alternateHref}
                  className="font-semibold text-[#d9481f] transition-colors hover:text-[#b8411b]"
                >
                  {alternateLabel}
                </Link>
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-[#ff6b4a] to-[#ff9b5f] px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                Start Building
                <FiArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
