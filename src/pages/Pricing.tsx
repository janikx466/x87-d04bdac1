import React from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free Trial",
    credits: 5,
    price: "Free",
    features: ["5 vault credits", "PIN-protected vaults", "QR code sharing", "Basic support"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Pro",
    credits: 500,
    price: "Redeem Code",
    features: ["500 vault credits", "All Free features", "Priority support", "Extended expiry"],
    cta: "Redeem Pro Code",
    highlight: true,
  },
  {
    name: "Premium",
    credits: 1200,
    price: "Redeem Code",
    features: ["1200 vault credits", "All Pro features", "Self-destruct vaults", "Admin dashboard", "Premium QR styles"],
    cta: "Redeem Premium Code",
    highlight: false,
  },
];

const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-16">
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          Simple <span className="text-green-500">Pricing</span>
        </h1>
        <p className="text-white/50 mb-12">Choose a plan that fits your needs</p>

        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`p-8 rounded-3xl border text-left ${t.highlight ? "border-green-500/50 bg-green-500/5" : "border-white/10 bg-white/5"}`}
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
              <Link
                to={t.name === "Free Trial" ? "/auth" : "/dashboard"}
                className="block text-center py-3 rounded-xl font-semibold transition"
                style={{
                  background: t.highlight ? "linear-gradient(135deg, #22c55e, #16a34a)" : "rgba(255,255,255,0.1)",
                  color: "white",
                }}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
