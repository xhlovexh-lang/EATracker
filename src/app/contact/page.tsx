import type { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "../../lib/seo";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact EA Tracker for developer data corrections, press inquiries, or questions.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-5 text-sm text-slate-300 leading-relaxed">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-50">
        Contact EA Tracker
      </h1>
      <p>
        For game data corrections or to register an external developer roadmap/changelog URL (reviewed within 72 hours), please use our dedicated{" "}
        <Link href="/report" className="text-emerald-400 underline">
          Developer Correction Form
        </Link>.
      </p>
      <p>
        For press inquiries, dataset citations, or general questions, use this site:{" "}
        <a href={SITE_URL} className="font-mono text-slate-200 hover:text-emerald-400">
          {SITE_URL}
        </a>
      </p>
    </div>
  );
}
