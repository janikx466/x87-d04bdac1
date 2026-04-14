import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free",
    credits: 5,
    price: "Free",
    priceLabel: "forever",
    features: ["5 vault credits", "PIN-protected vaults", "QR code sharing", "Basic support"],
    cta: "Get Started",
    highlight: false,
    planKey: null,
  },
  {
    name: "Pro",
    credits: 500,
    price: "$2",
    priceLabel: "/month",
    features: ["500 credits", "Advanced Security", "Stylish QR Code", "Fast Speed", "Priority Support"],
    cta: "Activate Pro",
    highlight: true,
    planKey: "Pro",
  },
  {
    name: "Premium",
    credits: 1200,
    price: "$6",
    priceLabel: "/month",
    features: ["1200 credits", "Ultra Advanced Security", "Stylish QR Code", "Ultra Fast Speed", "Extended Features"],
    cta: "Activate Premium",
    highlight: false,
    planKey: "Premium",
  },
  {
    name: "Elite",
    credits: 3500,
    price: "$20",
    priceLabel: "/month",
    features: ["3500 credits", "Business Type Access", "Heavy Security", "Full Access", "Stylish QR Code", "Premium Support"],
    cta: "Activate Elite",
    highlight: false,
    planKey: "Elite",
  },
  {
    name: "Custom",
    credits: null,
    price: "Custom",
    priceLabel: "",
    features: ["Unlimited credits", "Dedicated support", "Custom features", "SLA guarantee", "Priority processing"],
    cta: "Contact Us",
    highlight: false,
    planKey: "Custom",
  },
];

const Pricing: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-4 py-16">
      <div className="max-w-6xl mx-auto text-center">
        <Link to={userData ? "/dashboard" : "/"} className="text-white/50 hover:text-white text-sm">← Back</Link>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 mt-4">
          Simple <span className="text-green-500">Pricing</span>
        </h1>
        <p className="text-white/50 mb-12">Choose a plan that fits your needs. All paid plans expire after 30 days.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`p-5 rounded-3xl border text-left transition-all ${t.highlight ? "border-green-500/50 bg-green-500/5 scale-[1.02]" : "border-white/10 bg-white/5"}`}
            >
              <h3 className="text-lg font-semibold mb-1">{t.name}</h3>
              <p className="text-2xl font-bold mb-0">
                {t.price}<span className="text-sm font-normal text-white/40">{t.priceLabel}</span>
              </p>
              {t.credits && <p className="text-xs text-white/40 mb-4">{t.credits} credits</p>}
              {!t.credits && <p className="text-xs text-white/40 mb-4">Tailored for you</p>}
              <ul className="space-y-2 mb-6">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  if (!t.planKey) {
                    navigate(userData ? "/dashboard" : "/auth");
                  } else if (t.planKey === "Custom") {
                    navigate(userData ? "/custom-plan" : "/auth");
                  } else {
                    navigate(userData ? `/billing?plan=${t.planKey}` : "/auth");
                  }
                }}
                className="block w-full text-center py-2.5 rounded-xl font-semibold transition text-sm"
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
      </div>
    </div>
  );
};

export default Pricing;