import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { redeemCode } from "@/lib/worker";
import { Check } from "lucide-react";
import { toast } from "sonner";
import OrbitalLoader from "@/components/OrbitalLoader";

const tiers = [
  {
    name: "Free Trial",
    credits: 5,
    price: "Free",
    features: ["5 vault credits", "PIN-protected vaults", "QR code sharing", "Basic support"],
    cta: "Get Started",
    highlight: false,
    redeemable: false,
  },
  {
    name: "Pro",
    credits: 500,
    price: "Redeem Code",
    features: ["500 vault credits", "All Free features", "Priority support", "Extended expiry"],
    cta: "Activate Pro",
    highlight: true,
    redeemable: true,
  },
  {
    name: "Premium",
    credits: 1200,
    price: "Redeem Code",
    features: ["1200 vault credits", "All Pro features", "Self-destruct vaults", "Admin dashboard", "Premium QR styles"],
    cta: "Activate Premium",
    highlight: false,
    redeemable: true,
  },
];

const Pricing: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [redeemInput, setRedeemInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const handleRedeem = async () => {
    if (!redeemInput.trim()) return toast.error("Enter a redeem code");
    if (!userData?.uid) return toast.error("Please login first");
    setRedeeming(true);
    try {
      const res = await redeemCode(redeemInput.trim(), userData.uid);
      toast.success(`Redeemed! +${res.addedCredits} credits (${res.plan})`);
      setRedeemInput("");
      setSelectedPlan(null);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Redeem failed");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-16">
      <div className="max-w-5xl mx-auto text-center">
        <Link to={userData ? "/dashboard" : "/"} className="text-white/50 hover:text-white text-sm">← Back</Link>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 mt-4">
          Simple <span className="text-green-500">Pricing</span>
        </h1>
        <p className="text-white/50 mb-12">Choose a plan that fits your needs</p>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`p-8 rounded-3xl border text-left transition-all ${t.highlight ? "border-green-500/50 bg-green-500/5" : "border-white/10 bg-white/5"} ${selectedPlan === t.name ? "ring-2 ring-green-500" : ""}`}
            >
              <h3 className="text-lg font-semibold mb-1">{t.name}</h3>
              <p className="text-3xl font-bold mb-1">{t.price}</p>
              <p className="text-xs text-white/40 mb-6">{t.credits} credits</p>
              <ul className="space-y-3 mb-8">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <Check className="w-4 h-4 text-green-500" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  if (!t.redeemable) {
                    navigate(userData ? "/dashboard" : "/auth");
                  } else {
                    setSelectedPlan(t.name);
                  }
                }}
                className="block w-full text-center py-3 rounded-xl font-semibold transition"
                style={{
                  background: t.highlight ? "linear-gradient(135deg, #22c55e, #16a34a)" : "rgba(255,255,255,0.1)",
                  color: "white",
                }}
              >
                {t.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Billing summary + Redeem input */}
        {selectedPlan && (
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-white/5 border border-white/10 text-left">
            <h3 className="font-bold text-lg mb-3">Activate {selectedPlan} Plan</h3>
            <div className="mb-4 text-sm text-white/60">
              <p>Plan: <span className="text-white font-medium">{selectedPlan}</span></p>
              <p>Credits: <span className="text-white font-medium">{selectedPlan === "Pro" ? 500 : 1200}</span></p>
              <p>Method: <span className="text-white font-medium">Redeem Code</span></p>
            </div>
            <div className="flex gap-2">
              <input
                value={redeemInput}
                onChange={(e) => setRedeemInput(e.target.value)}
                placeholder="Enter redeem code..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
              />
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="px-5 py-2 rounded-xl font-semibold text-white transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
              >
                {redeeming ? <OrbitalLoader text="" /> : "Redeem"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pricing;
