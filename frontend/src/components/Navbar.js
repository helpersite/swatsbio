import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, api } from "@/lib/auth";
import { SiDiscord } from "react-icons/si";
import { Brand } from "@/components/Brand";

export { Brand };


const links = [
  { to: "/s/home", label: "home", id: "navbar-link-home" },
  { to: "/s/legal", label: "legal", id: "navbar-link-legal" },
  { to: "/s/compare", label: "compare", id: "navbar-link-compare" },
  { to: "/s/pricing", label: "pricing", id: "navbar-link-pricing" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();

  const handleDiscord = async () => {
    try {
      const { data } = await api.get("/auth/discord/login");
      window.location.href = data.url;
    } catch {
      navigate("/s/auth");
    }
  };

  return (
    <nav
      className="fixed top-5 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-4xl rounded-full pl-6 pr-2.5 py-3 sm:py-3.5 flex items-center justify-between"
      style={{
        background: "rgba(11, 13, 16, 0.88)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(91,141,184,0.32)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.7), 0 0 28px rgba(91,141,184,0.22)",
      }}
    >
      <Link to="/s/home"><Brand size={22} /></Link>
      <div className="hidden md:flex items-center gap-1">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            data-testid={l.id}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
              pathname === l.to
                ? "text-white bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 shadow-[0_0_12px_rgba(91,141,184,0.25)]"
                : "text-[#E5E7EB]/70 hover:text-white hover:bg-white/5"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {user ? (
          <Button
            data-testid="navbar-button-dashboard"
            onClick={() => navigate("/dashboard")}
            className="rounded-full bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-sm font-semibold h-10 px-5 shadow-[0_0_20px_rgba(91,141,184,0.4)]"
          >
            Dashboard
          </Button>
        ) : (
          <>
            <Button
              data-testid="navbar-button-discord"
              variant="ghost"
              onClick={handleDiscord}
              title="Sign in with Discord"
              className="rounded-full bg-[#5865F2]/15 hover:bg-[#5865F2] hover:text-white text-[#E5E7EB] text-sm font-medium h-10 px-3.5 gap-2 transition-all border border-[#5865F2]/30"
            >
              <SiDiscord size={16} className="text-[#5865F2]" />
              <span className="hidden sm:inline text-xs font-semibold">Discord</span>
            </Button>
            <Button
              data-testid="navbar-button-login"
              variant="ghost"
              onClick={() => navigate("/s/auth?tab=login")}
              className="rounded-full text-[#E5E7EB]/80 hover:text-white hover:bg-[#4A6B8A]/15 text-sm font-medium h-10 px-4"
            >
              login
            </Button>
            <Button
              data-testid="navbar-button-waitlist"
              onClick={() => navigate("/s/auth?tab=register")}
              className="rounded-full bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-sm font-semibold h-10 px-5 shadow-[0_0_20px_rgba(91,141,184,0.45)]"
            >
              waitlist
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}

