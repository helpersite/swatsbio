import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Brand } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/auth";
import { brandIcon } from "@/lib/brandIcons";
import { ArrowUpRight } from "lucide-react";

export default function Footer() {
  const [site, setSite] = useState(null);
  useEffect(() => { api.get("/site").then(({ data }) => setSite(data)).catch(() => setSite(null)); }, []);
  const socials = site?.socials || [];

  return (
    <footer className="mt-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden border border-[#4A6B8A]/25" style={{ background: "linear-gradient(135deg, rgba(74,107,138,0.18), rgba(91,141,184,0.08))" }}>
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#5B8DB8]/20 blur-3xl" />
          <h3 className="font-display text-2xl sm:text-3xl font-extrabold relative">Ready to deploy your page?</h3>
          <p className="text-[#E5E7EB]/55 mt-2 relative">Grab an invite and claim your @username before it's gone.</p>
          <Link to="/s/auth?tab=register" className="relative inline-block mt-6"><Button className="rounded-full bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white font-semibold px-7 py-6 shadow-[0_0_28px_rgba(91,141,184,0.45)] gap-2">Get started <ArrowUpRight size={16} /></Button></Link>
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-10 mt-14 pb-10">
          <div className="max-w-xs">
            <Brand />
            <p className="text-[#E5E7EB]/45 text-sm mt-3 leading-relaxed">The #1 private bio handler built for elite creators. Your links, your identity — one tactical page.</p>
            <div className="flex gap-2 mt-5 flex-wrap">
              {socials.map((s, i) => {
                const Ic = brandIcon(s.platform);
                return (
                  <a key={i} href={s.url || "#"} target="_blank" rel="noreferrer" title={s.platform} data-testid={`footer-social-${s.platform}`}
                    className="w-9 h-9 rounded-lg border border-[#4A6B8A]/25 flex items-center justify-center text-[#E5E7EB]/60 hover:text-[#5B8DB8] hover:border-[#5B8DB8]/50 transition-colors">
                    <Ic size={16} />
                  </a>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-12 text-sm">
            {[
              { h: "Product", links: [["Pricing", "/s/pricing"], ["Compare", "/s/compare"], ["Register", "/s/auth?tab=register"]] },
              { h: "Company", links: [["Legal", "/s/legal"], ["Privacy", "/s/legal"], ["Terms", "/s/legal"]] },
              { h: "Support", links: [["Discord", site?.discord_invite || "#"], ["Status", "/s/legal"], ["Contact", site?.support_email ? `mailto:${site.support_email}` : "#"]] },
            ].map((col) => (
              <div key={col.h}>
                <div className="text-[#E5E7EB] font-semibold mb-3">{col.h}</div>
                <div className="flex flex-col gap-2 text-[#E5E7EB]/50">
                  {col.links.map(([l, to]) => to.startsWith("/") ? <Link key={l} to={to} className="hover:text-[#5B8DB8] transition-colors w-fit">{l}</Link> : <a key={l} href={to} className="hover:text-[#5B8DB8] transition-colors w-fit">{l}</a>)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="pt-6 border-t border-[#4A6B8A]/10 text-[#E5E7EB]/30 text-xs pb-10 flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Swats.bio — All rights reserved.</span>
          <span>Made for the tactical web.</span>
        </div>
      </div>
    </footer>
  );
}
