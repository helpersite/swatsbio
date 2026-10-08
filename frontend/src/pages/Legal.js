import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, ShieldCheck, Copyright, Lock, Activity, Cookie, Scale, UserX } from "lucide-react";

const SECTIONS = [
  { icon: FileText, title: "Terms of Service", clauses: [
    ["1. Acceptance", "By accessing swats.bio you agree to these terms. If you do not agree, do not use the service. We may update these terms; continued use constitutes acceptance."],
    ["2. Eligibility & Invites", "swats.bio is invite-only during beta. You must be at least 13 years old. Invite codes are personal and may be revoked if abused."],
    ["3. Acceptable Use", "You may not use swats.bio to distribute malware, phishing links, illegal content, or to impersonate others. We reserve the right to suspend accounts that violate these rules without notice."],
    ["4. Content Ownership", "You own the content you publish. By publishing, you grant swats.bio a limited license to host and display it. You are solely responsible for what you upload."],
    ["5. Service Availability", "The service is provided \"as is\" during beta. We do not guarantee uptime and are not liable for data loss, though we take reasonable precautions."],
  ]},
  { icon: Lock, title: "Privacy Policy", clauses: [
    ["1. Data We Collect", "Email, a bcrypt-hashed password, your chosen username, and the profile content you publish. We collect aggregate page-view counts only."],
    ["2. How We Use It", "To operate your account, render your public page, and show you basic analytics. We never sell your data to third parties."],
    ["3. Cookies", "We use a single secure, http-only session cookie to keep you logged in. No third-party advertising cookies are used."],
    ["4. Data Retention", "Data is retained while your account is active. Request deletion at any time and we will remove your account and content."],
    ["5. Your Rights", "You may access, export, correct, or delete your data. Contact us to exercise these rights."],
  ]},
  { icon: Copyright, title: "DMCA & Copyright", clauses: [
    ["1. Respect IP", "Only upload audio, fonts, and images you have the rights to distribute."],
    ["2. Takedown Requests", "Submit the infringing URL, proof of ownership, and contact details. Valid requests are actioned promptly."],
    ["3. Repeat Infringers", "Accounts with repeated valid strikes are permanently banned."],
    ["4. Counter-Notices", "If you believe a takedown was in error, you may submit a counter-notice with justification."],
  ]},
  { icon: ShieldCheck, title: "Security & Encryption", clauses: [
    ["1. Passwords", "Hashed with bcrypt and never stored in plaintext or logged."],
    ["2. Sessions", "Short-lived signed JWTs delivered over secure, http-only cookies. All traffic is HTTPS."],
    ["3. Page Locking", "Optional page passwords and enter-screens add a second privacy layer to public bios."],
    ["4. Reporting", "Found a vulnerability? Report it responsibly and you may earn the Bug Finder badge."],
  ]},
  { icon: Cookie, title: "Cookie Policy", clauses: [
    ["1. Essential Only", "We only set what's required to keep you logged in — one session cookie."],
    ["2. No Tracking", "No cross-site trackers, no ad networks, no fingerprinting."],
  ]},
  { icon: UserX, title: "Refund & Cancellation", clauses: [
    ["1. Premium Beta", "The lifetime Premium Beta is a one-time payment. Refunds are available within 14 days if unused."],
    ["2. Cancellation", "You may delete your account at any time from Dashboard → Security."],
  ]},
  { icon: Activity, title: "System Status", clauses: [
    ["1. Uptime", "All systems operational. Target uptime is 99.9%."],
    ["2. Maintenance", "Scheduled maintenance is announced in our Discord at least 24 hours ahead."],
  ]},
];

function Section({ s, index }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div data-testid={`legal-section-${index}`} className="swat-glass rounded-2xl border-[#4A6B8A]/20 overflow-hidden reveal" style={{ animationDelay: `${index * 0.05}s` }}>
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-3 p-5 text-left">
        <span className="w-10 h-10 rounded-xl bg-[#5B8DB8]/15 flex items-center justify-center text-[#5B8DB8] shrink-0"><s.icon size={18} /></span>
        <span className="font-display font-semibold flex-1">{s.title}</span>
        <span className={`text-[#5B8DB8] transition-transform ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      <div className="grid transition-all duration-300" style={{ gridTemplateRows: open ? "1fr" : "0fr" }}>
        <div className="overflow-hidden">
          <div className="px-5 pb-5 space-y-4">
            {s.clauses.map(([h, b], i) => (
              <div key={i} className="pl-4 border-l-2 border-[#4A6B8A]/30">
                <div className="text-sm font-semibold text-[#5B8DB8]">{h}</div>
                <p className="text-sm text-[#E5E7EB]/60 mt-1 leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Legal() {
  return (
    <div className="swat-bg">
      <Navbar />
      <section className="pt-32 pb-8 px-6 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#4A6B8A]/30 text-[11px] text-[#5B8DB8] mb-5"><Scale size={12} /> Transparency first</div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold reveal">Legal & Policies</h1>
        <p className="text-[#E5E7EB]/50 mt-4 reveal" style={{ animationDelay: ".1s" }}>Every clause, laid out tactically clear. Last updated {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}.</p>
      </section>
      <section className="px-6 max-w-4xl mx-auto pb-14 space-y-3">
        {SECTIONS.map((s, i) => <Section key={s.title} s={s} index={i} />)}
      </section>
      <Footer />
    </div>
  );
}
