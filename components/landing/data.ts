import {
  FiBriefcase,
  FiClock,
  FiCpu,
  FiDownload,
  FiFileText,
  FiLayers,
  FiTrendingUp,
} from "react-icons/fi";

export const CONTAINER = "mx-auto w-full max-w-[88rem] px-4 sm:px-6 lg:px-8";

export const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export const HERO_POINTS = [
  { label: "ATS fit", value: "Up to 98/100" },
  { label: "Build time", value: "About 30 sec" },
  { label: "Starting price", value: "Rs. 9" },
];

export const STATS = [
  {
    value: 10000,
    suffix: "+",
    label: "Resumes created",
    icon: FiFileText,
    accent: "bg-[#fff1e8] text-[#d9481f]",
  },
  {
    value: 92,
    suffix: "%",
    label: "Interview success rate",
    icon: FiTrendingUp,
    accent: "bg-[#eaf8f6] text-[#0f766e]",
  },
  {
    value: 30,
    suffix: "s",
    label: "Average build time",
    icon: FiClock,
    accent: "bg-[#eef4fb] text-[#1d4ed8]",
  },
  {
    value: 50,
    suffix: "+",
    label: "Professional templates",
    icon: FiLayers,
    accent: "bg-[#f8f1de] text-[#a16207]",
  },
];

export const testimonials = [
  {
    name: "Priya Sharma",
    role: "Product Manager",
    company: "Swiggy",
    initials: "PS",
    text: "Got 3 interview calls in one week. My ATS score jumped to 96 out of 100.",
    rating: 5,
  },
  {
    name: "Rahul Verma",
    role: "Software Engineer",
    company: "Zepto",
    initials: "RV",
    text: "I built a role-specific resume in under 30 seconds and landed the job in 2 weeks.",
    rating: 5,
  },
  {
    name: "Neha Patel",
    role: "Data Scientist",
    company: "PhonePe",
    initials: "NP",
    text: "The job matching is sharp. My resume finally sounded like it belonged in the shortlist.",
    rating: 5,
  },
  {
    name: "Arjun Singh",
    role: "UX Designer",
    company: "CRED",
    initials: "AS",
    text: "The templates feel premium and the editing suggestions saved me hours.",
    rating: 5,
  },
  {
    name: "Ananya Kapoor",
    role: "Marketing Manager",
    company: "Razorpay",
    initials: "AK",
    text: "I hit a 94 percent match score on the first try and doubled my interview conversion.",
    rating: 5,
  },
  {
    name: "Vikram Nair",
    role: "Backend Developer",
    company: "Groww",
    initials: "VN",
    text: "Version tracking for different roles is the feature I did not know I needed.",
    rating: 5,
  },
  {
    name: "Sneha Reddy",
    role: "Business Analyst",
    company: "Flipkart",
    initials: "SR",
    text: "From job description to polished PDF in 30 seconds feels unreal the first time you use it.",
    rating: 5,
  },
  {
    name: "Karan Mehta",
    role: "DevOps Engineer",
    company: "Meesho",
    initials: "KM",
    text: "The ATS optimizer made my resume stand out in a crowded hiring pipeline.",
    rating: 5,
  },
];

export const steps = [
  {
    number: "01",
    icon: FiBriefcase,
    title: "Paste your job description",
    subtitle: "Any role. Any company. Any portal.",
    description:
      "Copy the listing from LinkedIn, Naukri, Indeed, or any company careers page. SAASIO reads the requirements, keywords, and signals the recruiter is screening for.",
    bullets: [
      "Works with any job board or direct careers page",
      "Supports freshers and experienced professionals",
      "Handles tech, design, product, finance, and operations roles",
    ],
    accent: "coral",
  },
  {
    number: "02",
    icon: FiCpu,
    title: "Let AI build the resume",
    subtitle: "Tailored in seconds, not hours.",
    description:
      "Our AI rewrites your experience in the language ATS systems and recruiters expect to see, while improving clarity, structure, and measurable impact.",
    bullets: [
      "Real-time ATS scoring up to 98 out of 100",
      "Job-specific keyword and phrase optimization",
      "Sharper bullet points with stronger outcomes",
    ],
    accent: "teal",
  },
  {
    number: "03",
    icon: FiDownload,
    title: "Download and start applying",
    subtitle: "Clean PDF output and role-ready versions.",
    description:
      "Choose from 50 plus ATS-friendly templates, export the tailored version as PDF, and keep separate resumes for each application you are serious about.",
    bullets: [
      "Instant PDF download ready for applications",
      "50 plus professional resume templates",
      "Version tracking for multiple target roles",
    ],
    accent: "amber",
  },
];

