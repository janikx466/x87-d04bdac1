import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { redeemCode } from "@/lib/worker";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import OrbitalLoader from "@/components/OrbitalLoader";
import { Check } from "lucide-react";

const planCredits: Record<string, number> = {
  Pro: 500,
  Premium: 1200,
  Elite: 3500,
};

const planDetails: Record<string, { name: string; price: string; credits: number; features: string[] }> = {
  Pro: { name: "Pro", price: "$2/month", credits: 500, features: ["500 credits", "Advanced Security", "Stylish QR Code", "Fast Speed", "Priority Support"] },
  Premium: { name: "Premium", price: "$6/month", credits: 1200, features: ["1200 credits", "Ultra Advanced Security", "Stylish QR Code", "Ultra Fast Speed", "Extended Features"] },
  Elite: { name: "Elite", price: "$20/month", credits: 3500, features: ["3500 credits", "Business Type Access", "Heavy Security", "Full Access", "Stylish QR Code", "Premium Support"] },
};

const Billing: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planKey = searchParams.get("plan") || "Pro";
  const plan = planDetails[planKey] || planDetails.Pro;

  const [redeemInput, setRedeemInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  const handleRedeem = async () => {
    if (!redeemInput.trim()) return toast.error("Enter a redeem code");
    if (!userData?.uid) return toast.error("Please login first");
    setRedeeming(true);
    try {
      const res = await redeemCode(redeemInput.trim(), userData.uid);

      // Determine credits from plan in the redeem response
      const resPlan = res.plan || planKey;
      const credits = planCredits[resPlan] || res.addedCredits || plan.credits;

      // Update user with plan, credits, and 30-day expiry
      const now = new Date();
      const expiry = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await updateDoc(doc(db, "users", userData.uid), {
        planName: resPlan,
        credits,
        planStart: serverTimestamp(),
        planExpiry: expiry,
      });

      toast.success(`🎉 ${resPlan} Plan Activated! +${credits} credits`);
      setRedeemInput("");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Redeem failed");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-16">
      <div className="max-w-md mx-auto">
        <Link to="/pricing" className="text-white/50 hover:text-white text-sm">← Back to Plans</Link>

        <div className="mt-6 p-8 rounded-3xl bg-white/5 border border-white/10">
          <h1 className="text-2xl font-bold mb-6">Activate {plan.name} Plan</h1>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
            <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
            <p className="text-3xl font-bold text-green-500 mb-1">{plan.price}</p>
            <p className="text-xs text-white/40 mb-4">{plan.credits} credits • 30-day access</p>
            <ul className="space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <Check className="w-4 h-4 text-green-500" /> {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
            <h4 className="font-medium text-sm mb-3 text-white/60">Billing Summary</h4>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/50">Plan</span><span>{plan.name}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/50">Credits</span><span>{plan.credits}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/50">Duration</span><span>30 days</span>
            </div>
            <div className="flex justify-between text-sm font-bold mt-3 pt-3 border-t border-white/10">
              <span>Total</span><span className="text-green-500">{plan.price}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Redeem Code</label>
            <div className="flex gap-2">
              <input value={redeemInput} onChange={(e) => setRedeemInput(e.target.value)} placeholder="Enter redeem code..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30" />
              <button onClick={handleRedeem} disabled={redeeming} className="px-5 py-2.5 rounded-xl font-semibold text-white transition disabled:opacity-50" style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                {redeeming ? "..." : "Redeem"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;
