import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Brand } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, api, formatApiErrorDetail } from "@/lib/auth";
import { toast } from "sonner";
import { Mail, Lock, User, KeyRound, Check, X, Loader2, ShoppingCart } from "lucide-react";

const DiscordIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3c-.2.36-.43.844-.588 1.23a18.27 18.27 0 0 0-5.94 0A12.6 12.6 0 0 0 9.44 3 19.7 19.7 0 0 0 5.677 4.37C1.78 10.12.72 15.73 1.25 21.26a19.9 19.9 0 0 0 6.075 3.08c.49-.67.927-1.38 1.302-2.13-.716-.27-1.4-.6-2.045-.99.171-.126.34-.257.503-.39a14.2 14.2 0 0 0 12.03 0c.166.14.335.27.503.39-.646.39-1.332.72-2.048.99.375.75.81 1.46 1.3 2.13a19.85 19.85 0 0 0 6.078-3.08c.62-6.42-1.06-11.98-4.44-16.89ZM8.02 17.33c-1.18 0-2.156-1.08-2.156-2.41 0-1.33.955-2.41 2.156-2.41 1.21 0 2.176 1.09 2.156 2.41 0 1.33-.955 2.41-2.156 2.41Zm7.96 0c-1.18 0-2.156-1.08-2.156-2.41 0-1.33.955-2.41 2.156-2.41 1.21 0 2.176 1.09 2.156 2.41 0 1.33-.945 2.41-2.156 2.41Z"/></svg>
);

const KOMERZA_URL = process.env.REACT_APP_KOMERZA_URL;

