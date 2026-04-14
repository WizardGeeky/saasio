import {
  FiArrowRight,
  FiCheck,
  FiDownload,
  FiShield,
  FiStar,
  FiUsers,
  FiX,
} from "react-icons/fi";

import { cn } from "@/lib/utils";

import { CONTAINER, pricingPlans, testimonials } from "./data";
import { CtaLink, SectionIntro } from "./shared";

export function PricingSection() {
  return (
    <section
      id="pricing"
      className="bg-[#f6efe6] py-20 sm:py-24 lg:py-28"
    >
      <div className={CONTAINER}>
        <SectionIntro
          badge="Pricing"
          title="Pay once and"
          accent="apply smarter"
          description="No subscription pressure, no recurring fees, and no need to overthink the first step. Pick the pack that matches your job search pace."
          animation="flip-up"
        />

        <div className="mt-12 grid gap-4 sm:mt-16 sm:gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan, index) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border p-5 sm:rounded-[2rem] sm:p-7",
                plan.popular
                  ? "border-[#f3d9c8] bg-[#fff8ee] text-[#102033] shadow-[0_35px_80px_-45px_rgba(255,107,74,0.55)]"
                  : "border-[#e4d6c8] bg-white text-[#102033] shadow-[0_24px_55px_-40px_rgba(15,23,42,0.25)]",
              )}
              data-aos={plan.popular ? "zoom-in-up" : "fade-up"}
              data-aos-delay={index * 90}
            >
              {plan.popular && (
                <div className="absolute right-5 top-5 rounded-full bg-[#102033] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white">
                  Top pick
                </div>
              )}

              <div className="relative">
                <p className={cn("text-[11px] font-bold uppercase tracking-[0.22em]", plan.popular ? "text-[#8c6d54]" : "text-[#8c6d54]")}>
                  {plan.name}
                </p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-black tracking-tight sm:text-5xl">{plan.price}</span>
                  <span className={cn("pb-2 text-sm font-medium", plan.popular ? "text-slate-500" : "text-slate-500")}>
                    / {plan.per}
                  </span>
                </div>
                <p className={cn("mt-2 text-sm", plan.popular ? "text-[#0f766e]" : "text-[#0f766e]")}>
                  {plan.perUnit}
                </p>
                <p className={cn("mt-4 text-sm leading-6", plan.popular ? "text-slate-600" : "text-slate-600")}>
                  {plan.description}
                </p>
              </div>

              <ul className="relative mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className={cn("flex items-center gap-3 text-sm", plan.popular ? "text-slate-700" : "text-slate-700")}
                  >
                    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full", plan.popular ? "bg-[#e7f7f3] text-[#0f766e]" : "bg-[#e7f7f3] text-[#0f766e]")}>
                      <FiCheck className="h-3 w-3" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
                {plan.missing.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-300">
                      <FiX className="h-3 w-3" />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="relative mt-8">
                {plan.popular ? (
                  <CtaLink href="/login" className="w-full justify-center py-4 text-base">
                    {plan.cta}
                    <FiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </CtaLink>
                ) : (
                  <a
                    href="/login"
                    className="inline-flex w-full items-center justify-center rounded-full border border-[#d8c9b8] px-5 py-4 text-sm font-semibold text-[#102033] transition-all duration-300 hover:bg-[#fff8ee]"
                  >
                    {plan.cta}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-3 text-sm text-slate-600 sm:mt-10 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {[
            { icon: FiShield, text: "Razorpay-secured payments" },
            { icon: FiCheck, text: "No hidden fees" },
            { icon: FiDownload, text: "Instant PDF access" },
            { icon: FiUsers, text: "10,000+ happy users" },
          ].map(({ icon: Icon, text }, index) => (
            <div
              key={text}
              className="flex items-center gap-3 rounded-2xl border border-[#e4d6c8] bg-white px-4 py-3"
              data-aos="fade-up"
              data-aos-delay={index * 60}
            >
              <Icon className="h-4 w-4 text-[#7ee8dc]" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ item }: { item: (typeof testimonials)[0] }) {
  return (
    <div className="w-full rounded-[1.5rem] border border-[#eadfce] bg-white p-5 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.45)] sm:rounded-[1.75rem] sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: item.rating }).map((_, index) => (
            <FiStar
              key={index}
              className="h-3.5 w-3.5 fill-[#f59e0b] text-[#f59e0b]"
            />
          ))}
        </div>
        <span className="rounded-full bg-[#fff3e4] px-2.5 py-1 text-[11px] font-semibold text-[#b45309]">
          {item.company}
        </span>
      </div>

      <p className="mt-5 text-sm leading-7 text-slate-600">
        &quot;{item.text}&quot;
      </p>

      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-[#ff6b4a] to-[#0f766e] text-sm font-bold text-white">
          {item.initials}
        </div>
        <div>
          <p className="text-sm font-bold text-[#102033]">{item.name}</p>
          <p className="text-xs text-slate-500">
            {item.role} / {item.company}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="bg-[#fffaf4] py-20 sm:py-24 lg:py-28">
      <div className={CONTAINER}>
        <SectionIntro
          badge="Testimonials"
          title="Loved by"
          accent="10,000+ professionals"
          description="The sections are the same, but the page now does a better job of making the outcome feel real before users ever scroll to pricing."
          animation="zoom-in"
        />

        <div className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 xl:grid-cols-4">
          {testimonials.map((item, index) => (
            <div key={item.name} data-aos={index % 2 === 0 ? "flip-left" : "flip-right"} data-aos-delay={index * 45}>
              <TestimonialCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

