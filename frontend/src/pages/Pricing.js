import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/lib/auth";
import {
  Check, Clock, Zap, Sparkles, Heart, Copy, CreditCard, Coins, QrCode, ShieldCheck, Trophy, RefreshCw, Loader2
} from "lucide-react";
import { SiBitcoin, SiEthereum, SiLitecoin } from "react-icons/si";

const WAITLIST = ["Free signup at launch", "Standard biolink card", "Audio player support", "Discord presence", "Up to 10 links", "3 badge slots"];
const PREMIUM = ["No waitlist — instant access", "Exclusive Beta & Tester badges", "Custom domain binding", "Unlimited links & audio", "Custom cursor & canvas effects", "Rich text effects & glow controls", "Custom fonts (2 per user)", "Priority support"];
const CRYPTO_NETWORKS = [
  { id: "btc", name: "Bitcoin", symbol: "BTC", icon: SiBitcoin, color: "#F7931A" },
  { id: "eth", name: "Ethereum", symbol: "ETH", icon: SiEthereum, color: "#627EEA" },
  { id: "ltc", name: "Litecoin", symbol: "LTC", icon: SiLitecoin, color: "#345D9D" },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState("stripe");
  const [donations, setDonations] = useState(null);
  const [donationsLoading, setDonationsLoading] = useState(true);
  const [donationsError, setDonationsError] = useState(false);
  const [donorName, setDonorName] = useState("");
  const [donorNote, setDonorNote] = useState("");
  const [amountUsd, setAmountUsd] = useState("25");
  const [cryptoNetwork, setCryptoNetwork] = useState("btc");
  const [transactionId, setTransactionId] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [cryptoResult, setCryptoResult] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const loadDonations = async () => {
    try {
      const { data } = await api.get("/donations");
      setDonations(data);
      setDonationsError(false);
    } catch {
      setDonationsError(true);
    } finally {
      setDonationsLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
    const interval = setInterval(loadDonations, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (searchParams.get("donation") !== "success") return;
    toast.success("Payment completed. The verified donation will appear shortly.");
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (cryptoResult?.status !== "pending" || !transactionId.trim()) return undefined;
    let checking = false;
    const interval = setInterval(async () => {
      if (checking) return;
      checking = true;
      try {
        const { data } = await api.post("/donations/crypto/verify", {
          network: cryptoNetwork,
          transaction_id: transactionId.trim(),
          name: donorName,
          note: donorNote,
        });
        setCryptoResult(data);
        if (data.status === "confirmed") {
          toast.success("Crypto donation confirmed.");
          await loadDonations();
        }
      } catch {
        // Keep the pending state visible; the user can recheck from the form.
      } finally {
        checking = false;
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [cryptoResult?.status, transactionId, cryptoNetwork, donorName, donorNote]);

  const donationFeed = donations?.feed || [];
  const donationTotal = donations?.total_usd || 0;
  const supportGoal = donations?.goal_usd || 0;
  const supportPercent = supportGoal ? Math.min(100, Math.round((donationTotal / supportGoal) * 100)) : 0;
  const selectedCrypto = CRYPTO_NETWORKS.find((network) => network.id === cryptoNetwork) || CRYPTO_NETWORKS[0];
  const selectedWallet = donations?.wallets?.[cryptoNetwork] || "";

  const copyWallet = (id, address) => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopiedId(id);
    toast.success("Wallet address copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  const startStripeCheckout = async (e) => {
    e.preventDefault();
    const amount = Number(amountUsd);
    if (!Number.isInteger(amount) || amount < 1 || amount > 10000) return toast.error("Enter an amount from $1 to $10,000.");
    setPaymentBusy(true);
    try {
      const { data } = await api.post("/donations/stripe/checkout", { amount_usd: amount, name: donorName, note: donorNote });
      if (!data.url) throw new Error("Stripe did not return a checkout URL.");
      window.location.assign(data.url);
    } catch (error) {
      toast.error(error.response?.data?.detail || error.message || "Could not start Stripe checkout.");
    } finally {
      setPaymentBusy(false);
    }
  };

  const verifyCryptoDonation = async (event) => {
    event.preventDefault();
    setPaymentBusy(true);
    setCryptoResult(null);
    try {
      const { data } = await api.post("/donations/crypto/verify", {
        network: cryptoNetwork,
        transaction_id: transactionId.trim(),
        name: donorName,
        note: donorNote,
      });
      setCryptoResult(data);
      if (data.status === "confirmed") {
        toast.success("Transaction confirmed. Your donation is on the supporter wall.");
        setTransactionId("");
        await loadDonations();
      } else {
        toast.info("Transaction found; waiting for network confirmation. Check again shortly.");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Could not verify that transaction.");
    } finally {
      setPaymentBusy(false);
    }
  };

  return (
    <div className="swat-bg min-h-screen">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-32 pb-6 px-6 max-w-3xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#4A6B8A]/30 text-[11px] text-[#5B8DB8] mb-5">
          <Sparkles size={12} /> Simple & Transparent Pricing
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white reveal">
          Pick your entry
        </h1>
        <p className="text-[#E5E7EB]/60 mt-3 text-sm sm:text-base reveal" style={{ animationDelay: ".1s" }}>
          Join the waitlist for free, upgrade to Premium Beta, or fuel development with community support.
        </p>
      </section>

      {/* Community Donation & Support Hub */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto pb-10">
        <div className="swat-glass rounded-3xl p-5 sm:p-7 border border-[#4A6B8A]/30 shadow-2xl relative overflow-hidden">
          {/* Subtle Background Glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#5B8DB8]/15 blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500/20 to-purple-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                <Heart size={20} className="animate-pulse" />
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Community Fuel & Tip Hub</span>
                  {donations && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Verified</span>}
                </div>
                <div className="text-xs text-[#E5E7EB]/50">Only completed Stripe payments and confirmed on-chain transactions appear here.</div>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-full bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white text-xs font-bold px-5 py-2.5 shadow-[0_0_20px_rgba(91,141,184,0.35)] gap-2 transition-all hover:scale-105"
            >
              <Heart size={14} className="fill-white" /> Tip / Donate to SWAT.BIO
            </Button>
          </div>

          {/* Progress Goal & Stats */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#E5E7EB]/40 font-semibold">Confirmed card donations</div>
              <div className="mt-1 font-display text-3xl font-black text-white">{donationsLoading ? "…" : `$${donationTotal.toLocaleString()}`}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#E5E7EB]/40 font-semibold">USD support goal</div>
              <div className="mt-1 font-display text-3xl font-black text-[#5B8DB8]">{supportGoal ? `$${supportGoal.toLocaleString()}` : "Not set"}</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#E5E7EB]/40 font-semibold">USD goal progress</div>
              <div className="mt-1 font-display text-3xl font-black text-emerald-400">{supportGoal ? `${supportPercent}%` : "—"}</div>
            </div>
          </div>

          {/* Progress Bar */}
          {supportGoal > 0 && <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[#08090B] border border-[#4A6B8A]/30 p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#5B8DB8] via-[#38bdf8] to-[#34d399] shadow-[0_0_12px_rgba(56,189,248,0.5)] transition-all duration-700"
              style={{ width: `${supportPercent}%` }}
            />
          </div>}

          {Object.keys(donations?.totals_by_currency || {}).some((currency) => currency !== "USD") && <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(donations.totals_by_currency).filter(([currency]) => currency !== "USD").map(([currency, amount]) => <span key={currency} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] font-mono text-white/60">{Number(amount).toFixed(8).replace(/0+$/, "").replace(/\.$/, "")} {currency} confirmed</span>)}
          </div>}

          {/* Supporter Shoutout Wall */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Trophy size={14} className="text-yellow-400" /> Recent Supporters Wall
              </div>
              <span className="text-[10px] font-mono text-[#E5E7EB]/50">{donationFeed.length} verified recent</span>
            </div>

            {donationsError ? <div className="py-8 text-center text-xs text-red-200/70">Donation records are temporarily unavailable.</div> : donationFeed.length === 0 ? <div className="py-8 text-center text-xs text-white/45">No confirmed donations yet.</div> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {donationFeed.map((entry, idx) => (
                <div
                  key={`${entry.network || entry.currency}-${entry.created_at}-${idx}`}
                  className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#5B8DB8]/40 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{entry.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[#5B8DB8]/20 text-[#5B8DB8] border border-[#5B8DB8]/30 font-mono">
                        {entry.network || "Stripe"}
                      </span>
                    </div>
                    <span className="font-display font-black text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                      +{entry.currency === "USD" ? "$" : ""}{Number(entry.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })} {entry.currency}
                    </span>
                  </div>
                  {entry.note && (
                    <div className="text-xs text-[#E5E7EB]/70 italic mt-0.5">
                      "{entry.note}"
                    </div>
                  )}
                  <div className="text-[10px] text-[#E5E7EB]/40 font-mono mt-2 text-right">
                    {new Date(entry.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>}
          </div>
        </div>
      </section>

      {/* Pricing Tiers (Waitlist & Premium) */}
      <section className="px-4 sm:px-6 max-w-5xl mx-auto grid md:grid-cols-2 gap-6 pb-16 items-stretch">
        {/* Waitlist Card */}
        <div className="swat-glass rounded-3xl p-8 flex flex-col border border-white/10 shadow-xl">
          <div className="flex items-center gap-2 text-[#E5E7EB]/70 text-sm font-semibold">
            <Clock size={16} /> Free Waitlist
          </div>
          <div className="mt-3 font-display text-4xl font-extrabold text-white">Free</div>
          <p className="text-[#E5E7EB]/50 text-sm mt-1">Reserve your exclusive @username for public launch.</p>

          <p className="mt-5 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/55">The public launch date has not been announced.</p>

          <ul className="mt-6 space-y-3 flex-1">
            {WAITLIST.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-[#E5E7EB]/75">
                <Check size={16} className="text-[#5B8DB8] shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <Button
            data-testid="pricing-waitlist-cta"
            onClick={() => navigate("/auth?tab=register")}
            variant="outline"
            className="mt-6 rounded-2xl border-[#4A6B8A]/50 bg-transparent hover:bg-[#4A6B8A]/15 py-6 text-sm font-semibold text-white"
          >
            Join Free Waitlist
          </Button>
        </div>

        {/* Premium Beta Card */}
        <div
          className="relative rounded-3xl p-8 flex flex-col border border-[#5B8DB8]/50 shadow-[0_0_50px_rgba(91,141,184,0.25)] overflow-hidden"
          style={{ background: "linear-gradient(160deg, rgba(20,24,32,0.95), rgba(74,107,138,0.2))" }}
        >
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-[#5B8DB8]/25 blur-3xl" />
          <div className="absolute top-5 right-5 flex gap-2">
            <Badge className="bg-[#5B8DB8] text-white border-0 text-[10px]">BETA</Badge>
            <Badge className="bg-purple-500 text-white border-0 text-[10px]">TESTER</Badge>
          </div>

          <div className="flex items-center gap-2 text-[#5B8DB8] text-sm font-semibold relative">
            <Zap size={16} /> Premium Beta Pass
          </div>
          <div className="mt-3 font-display text-4xl font-extrabold text-white relative">
            $4.99 <span className="text-base font-normal text-[#E5E7EB]/40">/ one-time lifetime</span>
          </div>
          <p className="text-[#E5E7EB]/60 text-sm mt-1 relative">Skip the waitlist with instant platform access & full creator features.</p>

          <ul className="mt-6 space-y-3 flex-1 relative">
            {PREMIUM.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-[#E5E7EB]/90">
                <Check size={16} className="text-[#5B8DB8] shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <Button
            data-testid="pricing-premium-cta"
            onClick={() => navigate("/auth?tab=register")}
            className="mt-6 rounded-2xl bg-[#5B8DB8] hover:bg-[#4A6B8A] text-white py-6 text-sm font-bold shadow-[0_0_24px_rgba(91,141,184,0.4)] relative"
          >
            Get Instant Beta Access &rarr;
          </Button>
        </div>
      </section>

      {/* Multi-Method Donation Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-xl border-[#5B8DB8]/40 bg-[#0c0f15]/98 text-white shadow-[0_25px_80px_rgba(0,0,0,0.85)] rounded-3xl p-0 overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#5B8DB8]/20 border border-[#5B8DB8]/40 flex items-center justify-center text-[#5B8DB8]">
                <Heart size={20} className="fill-[#5B8DB8]" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">Support SWAT.BIO</DialogTitle>
                <div className="text-xs text-[#E5E7EB]/50">Choose your preferred payment or crypto method</div>
              </div>
            </div>
          </div>

          <div className="flex gap-1 border-b border-white/10 bg-black/20 p-3">
            {[{ id: "stripe", label: "Card" }, { id: "crypto", label: "Crypto" }].map((tab) => (
              <button key={tab.id} type="button" onClick={() => setModalTab(tab.id)} className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold ${modalTab === tab.id ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-h-[65dvh] space-y-4 overflow-y-auto p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-white/75">Name on supporter wall</label>
                <Input value={donorName} onChange={(event) => setDonorName(event.target.value)} maxLength={48} placeholder="Anonymous" className="h-9 border-white/10 bg-black/30 text-xs" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-white/75">Note (optional)</label>
                <Input value={donorNote} onChange={(event) => setDonorNote(event.target.value)} maxLength={240} placeholder="Add a short note" className="h-9 border-white/10 bg-black/30 text-xs" />
              </div>
            </div>

            {modalTab === "stripe" ? (
              <form onSubmit={startStripeCheckout} className="space-y-3">
                <p className="text-xs text-white/55">Card payments are confirmed by Stripe before appearing on the supporter wall.</p>
                {!donations?.stripe_enabled && <div className="rounded-md border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-100/75">Card payments are not configured on the production server.</div>}
                <div className="flex flex-wrap gap-1.5">
                  {[5, 10, 25, 50, 100].map((amount) => <button key={amount} type="button" onClick={() => setAmountUsd(String(amount))} className={`rounded-md border px-3 py-1.5 text-xs ${Number(amountUsd) === amount ? "border-[#5B8DB8] bg-[#5B8DB8]/20 text-white" : "border-white/10 text-white/60 hover:bg-white/5"}`}>${amount}</button>)}
                </div>
                <label className="block text-xs font-semibold text-white/75">Amount (USD)</label>
                <Input type="number" min="1" max="10000" step="1" required value={amountUsd} onChange={(event) => setAmountUsd(event.target.value)} className="h-10 border-white/10 bg-black/30 font-mono" />
                <Button type="submit" disabled={paymentBusy || !donations?.stripe_enabled} className="h-10 w-full gap-2 bg-[#5B8DB8] text-white hover:bg-[#4A6B8A] disabled:opacity-40">
                  {paymentBusy ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />} Continue to secure checkout
                </Button>
              </form>
            ) : (
              <form onSubmit={verifyCryptoDonation} className="space-y-3">
                <label className="block text-xs font-semibold text-white/75">Network</label>
                <div className="grid grid-cols-3 gap-2">
                  {CRYPTO_NETWORKS.map((network) => {
                    const Icon = network.icon;
                    const enabled = !!donations?.wallets?.[network.id];
                    return <button key={network.id} type="button" disabled={!enabled} onClick={() => { setCryptoNetwork(network.id); setCryptoResult(null); }} className={`flex items-center justify-center gap-1.5 rounded-md border px-2 py-2 text-xs ${cryptoNetwork === network.id ? "border-[#5B8DB8] bg-[#5B8DB8]/15 text-white" : "border-white/10 text-white/55"} disabled:cursor-not-allowed disabled:opacity-30`}><Icon size={14} style={{ color: network.color }} />{network.symbol}</button>;
                  })}
                </div>
                {selectedWallet ? <div className="space-y-2 rounded-md border border-white/10 bg-black/30 p-3">
                  <div className="text-[10px] font-semibold uppercase text-white/45">Send only {selectedCrypto.symbol} on {selectedCrypto.name}</div>
                  <div className="flex items-center gap-2">
                    <code className="min-w-0 flex-1 break-all text-[11px] text-white/80">{selectedWallet}</code>
                    <Button type="button" size="icon" variant="outline" aria-label="Copy wallet address" onClick={() => copyWallet(cryptoNetwork, selectedWallet)} className="h-8 w-8 shrink-0 border-white/15">{copiedId === cryptoNetwork ? <Check size={14} /> : <Copy size={14} />}</Button>
                  </div>
                </div> : <div className="rounded-md border border-amber-400/20 bg-amber-400/5 p-3 text-xs text-amber-100/75">{selectedCrypto.name} donations are not configured on the production server.</div>}
                <label className="block text-xs font-semibold text-white/75">Transaction ID</label>
                <Input value={transactionId} onChange={(event) => { setTransactionId(event.target.value); setCryptoResult(null); }} required placeholder="Paste the transaction hash" className="h-10 border-white/10 bg-black/30 font-mono text-xs" />
                {cryptoResult && <div className={`rounded-md border p-3 text-xs ${cryptoResult.status === "confirmed" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-100/75" : "border-amber-400/20 bg-amber-400/5 text-amber-100/75"}`}>{cryptoResult.status === "confirmed" ? `Confirmed: ${cryptoResult.amount} ${cryptoResult.currency}` : "Transaction found; awaiting network confirmation. Submit again to recheck."}</div>}
                <Button type="submit" disabled={paymentBusy || !selectedWallet || !transactionId.trim()} className="h-10 w-full gap-2 bg-[#5B8DB8] text-white hover:bg-[#4A6B8A] disabled:opacity-40">
                  {paymentBusy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Verify transaction
                </Button>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 flex justify-end bg-[#07080b]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              className="border-white/15 text-xs text-white/70 h-8 rounded-xl"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
