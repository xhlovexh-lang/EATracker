"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";

export function ReportForm({
  defaultAppId = "",
  defaultGameName = "",
}: {
  defaultAppId?: string;
  defaultGameName?: string;
}) {
  const [appid, setAppid] = useState(defaultAppId);
  const [kind, setKind] = useState("external_roadmap");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState(
    defaultGameName ? `Correction request regarding ${defaultGameName}: ` : ""
  );
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appid: Number.parseInt(appid, 10),
          kind,
          url: url.trim() || undefined,
          message: message.trim(),
          email: email.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Failed to submit report.");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg("Network error while submitting report.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-6 text-center space-y-2">
        <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
        <h3 className="text-base font-bold text-slate-100">
          Correction Request Logged
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
          Thank you. We review all developer and community correction requests within 72 hours. If an external changelog or roadmap URL is verified, the game&apos;s page will display the external link and adjust its status accordingly.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5"
    >
      {status === "error" && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/30 p-3 text-xs text-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="report-appid"
            className="block text-xs font-semibold text-slate-200 mb-1.5"
          >
            Steam AppID *
          </label>
          <input
            id="report-appid"
            type="number"
            required
            value={appid}
            onChange={(e) => setAppid(e.target.value)}
            placeholder="e.g. 1363080"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="report-kind"
            className="block text-xs font-semibold text-slate-200 mb-1.5"
          >
            Correction Category *
          </label>
          <select
            id="report-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
          >
            <option value="external_roadmap">
              We post updates on an external blog / Discord / website
            </option>
            <option value="incorrect_date">
              Last patch or Early Access start date is inaccurate
            </option>
            <option value="left_ea">
              Game has graduated to 1.0 full release
            </option>
            <option value="other">Other data correction</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="report-url"
          className="block text-xs font-semibold text-slate-200 mb-1.5"
        >
          External Changelog / Official Roadmap URL (Optional)
        </label>
        <input
          id="report-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-studio-site.com/changelog"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="report-message"
          className="block text-xs font-semibold text-slate-200 mb-1.5"
        >
          Details &amp; Verification Notes *
        </label>
        <textarea
          id="report-message"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the update schedule, beta branch activity, or link to verification..."
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="report-email"
          className="block text-xs font-semibold text-slate-200 mb-1.5"
        >
          Developer or Contact Email (Optional — used only to confirm resolution)
        </label>
        <input
          id="report-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="dev@studio.com"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-colors"
      >
        <Send className="h-3.5 w-3.5" />
        {status === "submitting" ? "Submitting..." : "Submit Correction Request"}
      </button>
    </form>
  );
}
