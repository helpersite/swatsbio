import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, X, Minus, Trophy } from "lucide-react";

const FEATURES = [
  "Invite-only access", "Zero-log privacy architecture", "Live audio manager + snippets",
  "Background blur & card alpha control", "Canvas effects (rain, topographic, snow)",
  "Discord & Spotify live presence", "Rich text parser (:glow:, :blur:)",
  "Username cooldown & history", "12+ collectible badges", "Custom cursor upload",
  "Page password / enter screen", "Custom fonts (2 per user)",
];

// 2 = full, 1 = partial, 0 = none  →  [swats.bio, legacy builders, standard bio tools, basic link pages]
const MATRIX = [
  [2, 2, 1, 1], [2, 1, 1, 0], [2, 1, 1, 1], [2, 2, 1, 1], [2, 2, 1, 1],
  [2, 1, 0, 0], [2, 0, 0, 0], [2, 1, 1, 1], [2, 2, 1, 0], [2, 1, 1, 1],
  [2, 2, 1, 1], [2, 1, 0, 0],
];

const COLS = ["swats.bio", "legacy builders", "standard bio tools", "basic link pages"];

function Cell({ v }) {
  if (v === 2) return <span className="inline-flex w-7 h-7 rounded-full bg-[#5B8DB8]/15 items-center justify-center"><Check className="text-[#5B8DB8]" size={16} /></span>;
  if (v === 1) return <Minus className="mx-auto text-[#E5E7EB]/35" size={18} />;
  return <X className="mx-auto text-red-500/50" size={16} />;
}

export default function Compare() {
  const score = COLS.map((_, c) => MATRIX.reduce((a, r) => a + (r[c] === 2 ? 1 : 0), 0));
  return (
    <div className="swat-bg">
      <Navbar />
      <section className="pt-32 pb-8 px-6 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#4A6B8A]/30 text-[11px] text-[#5B8DB8] mb-5">Feature comparison</div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold reveal">We don't compete.<br />We replace the basic setup.</h1>
        <p className="text-[#E5E7EB]/50 mt-4 reveal" style={{ animationDelay: ".1s" }}>Everything a standard bio-link platform offers — plus the tactical features most of them skip.</p>
      </section>

      {/* Score cards */}
      <section className="px-6 max-w-4xl mx-auto grid grid-cols-4 gap-3 mb-8">
        {COLS.map((c, i) => (
          <div key={c} className={`rounded-2xl p-4 text-center border ${i === 0 ? "border-[#5B8DB8]/50 bg-[#5B8DB8]/10 shadow-[0_0_30px_rgba(91,141,184,0.2)]" : "border-[#4A6B8A]/20 swat-glass"}`}>
            {i === 0 && <Trophy size={16} className="mx-auto text-[#eab308] mb-1" />}
            <div className={`font-display font-bold text-sm ${i === 0 ? "text-[#5B8DB8]" : "text-[#E5E7EB]/70"}`}>{c}</div>
            <div className="font-display text-2xl font-extrabold mt-1">{score[i]}<span className="text-xs text-[#E5E7EB]/40">/{FEATURES.length}</span></div>
          </div>
        ))}
      </section>

      <section className="px-6 max-w-4xl mx-auto pb-14">
        <div data-testid="compare-table-matrix" className="swat-glass rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-[#4A6B8A]/20 text-[#E5E7EB]/50">
                <th className="text-left p-4 font-medium">Feature</th>
                {COLS.map((c, i) => (
                  <th key={c} className={`p-4 text-center font-display font-bold ${i === 0 ? "text-[#5B8DB8] bg-[#5B8DB8]/10" : "text-[#E5E7EB]/60"}`}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, r) => (
                <tr key={f} className="border-b border-[#4A6B8A]/10 hover:bg-[#4A6B8A]/5 transition-colors">
                  <td className="p-4 text-[#E5E7EB]/80">{f}</td>
                  {MATRIX[r].map((v, c) => <td key={c} className={`p-4 text-center ${c === 0 ? "bg-[#5B8DB8]/[0.06]" : ""}`}><Cell v={v} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-6 justify-center mt-5 text-xs text-[#E5E7EB]/50">
          <span className="flex items-center gap-1.5"><Check size={14} className="text-[#5B8DB8]" /> Full</span>
          <span className="flex items-center gap-1.5"><Minus size={14} /> Partial</span>
          <span className="flex items-center gap-1.5"><X size={14} className="text-red-500/50" /> None</span>
        </div>
      </section>
      <Footer />
    </div>
  );
}
