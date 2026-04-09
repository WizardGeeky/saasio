import type { Metadata } from "next";
import { Inter, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import initApp from "./utils/init";
import { ToastProvider } from "@/components/ui/toast";
initApp();

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SAASIO — AI Resume Builder | ATS-Optimized Resumes in 30 Seconds",
  description:
    "Build ATS-optimized, AI-powered resumes tailored to your dream job in under 30 seconds. One-time payment starting at ₹9. No subscriptions. Trusted by 10,000+ Indian professionals.",
  keywords: [
    "AI resume builder",
    "ATS optimized resume",
    "resume builder India",
    "job application resume",
    "AI powered resume",
    "professional resume builder",
  ],
  authors: [{ name: "SAASIO" }],
  openGraph: {
    title: "SAASIO — AI Resume Builder",
    description:
      "AI-powered, ATS-optimized resumes in 30 seconds. Starting at ₹9.",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