export default function Auth() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, refresh, user } = useAuth();
  const pendingDiscord = params.get("discord_pending");
  const discordUser = params.get("discord_user") || "";
  const initialInvite = params.get("invite") || params.get("code") || params.get("invite_code") || "";
  const [tab, setTab] = useState(pendingDiscord || params.get("tab") === "register" || initialInvite ? "register" : "login");
  const [form, setForm] = useState({ email: "", password: "", username: discordUser || "", invite_code: initialInvite });
  const [busy, setBusy] = useState(false);
  const [uStatus, setUStatus] = useState(null); // checking | available | taken | invalid | null

  useEffect(() => { if (user) navigate("/dashboard"); }, [user, navigate]);
  useEffect(() => {
    if (params.get("discord") === "failed") {
      toast.error("Discord login failed or was cancelled.");
    }
    const err = params.get("error");
    if (err) {
      toast.error(decodeURIComponent(err));
    }
  }, [params]);

  useEffect(() => {
    if (pendingDiscord && discordUser && !form.username) {
      setForm((prev) => ({ ...prev, username: discordUser }));
    }
  }, [pendingDiscord, discordUser]);

  useEffect(() => {
    if (tab !== "register" || !form.username) { setUStatus(null); return; }
    setUStatus("checking");
    const id = setTimeout(async () => {
      try {
        const { data } = await api.get(`/auth/check-username?username=${encodeURIComponent(form.username)}`);
        setUStatus(!data.valid ? "invalid" : data.available ? "available" : "taken");
      } catch { setUStatus(null); }
    }, 450);
    return () => clearTimeout(id);
  }, [form.username, tab]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const discordLogin = async () => {
    try {
      let url = "/auth/discord/login";
      if (tab === "register" && form.invite_code?.trim()) {
        url += `?invite_code=${encodeURIComponent(form.invite_code.trim())}`;
      }
      const { data } = await api.get(url);
      window.location.href = data.url;
    } catch (err) {
      toast.info(formatApiErrorDetail(err.response?.data?.detail) || "Discord login isn't configured yet.");
    }
  };

  const buyCode = () => {
    if (KOMERZA_URL) window.open(KOMERZA_URL, "_blank");
    else toast.info("Our Komerza store is opening soon — codes will be available to buy here.");
  };

  const [botMode, setBotMode] = useState(false);
  const [botAccount, setBotAccount] = useState("");
  const [botCode, setBotCode] = useState("");
  const [botSent, setBotSent] = useState(false);
  const [botMasked, setBotMasked] = useState("");
  const [botBusy, setBotBusy] = useState(false);
  const [botStatus, setBotStatus] = useState(null);

  useEffect(() => {
    if (!botMode) return;
    let active = true;
    api.get("/auth/discord-bot/status").then(({ data }) => { if (active) setBotStatus(data); }).catch(() => { if (active) setBotStatus({ configured: false, online: false }); });
    return () => { active = false; };
  }, [botMode]);

  const requestBotCode = async (e) => {
    e?.preventDefault();
    if (!botAccount.trim()) {
      toast.error("Please enter your email, username, or Discord ID.");
      return;
    }
    setBotBusy(true);
    try {
      const { data } = await api.post("/auth/discord-bot/send-code", { account: botAccount.trim() });
      setBotSent(true);
      setBotMasked(data.masked || "your Discord account");
      toast.success("Security code dispatched to your Discord DM!");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Failed to send bot verification code.");
    } finally {
      setBotBusy(false);
    }
  };

  const verifyBotCode = async (e) => {
    e?.preventDefault();
    if (!botCode.trim() || botCode.trim().length < 6) {
      toast.error("Please enter the full 6-digit verification code.");
      return;
    }
    setBotBusy(true);
    try {
      const { data } = await api.post("/auth/discord-bot/verify-code", {
        account: botAccount.trim(),
        code: botCode.trim(),
      });
      if (data.token) {
        localStorage.setItem("swats_token", data.token);
      }
      await refresh();
      toast.success("Identity verified via Discord Bot! Welcome.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Verification failed.");
    } finally {
      setBotBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (pendingDiscord) {
        if (!form.invite_code.trim()) {
          toast.error("Please enter a valid invite code to complete registration.");
          setBusy(false);
          return;
        }
        const { data } = await api.post("/auth/discord/complete-registration", {
          discord_pending: pendingDiscord,
          invite_code: form.invite_code.trim(),
          username: form.username.trim(),
        });
        if (data.token) {
          localStorage.setItem("swats_token", data.token);
        }
        await refresh();
        toast.success("Account deployed with Discord! Welcome to swats.bio");
        navigate("/dashboard");
        return;
      }

      if (tab === "login") {
        await login(form.email, form.password);
        toast.success("Welcome back, operator.");
      } else {
        await register(form);
        toast.success("Account deployed. Welcome to swats.bio!");
      }
      navigate("/dashboard");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  const uMeta = {
    checking: { icon: Loader2, cls: "text-[#E5E7EB]/40", txt: "checking availability…", spin: true },
    available: { icon: Check, cls: "text-green-400", txt: "nice — that username is available!" },
    taken: { icon: X, cls: "text-red-400", txt: "that username is already taken." },
    invalid: { icon: X, cls: "text-orange-400", txt: "2–20 letters, numbers, _, ! or #." },
  }[uStatus];

  return (
    <div className="swat-bg min-h-screen flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-md">
        <Link to="/s/home" className="flex justify-center mb-8"><Brand size={26} /></Link>
        <div className="swat-glass rounded-3xl p-8">
          {botMode ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#5865F2]/15 border border-[#5865F2]/30 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white shrink-0">
                    <DiscordIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Discord Bot 2FA & Verification</div>
                    <div className="text-[11px] text-[#E5E7EB]/60">Direct secure one-time code sent to your Discord DM</div>
                  </div>
                </div>
                <div className={`mt-3 rounded-md border px-2.5 py-2 text-[10px] ${botStatus?.online ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-200/70" : "border-amber-400/20 bg-amber-400/5 text-amber-100/70"}`}>
                  {botStatus?.online ? "Discord bot is online and ready." : botStatus?.configured ? "Bot token is set, but the Gateway is offline. The Railway bot process may still be starting or its token needs checking." : "Discord bot is not configured on the production server."}
                </div>
              </div>

              {!botSent ? (
                <form onSubmit={requestBotCode} className="space-y-4">
                  <Field icon={Mail} label="Your Account (Email, Username, or Discord ID)">
                    <Input
                      type="text"
                      required
                      value={botAccount}
                      onChange={(e) => setBotAccount(e.target.value)}
                      placeholder="e.g. operator or you@swats.bio"
                      className="bg-[#08090B]/60 border-[#4A6B8A]/30 pl-10"
                    />
                  </Field>
                  <Button
                    type="submit"
                    disabled={botBusy}
                    className="w-full rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold py-5 shadow-[0_0_20px_rgba(88,101,242,0.4)]"
                  >
                    {botBusy ? <Loader2 size={16} className="animate-spin" /> : "Send Code to My Discord DM"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={verifyBotCode} className="space-y-4">
                  <div className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
                    Verification code dispatched to {botMasked}! Check your Discord DMs.
                  </div>
                  <Field icon={KeyRound} label="6-Digit Verification Code">
                    <Input
                      type="text"
                      required
                      maxLength={6}
                      value={botCode}
                      onChange={(e) => setBotCode(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      className="bg-[#08090B]/60 border-[#4A6B8A]/30 pl-10 text-center text-lg tracking-widest font-mono font-bold"
                    />
                  </Field>
                  <Button
                    type="submit"
                    disabled={botBusy || botCode.length < 6}
                    className="w-full rounded-xl bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white font-semibold py-5 shadow-[0_0_20px_rgba(91,141,184,0.4)]"
                  >
                    {botBusy ? <Loader2 size={16} className="animate-spin" /> : "Verify & Log In"}
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setBotSent(false); setBotCode(""); }}
                    className="w-full text-xs text-[#E5E7EB]/50 hover:text-white transition-colors"
                  >
                    Didn't receive code? Resend
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => { setBotMode(false); setBotSent(false); }}
                className="w-full text-xs text-[#E5E7EB]/50 hover:text-white transition-colors pt-2"
              >
                ← Return to standard login
              </button>
            </div>
          ) : (
            <>
              {pendingDiscord ? (
                /* Discord Pending Registration Header */
                <div className="p-4 rounded-2xl bg-[#5865F2]/15 border border-[#5865F2]/30 mb-6 text-left relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white shrink-0 shadow-lg">
                      <DiscordIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-[#5865F2] flex items-center gap-1 uppercase tracking-wider">
                        <Check size={13} /> Discord Verified
                      </div>
                      <div className="text-sm font-bold text-white truncate">@{discordUser || "operator"}</div>
                    </div>
                  </div>
                  <p className="text-xs text-[#E5E7EB]/70 mt-2.5 leading-relaxed">
                    Swats.bio is invite-only. Enter an invite code below to deploy your profile.
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative flex gap-1 p-1 rounded-full bg-[#08090B]/60 mb-7">
                    <motion.div layout className="absolute top-1 bottom-1 rounded-full bg-[#5B8DB8]" style={{ width: "calc(50% - 4px)", left: tab === "login" ? 4 : "calc(50% + 0px)" }} transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                    {["login", "register"].map((t) => (
                      <button key={t} data-testid={`auth-tab-${t}`} onClick={() => setTab(t)}
                        className={`relative z-10 flex-1 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${tab === t ? "text-white" : "text-[#E5E7EB]/60"}`}>{t}</button>
                    ))}
                  </div>

                  <button data-testid="auth-discord-btn" onClick={discordLogin} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold transition-colors">
                    <DiscordIcon className="w-5 h-5" /> Continue with Discord
                  </button>
                  <div className="flex items-center gap-3 my-5 text-[#E5E7EB]/30 text-xs"><div className="h-px bg-[#4A6B8A]/20 flex-1" /> or {tab} with credentials <div className="h-px bg-[#4A6B8A]/20 flex-1" /></div>
                </>
              )}

              <form onSubmit={submit} className="space-y-4">
                {!pendingDiscord && (
                  <Field icon={Mail} label="Email"><Input data-testid="auth-email-input" type="email" required value={form.email} onChange={set("email")} placeholder="you@swats.bio" className="bg-[#08090B]/60 border-[#4A6B8A]/30 pl-10" /></Field>
                )}

                <AnimatePresence initial={false}>
                  {(tab === "register" || pendingDiscord) && (
                    <motion.div key="username" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: "easeInOut" }} className="overflow-hidden">
                      <div className="pt-0.5">
                        <Field icon={User} label="Desired Username"><Input data-testid="auth-username-input" required value={form.username} onChange={set("username")} placeholder="operator" className="bg-[#08090B]/60 border-[#4A6B8A]/30 pl-10" /></Field>
                        {uMeta && (
                          <div data-testid="username-availability" className={`mt-2 flex items-center gap-2 text-xs rounded-lg px-3 py-2 border border-[#4A6B8A]/20 bg-[#08090B]/40 ${uMeta.cls}`}>
                            <uMeta.icon size={14} className={uMeta.spin ? "animate-spin" : ""} /> {uMeta.txt}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!pendingDiscord && (
                  <Field icon={Lock} label="Password"><Input data-testid="auth-password-input" type="password" required value={form.password} onChange={set("password")} placeholder="••••••••" className="bg-[#08090B]/60 border-[#4A6B8A]/30 pl-10" /></Field>
                )}

                <AnimatePresence initial={false}>
                  {(tab === "register" || pendingDiscord) && (
                    <motion.div key="invite" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: "easeInOut" }} className="overflow-hidden">
                      <div className="pt-0.5">
                        <Field icon={KeyRound} label="Invite code"><Input data-testid="auth-invite-input" required value={form.invite_code} onChange={set("invite_code")} placeholder="SWAT-XXXX" className="bg-[#08090B]/60 border-[#4A6B8A]/30 pl-10 font-mono" /></Field>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button data-testid="auth-submit-btn" type="submit" disabled={busy || ((tab === "register" || pendingDiscord) && uStatus === "taken")} className="w-full rounded-xl bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white font-semibold py-6 shadow-[0_0_22px_rgba(91,141,184,0.4)] disabled:opacity-50">
                  {busy ? "..." : pendingDiscord ? "Complete Registration" : tab === "login" ? "Log in" : "Deploy account"}
                </Button>

                {tab === "login" && !pendingDiscord && (
                  <button
                    type="button"
                    onClick={() => { setBotMode(true); setBotAccount(form.email || ""); }}
                    className="w-full text-xs text-[#5B8DB8] hover:text-white transition-colors py-1 flex items-center justify-center gap-1.5"
                  >
                    <DiscordIcon className="w-3.5 h-3.5" /> Log in via Discord Bot 2FA Code
                  </button>
                )}

                {pendingDiscord && (
                  <button type="button" onClick={() => navigate("/auth")} className="w-full text-xs text-[#E5E7EB]/50 hover:text-white transition-colors py-1">
                    Cancel and return to standard login
                  </button>
                )}
              </form>

              <AnimatePresence initial={false}>
                {(tab === "register" || pendingDiscord) && (
                  <motion.button key="buy" data-testid="buy-code-btn" onClick={buyCode} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }}
                    className="w-full mt-4 flex items-center justify-center gap-2 text-sm text-[#5B8DB8] hover:text-white transition-colors overflow-hidden">
                    <ShoppingCart size={14} /> Don't have a code? Buy a code
                  </motion.button>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <div>
      <Label className="text-[#E5E7EB]/70 text-xs mb-1.5 block">{label}</Label>
      <div className="relative"><Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5B8DB8]" />{children}</div>
    </div>
  );
}