export const pricingPlans = [
  {
    name: "Starter",
    price: "Rs. 9",
    per: "1 resume",
    perUnit: "Rs. 9 per resume",
    description: "Perfect for a single high-priority application.",
    features: [
      "1 AI-generated resume",
      "ATS optimization score",
      "Job description matching",
      "PDF download",
      "50+ templates",
    ],
    missing: ["Smart editing suggestions", "Version tracking", "Priority support"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Growth",
    price: "Rs. 39",
    per: "5 resumes",
    perUnit: "Rs. 7.8 per resume",
    description: "Best value for active job seekers running multiple applications.",
    features: [
      "5 AI-generated resumes",
      "ATS optimization score",
      "Job description matching",
      "PDF download",
      "50+ templates",
      "Smart editing suggestions",
      "Version tracking",
    ],
    missing: ["Priority support"],
    cta: "Choose Growth",
    popular: true,
  },
  {
    name: "Pro",
    price: "Rs. 69",
    per: "10 resumes",
    perUnit: "Rs. 6.9 per resume",
    description: "For serious candidates tailoring across multiple roles and companies.",
    features: [
      "10 AI-generated resumes",
      "ATS optimization score",
      "Job description matching",
      "PDF download",
      "50+ templates",
      "Smart editing suggestions",
      "Version tracking",
      "Priority support",
    ],
    missing: [],
    cta: "Go Pro",
    popular: false,
  },
];

export const faqs = [
  {
    q: "How does AI generate my resume?",
    a: "SAASIO analyzes the job description, identifies the relevant skills and language patterns, then rebuilds your resume to highlight your most useful experience in a recruiter-friendly format.",
  },
  {
    q: "What is ATS optimization and why does it matter?",
    a: "Applicant Tracking Systems are used by most large companies to filter resumes before a recruiter reviews them. Our optimizer helps your resume align with the role so it has a better chance of making it through that first screen.",
  },
  {
    q: "Is there a subscription or recurring charge?",
    a: "No. SAASIO is pay-as-you-go. You buy a bundle of resumes and use them when you need them. There are no monthly fees and no recurring charges.",
  },
  {
    q: "Can I create resumes for different job roles?",
    a: "Yes. Each resume is tailored to a specific job description. Growth and Pro plans are especially useful if you are applying across different roles, companies, or industries at the same time.",
  },
  {
    q: "What format will I receive my resume in?",
    a: "You get a polished PDF that is ready to attach directly to a job application. You can choose from multiple ATS-friendly templates before downloading.",
  },
  {
    q: "Is my personal data safe and secure?",
    a: "Yes. Data is encrypted in transit and at rest. Payments are processed through Razorpay, and we do not sell or share your personal information with third parties.",
  },
];

export const RESUME_JOBS = [
  {
    title: "Senior Product Manager",
    company: "Swiggy",
    header: "from-[#ff6b4a] via-[#ff8654] to-[#f59e0b]",
    score: 94,
    ats: 97,
    keywords: ["Product Strategy", "SQL", "A/B Testing", "Agile"],
  },
  {
    title: "Software Engineer II",
    company: "Google",
    header: "from-[#0f766e] via-[#14b8a6] to-[#0891b2]",
    score: 91,
    ats: 98,
    keywords: ["React", "TypeScript", "System Design", "REST APIs"],
  },
  {
    title: "Data Scientist",
    company: "PhonePe",
    header: "from-[#102033] via-[#1d3557] to-[#315b87]",
    score: 96,
    ats: 95,
    keywords: ["Python", "ML", "TensorFlow", "Statistics"],
  },
];

export function getStepTheme(accent: string) {
  if (accent === "teal") {
    return {
      badge: "border-[#40c7b7]/30 bg-[#0f766e]/15 text-[#7ee8dc]",
      bullet: "bg-[#0f766e] text-white",
      frame: "from-[#0f766e]/20 via-[#0f766e]/5 to-transparent",
      number: "text-[#0f766e]/20",
    };
  }

  if (accent === "amber") {
    return {
      badge: "border-[#f0bf62]/30 bg-[#a16207]/15 text-[#f8d792]",
      bullet: "bg-[#d97706] text-white",
      frame: "from-[#f59e0b]/20 via-[#f59e0b]/5 to-transparent",
      number: "text-[#f59e0b]/20",
    };
  }

  return {
    badge: "border-[#ff9b7f]/35 bg-[#ff6b4a]/15 text-[#ffc8b8]",
    bullet: "bg-[#ff6b4a] text-white",
    frame: "from-[#ff6b4a]/20 via-[#ff6b4a]/5 to-transparent",
    number: "text-[#ff6b4a]/20",
  };
}
